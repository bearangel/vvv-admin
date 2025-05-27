import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleStatusDto } from './dto/role-status.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { Role, RoleStatus, RoleType } from './entities/role.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';
import { PermissionsService } from '../permissions/permissions.service';
import { AssignPermissionsToRoleDto } from '../permissions/dto/assign-permissions-to-role.dto';
import { Permission, PermissionStatus } from '../permissions/entities/permission.entity'; // Import Permission

// Interface for paginated response
export interface PaginatedRolesResponse {
  data: Role[];
  total: number;
  page: number;
  pageSize: number;
}

// Helper type for Supabase roles record (snake_case)
interface SupabaseRole {
  id: string;
  name: string;
  description?: string;
  tenant_id?: string | null;
  type: RoleType;
  status: RoleStatus;
  created_at: string;
  updated_at: string;
}

// Helper to check if an error is a PostgrestError (can be moved to a shared utility)
function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error.code === 'string' && typeof error.details === 'string' && typeof error.message === 'string' && typeof error.hint === 'string';
}


@Injectable()
export class RolesService {
  public readonly logger = new Logger(RolesService.name);
  private readonly rolesTableName = 'roles';
  private readonly rolePermissionsTableName = 'role_permissions';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private mapSupabaseRecordToRole(record: SupabaseRole): Role {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      tenantId: record.tenant_id,
      type: record.type,
      status: record.status,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  private handleSupabaseError(error: PostgrestError, context?: string): never {
    this.logger.error(`Supabase error in ${context || 'operation'}: ${error.message}`, JSON.stringify(error));
    if (error.code === '23505') {
      let userMessage = 'A role with this name already exists.';
      if (error.details?.includes('(name, tenant_id)')) {
        userMessage = 'A role with this name already exists for this tenant.';
      } else if (error.details?.includes('(name)') && error.details?.includes('tenant_id IS NULL')) {
         userMessage = 'A system role with this name already exists.';
      } else if (error.details?.includes('role_permissions_pkey') || error.details?.includes('role_id') && error.details?.includes('permission_id')) {
        userMessage = 'A role-permission assignment conflict occurred. One or more permissions might already be assigned or a unique constraint violated.';
      }
      throw new ConflictException(userMessage);
    }
    if (error.code === '22P02') { 
        throw new BadRequestException(`Invalid input data: ${error.details || error.message}`);
    }
    if (error.code === 'PGRST116') { 
        throw new NotFoundException(`The requested resource was not found.`);
    }
    if (error.code === '23503') { 
        throw new BadRequestException(`Invalid input: ${error.details || error.message}. One or more referenced entities do not exist.`);
    }
    throw new InternalServerErrorException(`Database error in ${context || 'operation'}: ${error.message}`);
  }

  // --- CREATE ---
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    this.logger.log(`Service: Creating role with data: ${JSON.stringify(createRoleDto)}`);
    const supabaseClient = this.supabaseService.getClient();
    let tenantIdForDb: string | null | undefined = createRoleDto.tenantId;

    if (createRoleDto.type === RoleType.SYSTEM) {
      if (tenantIdForDb) this.logger.warn(`For System role, tenantId '${tenantIdForDb}' will be ignored.`);
      tenantIdForDb = null;
    } else if (createRoleDto.type === RoleType.TENANT_CUSTOM && !tenantIdForDb) {
      throw new BadRequestException('tenantId is required for TenantCustom roles.');
    }

    await this.checkRoleNameUniqueness(createRoleDto.name, createRoleDto.type, tenantIdForDb);

    const roleToInsert = {
      name: createRoleDto.name,
      description: createRoleDto.description,
      tenant_id: tenantIdForDb,
      type: createRoleDto.type,
      status: RoleStatus.ACTIVE,
    };

    try {
      const { data, error } = await supabaseClient.from(this.rolesTableName).insert(roleToInsert).select().single();
      if (error) this.handleSupabaseError(error, 'insert role');
      if (!data) throw new InternalServerErrorException('Role creation failed: No data returned.');
      this.logger.log(`AUDIT_LOG: Role created. ID: ${data.id}, Name: ${data.name}`);
      return this.mapSupabaseRecordToRole(data as SupabaseRole);
    } catch (e) {
      if (e instanceof ConflictException || e instanceof BadRequestException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error during role insertion: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Unexpected error creating role.');
    }
  }
  
  // --- FIND ALL ---
  async findAll(queryRoleDto: QueryRoleDto): Promise<PaginatedRolesResponse> {
    this.logger.log(`Service: Finding all roles with query: ${JSON.stringify(queryRoleDto)}`);
    const supabaseClient = this.supabaseService.getClient();
    const page = queryRoleDto.page || 1;
    const pageSize = queryRoleDto.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient.from(this.rolesTableName).select('*', { count: 'exact' });

    if (queryRoleDto.tenantId) {
      query = query.eq('tenant_id', queryRoleDto.tenantId);
    }
    if (queryRoleDto.name) {
      query = query.ilike('name', `%${queryRoleDto.name}%`);
    }
    if (queryRoleDto.type) {
      query = query.eq('type', queryRoleDto.type);
      if (queryRoleDto.type === RoleType.SYSTEM) {
         query = query.is('tenant_id', null);
      }
    }
    if (queryRoleDto.status) {
      query = query.eq('status', queryRoleDto.status);
    }
    query = query.order('name', { ascending: true }).range(offset, offset + pageSize - 1);
    try {
      const { data, error, count } = await query;
      if (error) this.handleSupabaseError(error, 'findAll roles');
      const roles = data ? data.map(d => this.mapSupabaseRecordToRole(d as SupabaseRole)) : [];
      return { data: roles, total: count || 0, page, pageSize };
    } catch (e) {
      if (e instanceof InternalServerErrorException || e instanceof NotFoundException) throw e;
      this.logger.error(`Unexpected error in findAll roles: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Unexpected error fetching roles.');
    }
  }

  // --- FIND ONE ---
  async findOne(id: string): Promise<Role> {
    this.logger.log(`Service: Finding role with id: ${id}`);
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.rolesTableName).select('*').eq('id', id).maybeSingle();
      if (error) this.handleSupabaseError(error, `findOne role ${id}`);
      if (!data) throw new NotFoundException(`Role with id ${id} not found.`);
      return this.mapSupabaseRecordToRole(data as SupabaseRole);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in findOne role ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`Unexpected error fetching role ${id}.`);
    }
  }

  // --- UPDATE ---
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    this.logger.log(`Service: Updating role ${id} with data: ${JSON.stringify(updateRoleDto)}`);
    const existingRole = await this.findOne(id);
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      await this.checkRoleNameUniqueness(updateRoleDto.name, existingRole.type, existingRole.tenantId);
    }
    const roleToUpdate: Partial<SupabaseRole> = {
      name: updateRoleDto.name,
      description: updateRoleDto.description,
      updated_at: new Date().toISOString(),
    };
    Object.keys(roleToUpdate).forEach(key => roleToUpdate[key] === undefined && delete roleToUpdate[key]);
    if (Object.keys(roleToUpdate).length <= 1 && !updateRoleDto.name && !updateRoleDto.description) {
        this.logger.log(`No updatable fields provided for role ${id}. Returning current role.`);
        return existingRole;
    }
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.rolesTableName).update(roleToUpdate).eq('id', id).select().single();
      if (error) this.handleSupabaseError(error, `update role ${id}`);
      if (!data) throw new InternalServerErrorException('Failed to update role: No data returned.');
      this.logger.log(`AUDIT_LOG: Role updated. ID: ${id}, Changes: ${JSON.stringify(updateRoleDto)}`);
      return this.mapSupabaseRecordToRole(data as SupabaseRole);
    } catch (e) {
      if (e instanceof ConflictException || e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in update role ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`Unexpected error updating role ${id}.`);
    }
  }

  // --- UPDATE STATUS ---
  async updateStatus(id: string, roleStatusDto: RoleStatusDto): Promise<Role> {
    this.logger.log(`Service: Updating status for role ${id} to: ${roleStatusDto.status}`);
    await this.findOne(id);
    const statusUpdate = { status: roleStatusDto.status, updated_at: new Date().toISOString() };
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.rolesTableName).update(statusUpdate).eq('id', id).select().single();
      if (error) this.handleSupabaseError(error, `update role status ${id}`);
      if (!data) throw new InternalServerErrorException('Failed to update role status: No data returned.');
      this.logger.log(`Impact Note: Deactivating a role might affect permissions. Role ID: ${id}, New Status: ${roleStatusDto.status}`);
      this.logger.log(`AUDIT_LOG: Role status updated. ID: ${id}, NewStatus: ${roleStatusDto.status}`);
      return this.mapSupabaseRecordToRole(data as SupabaseRole);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in update role status ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`Unexpected error updating role status ${id}.`);
    }
  }

  // --- REMOVE ---
  async remove(id: string): Promise<void> {
     this.logger.log(`Service: Deleting role with id: ${id}`);
    await this.findOne(id); 
    this.logger.warn(`CRITICAL: Deleting role ${id}. Check if users are assigned this role. This check is currently not implemented. Also, related role_permissions will be deleted.`);
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { error: rpError } = await supabaseClient.from(this.rolePermissionsTableName).delete().eq('role_id', id);
      if (rpError) {
        this.logger.warn(`Could not delete old permissions for role ${id} from ${this.rolePermissionsTableName}, but proceeding with role deletion: ${rpError.message}`);
      }
      const { error } = await supabaseClient.from(this.rolesTableName).delete().eq('id', id);
      if (error) this.handleSupabaseError(error, `delete role ${id}`);
      this.logger.log(`AUDIT_LOG: Role deleted. ID: ${id}`);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in delete role ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`Unexpected error deleting role ${id}.`);
    }
  }

  // --- HELPER for Uniqueness Check ---
  private async checkRoleNameUniqueness(name: string, type: RoleType, tenantId?: string | null): Promise<void> {
    this.logger.log(`Checking role name uniqueness: Name="${name}", Type=${type}, TenantId=${tenantId || 'N/A'}`);
    const supabaseClient = this.supabaseService.getClient();
    let query = supabaseClient.from(this.rolesTableName).select('id', { count: 'exact' }).eq('name', name);
    if (type === RoleType.TENANT_CUSTOM && tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else if (type === RoleType.SYSTEM) {
      query = query.is('tenant_id', null);
    } else if (type === RoleType.TENANT_CUSTOM && !tenantId) {
      this.logger.warn(`Uniqueness check for TenantCustom role name "${name}" without a specific tenantId.`);
    }
    try {
      const { count, error } = await query;
      if (error) this.handleSupabaseError(error, 'checking role name uniqueness');
      if (count !== null && count > 0) {
        const message = type === RoleType.SYSTEM ? `A system role with the name '${name}' already exists.` : `A role with the name '${name}' already exists for this tenant.`;
        throw new ConflictException(message);
      }
    } catch (e) {
      if (e instanceof ConflictException || e instanceof InternalServerErrorException || e instanceof NotFoundException) throw e;
      this.logger.error(`Unexpected error during role name uniqueness check: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Error checking role name uniqueness.');
    }
  }

  // --- UPDATE ROLE PERMISSIONS ---
  async updateRolePermissions(roleId: string, assignPermissionsDto: AssignPermissionsToRoleDto): Promise<string[]> {
    this.logger.log(`Service: Updating permissions for role ${roleId}. Permission IDs: ${assignPermissionsDto.permissionIds.join(', ')}`);
    const supabaseClient = this.supabaseService.getClient();
    await this.findOne(roleId); 
    if (assignPermissionsDto.permissionIds.length > 0) {
      const foundPermissions = await this.permissionsService.findByIds(assignPermissionsDto.permissionIds);
      const foundActivePermissionIds = foundPermissions
        .filter(p => p.status === PermissionStatus.ACTIVE)
        .map(p => p.id);
      if (foundActivePermissionIds.length !== assignPermissionsDto.permissionIds.length) {
        const requestedIds = new Set(assignPermissionsDto.permissionIds);
        foundActivePermissionIds.forEach(id => requestedIds.delete(id));
        throw new BadRequestException(`One or more permissions are invalid or inactive: ${Array.from(requestedIds).join(', ')}`);
      }
    }
    this.logger.log(`Conceptual Note: This operation (delete existing, add new) should ideally be transactional.`);
    const { error: deleteError } = await supabaseClient.from(this.rolePermissionsTableName).delete().eq('role_id', roleId);
    if (deleteError) {
      this.logger.error(`Error deleting old permissions for role ${roleId}: ${deleteError.message}`, deleteError);
      this.handleSupabaseError(deleteError, `delete old role permissions for role ${roleId}`);
    }
    let assignedPermissionIds: string[] = [];
    if (assignPermissionsDto.permissionIds.length > 0) {
      const newAssignments = assignPermissionsDto.permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
      }));
      const { data: insertData, error: insertError } = await supabaseClient
        .from(this.rolePermissionsTableName).insert(newAssignments).select('permission_id');
      if (insertError) {
        this.logger.error(`Error inserting new permissions for role ${roleId}: ${insertError.message}`, insertError);
        this.handleSupabaseError(insertError, `insert new role permissions for role ${roleId}`);
      }
      assignedPermissionIds = insertData ? insertData.map(item => item.permission_id) : [];
    }
    this.logger.log(`AUDIT_LOG: Permissions updated for role ${roleId}. Assigned IDs: ${assignedPermissionIds.join(', ')}`);
    return assignedPermissionIds;
  }

  // --- GET ROLE PERMISSIONS ---
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    this.logger.log(`Service: Getting permissions for role ${roleId}`);
    await this.findOne(roleId); // Validate role exists

    const supabaseClient = this.supabaseService.getClient();
    const { data: rolePermissionLinks, error: rpError } = await supabaseClient
      .from(this.rolePermissionsTableName)
      .select('permission_id')
      .eq('role_id', roleId);

    if (rpError) {
      this.logger.error(`Error fetching permission IDs for role ${roleId}: ${rpError.message}`, rpError);
      this.handleSupabaseError(rpError, `fetch permission IDs for role ${roleId}`);
    }

    if (!rolePermissionLinks || rolePermissionLinks.length === 0) {
      return []; // No permissions assigned to this role
    }

    const permissionIds = rolePermissionLinks.map(link => link.permission_id);
    this.logger.log(`Found ${permissionIds.length} permission IDs for role ${roleId}. Fetching details.`);
    
    // Fetch full permission details using PermissionsService
    // This ensures we get Permission entities and reuse existing logic
    return this.permissionsService.findByIds(permissionIds);
  }
}

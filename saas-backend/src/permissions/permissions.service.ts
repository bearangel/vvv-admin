import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionStatusDto } from './dto/permission-status.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { Permission, PermissionStatus, PermissionOperationType } from './entities/permission.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';

// Interface for paginated response
export interface PaginatedPermissionsResponse {
  data: Permission[];
  total: number;
  page: number;
  pageSize: number;
}

// Helper type for Supabase permissions record (snake_case)
interface SupabasePermission {
  id: string;
  name: string;
  description?: string;
  resource_identifier: string;
  operation_type?: PermissionOperationType;
  status: PermissionStatus;
  created_at: string;
  updated_at: string;
}

// Helper to check if an error is a PostgrestError (can be shared)
function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error.code === 'string' && typeof error.details === 'string' && typeof error.message === 'string' && typeof error.hint === 'string';
}

@Injectable()
export class PermissionsService {
  public readonly logger = new Logger(PermissionsService.name);
  private readonly tableName = 'permissions';
  private readonly rolePermissionsTableName = 'role_permissions'; // For dependency check in remove

  constructor(private readonly supabaseService: SupabaseService) {}

  private mapSupabaseRecordToPermission(record: SupabasePermission): Permission {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      resourceIdentifier: record.resource_identifier,
      operationType: record.operation_type,
      status: record.status,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
  
  private handleSupabaseError(error: PostgrestError, context?: string): never {
    this.logger.error(`Supabase error in ${context || 'operation'}: ${error.message}`, JSON.stringify(error));
    if (error.code === '23505') { // Unique constraint violation
      let userMessage = 'This permission already exists.';
      if (error.details?.includes('(name)')) {
        userMessage = 'A permission with this name already exists.';
      } else if (error.details?.includes('(resource_identifier)')) {
        userMessage = 'A permission with this resource identifier already exists.';
      }
      throw new ConflictException(userMessage);
    }
    if (error.code === '22P02') {
        throw new BadRequestException(`Invalid input data: ${error.details || error.message}`);
    }
    if (error.code === 'PGRST116') { // Resource not found
        throw new NotFoundException(`The requested permission was not found.`);
    }
    throw new InternalServerErrorException(`Database error in ${context || 'operation'}: ${error.message}`);
  }

  // --- CREATE ---
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    this.logger.log(`Service: Creating permission with data: ${JSON.stringify(createPermissionDto)}`);
    // Uniqueness check for name and resourceIdentifier (delegated to DB constraint + handleSupabaseError)
    const permissionToInsert = {
      name: createPermissionDto.name,
      description: createPermissionDto.description,
      resource_identifier: createPermissionDto.resourceIdentifier,
      operation_type: createPermissionDto.operationType,
      status: PermissionStatus.ACTIVE,
    };
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.tableName).insert(permissionToInsert).select().single();
      if (error) this.handleSupabaseError(error, 'insert permission');
      if (!data) throw new InternalServerErrorException('Permission creation failed: No data returned.');
      this.logger.log(`AUDIT_LOG: Permission created. ID: ${data.id}, Name: ${data.name}, Resource: ${data.resource_identifier}`);
      return this.mapSupabaseRecordToPermission(data as SupabasePermission);
    } catch (e) {
      if (e instanceof ConflictException || e instanceof BadRequestException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error during permission insertion: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Unexpected error creating permission.');
    }
  }

  // --- FIND ALL ---
  async findAll(queryPermissionDto: QueryPermissionDto): Promise<PaginatedPermissionsResponse> {
    this.logger.log(`Service: Finding all permissions with query: ${JSON.stringify(queryPermissionDto)}`);
    const supabaseClient = this.supabaseService.getClient();
    const page = queryPermissionDto.page || 1;
    const pageSize = queryPermissionDto.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient.from(this.tableName).select('*', { count: 'exact' });

    if (queryPermissionDto.name) {
      query = query.ilike('name', `%${queryPermissionDto.name}%`);
    }
    if (queryPermissionDto.resourceIdentifier) {
      query = query.ilike('resource_identifier', `%${queryPermissionDto.resourceIdentifier}%`);
    }
    if (queryPermissionDto.status) {
      query = query.eq('status', queryPermissionDto.status);
    }

    query = query.order('name', { ascending: true }).range(offset, offset + pageSize - 1);

    try {
      const { data, error, count } = await query;
      if (error) this.handleSupabaseError(error, 'findAll permissions');
      const permissions = data ? data.map(d => this.mapSupabaseRecordToPermission(d as SupabasePermission)) : [];
      return { data: permissions, total: count || 0, page, pageSize };
    } catch (e) {
        if (e instanceof InternalServerErrorException || e instanceof NotFoundException) throw e;
        this.logger.error(`Unexpected error in findAll permissions: ${e.message}`, e.stack);
        throw new InternalServerErrorException('Unexpected error fetching permissions.');
    }
  }

  // --- FIND ONE ---
  async findOne(id: string): Promise<Permission> {
    this.logger.log(`Service: Finding permission with id: ${id}`);
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.tableName).select('*').eq('id', id).maybeSingle();
      if (error) this.handleSupabaseError(error, `findOne permission ${id}`);
      if (!data) throw new NotFoundException(`Permission with id ${id} not found.`);
      return this.mapSupabaseRecordToPermission(data as SupabasePermission);
    } catch (e) {
        if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
        this.logger.error(`Unexpected error in findOne permission ${id}: ${e.message}`, e.stack);
        throw new InternalServerErrorException(`Unexpected error fetching permission ${id}.`);
    }
  }

  // --- UPDATE ---
  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    this.logger.log(`Service: Updating permission ${id} with data: ${JSON.stringify(updatePermissionDto)}`);
    await this.findOne(id); // Check existence

    // Uniqueness checks for name and resourceIdentifier if they are being changed
    const supabaseClient = this.supabaseService.getClient();
    if (updatePermissionDto.name) {
        const { data: existingName, error: nameError } = await supabaseClient
            .from(this.tableName).select('id').eq('name', updatePermissionDto.name).neq('id', id).maybeSingle();
        if (nameError) this.handleSupabaseError(nameError, 'update permission - check name uniqueness');
        if (existingName) throw new ConflictException(`A permission with the name '${updatePermissionDto.name}' already exists.`);
    }
    if (updatePermissionDto.resourceIdentifier) {
        const { data: existingIdentifier, error: idError } = await supabaseClient
            .from(this.tableName).select('id').eq('resource_identifier', updatePermissionDto.resourceIdentifier).neq('id', id).maybeSingle();
        if (idError) this.handleSupabaseError(idError, 'update permission - check resource_identifier uniqueness');
        if (existingIdentifier) throw new ConflictException(`A permission with the resource identifier '${updatePermissionDto.resourceIdentifier}' already exists.`);
    }
    
    const permissionToUpdate: Partial<SupabasePermission> = {
      name: updatePermissionDto.name,
      description: updatePermissionDto.description,
      resource_identifier: updatePermissionDto.resourceIdentifier,
      operation_type: updatePermissionDto.operationType,
      updated_at: new Date().toISOString(),
    };
    Object.keys(permissionToUpdate).forEach(key => permissionToUpdate[key] === undefined && delete permissionToUpdate[key]);

    if (Object.keys(permissionToUpdate).length <= 1) { // only updated_at
        this.logger.log(`No updatable fields provided for permission ${id}. Returning current state.`);
        return this.findOne(id);
    }

    try {
      const { data, error } = await supabaseClient.from(this.tableName).update(permissionToUpdate).eq('id', id).select().single();
      if (error) this.handleSupabaseError(error, `update permission ${id}`);
      if (!data) throw new InternalServerErrorException('Failed to update permission: No data returned.');
      this.logger.log(`AUDIT_LOG: Permission updated. ID: ${id}, Changes: ${JSON.stringify(updatePermissionDto)}`);
      return this.mapSupabaseRecordToPermission(data as SupabasePermission);
    } catch (e) {
        if (e instanceof ConflictException || e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
        this.logger.error(`Unexpected error in update permission ${id}: ${e.message}`, e.stack);
        throw new InternalServerErrorException(`Unexpected error updating permission ${id}.`);
    }
  }

  // --- UPDATE STATUS ---
  async updateStatus(id: string, permissionStatusDto: PermissionStatusDto): Promise<Permission> {
    this.logger.log(`Service: Updating status for permission ${id} to: ${permissionStatusDto.status}`);
    await this.findOne(id); // Check existence

    const statusUpdate = {
      status: permissionStatusDto.status,
      updated_at: new Date().toISOString(),
    };
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.tableName).update(statusUpdate).eq('id', id).select().single();
      if (error) this.handleSupabaseError(error, `update permission status ${id}`);
      if (!data) throw new InternalServerErrorException('Failed to update permission status: No data returned.');
      this.logger.log(`Impact Note: Deactivating a permission will affect any role currently assigned this permission. Permission ID: ${id}, New Status: ${permissionStatusDto.status}`);
      this.logger.log(`AUDIT_LOG: Permission status updated. ID: ${id}, NewStatus: ${permissionStatusDto.status}`);
      return this.mapSupabaseRecordToPermission(data as SupabasePermission);
    } catch (e) {
        if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
        this.logger.error(`Unexpected error in update permission status ${id}: ${e.message}`, e.stack);
        throw new InternalServerErrorException(`Unexpected error updating permission status ${id}.`);
    }
  }

  // --- REMOVE ---
  async remove(id: string): Promise<void> {
    this.logger.log(`Service: Deleting permission with id: ${id}`);
    await this.findOne(id); // Check existence

    // Dependency Check
    const supabaseClient = this.supabaseService.getClient();
    const { count: assignmentCount, error: assignmentError } = await supabaseClient
      .from(this.rolePermissionsTableName)
      .select('role_id', { count: 'exact' })
      .eq('permission_id', id);

    if (assignmentError) {
        this.logger.error(`Error checking role_permissions for permission ${id}: ${assignmentError.message}`, assignmentError);
        // Depending on policy, might throw an error or proceed with caution
    }
    if (assignmentCount !== null && assignmentCount > 0) {
      this.logger.warn(`CRITICAL: Permission ${id} is currently assigned to ${assignmentCount} role(s). Deletion is prevented. Remove assignments first.`);
      throw new ConflictException(`Permission ${id} is assigned to ${assignmentCount} role(s). Cannot delete. Please remove assignments first.`);
    } else {
      this.logger.log(`CRITICAL: Deleting permission. Check assignments in 'role_permissions'. This check is currently not implemented. (Note: Implemented basic check)`);
    }
    
    try {
      const { error } = await supabaseClient.from(this.tableName).delete().eq('id', id);
      if (error) this.handleSupabaseError(error, `delete permission ${id}`);
      this.logger.log(`AUDIT_LOG: Permission deleted. ID: ${id}`);
    } catch (e) {
        if (e instanceof NotFoundException || e instanceof InternalServerErrorException || e instanceof ConflictException) throw e;
        this.logger.error(`Unexpected error in delete permission ${id}: ${e.message}`, e.stack);
        throw new InternalServerErrorException(`Unexpected error deleting permission ${id}.`);
    }
  }

  // --- FIND BY IDS (Helper used by RolesService) ---
  async findByIds(permissionIds: string[]): Promise<Permission[]> {
    if (!permissionIds || permissionIds.length === 0) return [];
    this.logger.log(`Service: Finding permissions by IDs: ${permissionIds.join(', ')}`);
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.tableName).select('*').in('id', permissionIds);
      if (error) this.handleSupabaseError(error, 'findByIds permissions');
      return data ? data.map(d => this.mapSupabaseRecordToPermission(d as SupabasePermission)) : [];
    } catch (e) {
        if (e instanceof InternalServerErrorException) throw e;
        this.logger.error(`Unexpected error in findByIds permissions: ${e.message}`, e.stack);
        throw new InternalServerErrorException('Unexpected error fetching permissions by IDs.');
    }
  }
}

import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { UpdateOrganizationUnitDto } from './dto/update-organization-unit.dto';
import { OrganizationUnitStatusDto } from './dto/organization-unit-status.dto';
import { QueryOrganizationUnitDto } from './dto/query-organization-unit.dto';
import { OrganizationUnit, OrganizationUnitStatus } from './entities/organization-unit.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { TenantsService } from '../tenants/tenants.service';
import { PostgrestError } from '@supabase/supabase-js';

// Interface for paginated response
export interface PaginatedOrganizationUnitsResponse {
  data: OrganizationUnit[];
  total: number;
  page: number;
  pageSize: number;
}

// Helper type for Supabase organization_units record (snake_case)
interface SupabaseOrganizationUnit {
  id: string;
  name: string;
  tenant_id: string;
  parent_id?: string | null;
  description?: string;
  leader_user_id?: string | null;
  status: OrganizationUnitStatus;
  created_at: string;
  updated_at: string;
}

// Helper to check if an error is a PostgrestError (can be shared)
function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error.code === 'string' && typeof error.details === 'string' && typeof error.message === 'string' && typeof error.hint === 'string';
}

@Injectable()
export class OrganizationService {
  public readonly logger = new Logger(OrganizationService.name);
  private readonly tableName = 'organization_units';
  private readonly usersTableName = 'user_profiles'; // For dependency check

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly tenantsService: TenantsService,
  ) {}

  private mapSupabaseRecordToOrgUnit(record: SupabaseOrganizationUnit): OrganizationUnit {
    return {
      id: record.id,
      name: record.name,
      tenantId: record.tenant_id,
      parentId: record.parent_id,
      description: record.description,
      leaderUserId: record.leader_user_id,
      status: record.status,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
  
  private handleSupabaseError(error: PostgrestError, context?: string): never {
    this.logger.error(`Supabase error in ${context || 'operation'}: ${error.message}`, JSON.stringify(error));
    if (error.code === '23505') {
      let userMessage = 'This organization unit already exists or violates a unique constraint.';
      if (error.details?.includes(`(${this.tableName}_tenant_id_parent_id_name_key)`)) { // Example constraint name
        userMessage = 'An organization unit with this name already exists under the same parent for this tenant.';
      } else if (error.details?.includes(`(${this.tableName}_tenant_id_name_null_parent_key)`)) { // Example for root uniqueness
         userMessage = 'An organization unit with this name already exists for this tenant at the root level.';
      }
      throw new ConflictException(userMessage);
    }
    if (error.code === '22P02') {
        throw new BadRequestException(`Invalid input data: ${error.details || error.message}`);
    }
    if (error.code === '23503') {
        throw new BadRequestException(`Invalid reference: ${error.details || error.message}. Ensure referenced tenant, parent, or leader user exist.`);
    }
    if (error.code === 'PGRST116') { 
        throw new NotFoundException(`The requested resource was not found.`);
    }
    throw new InternalServerErrorException(`Database error in ${context || 'operation'}: ${error.message}`);
  }

  // --- CREATE ---
  async create(createOrgUnitDto: CreateOrganizationUnitDto): Promise<OrganizationUnit> {
    this.logger.log(`Service: Creating organization unit with data: ${JSON.stringify(createOrgUnitDto)}`);
    const supabaseClient = this.supabaseService.getClient();

    await this.validateTenantAndParent(createOrgUnitDto.tenantId, createOrgUnitDto.parentId);
    await this.checkNameUniqueness(createOrgUnitDto.name, createOrgUnitDto.tenantId, createOrgUnitDto.parentId);

    const orgUnitToInsert = {
      name: createOrgUnitDto.name,
      tenant_id: createOrgUnitDto.tenantId,
      parent_id: createOrgUnitDto.parentId || null,
      description: createOrgUnitDto.description,
      leader_user_id: createOrgUnitDto.leaderUserId || null,
      status: OrganizationUnitStatus.ACTIVE,
    };

    try {
      const { data, error } = await supabaseClient.from(this.tableName).insert(orgUnitToInsert).select().single();
      if (error) this.handleSupabaseError(error, 'insert organization unit');
      if (!data) throw new InternalServerErrorException('Organization unit creation failed: No data returned.');
      this.logger.log(`AUDIT_LOG: OrganizationUnit created. ID: ${data.id}, Name: ${data.name}, TenantID: ${data.tenant_id}`);
      return this.mapSupabaseRecordToOrgUnit(data as SupabaseOrganizationUnit);
    } catch (e) {
      if (e instanceof ConflictException || e instanceof BadRequestException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error during organization unit insertion: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Unexpected error creating organization unit.');
    }
  }

  // --- FIND ALL / GET TREE ---
  async findAll(queryDto: QueryOrganizationUnitDto): Promise<PaginatedOrganizationUnitsResponse> {
    this.logger.log(`Service: Finding all organization units with query: ${JSON.stringify(queryDto)}`);
    const supabaseClient = this.supabaseService.getClient();
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient.from(this.tableName).select('*', { count: 'exact' }).eq('tenant_id', queryDto.tenantId);

    if (queryDto.name) {
      query = query.ilike('name', `%${queryDto.name}%`);
    }
    if (queryDto.status) {
      query = query.eq('status', queryDto.status);
    }
    if (queryDto.parentId === 'null') { // Handle 'null' string for root items
      query = query.is('parent_id', null);
    } else if (queryDto.parentId) {
      query = query.eq('parent_id', queryDto.parentId);
    }
    
    if (queryDto.level) {
        this.logger.warn(`Level filter requested (level: ${queryDto.level}). This is an advanced feature and might require specific DB setup (recursive CTEs) not directly implemented here via Supabase client. This query might not return accurate level-based results without such a setup. For now, it might only work for level 1 (parent_id is null) if combined with parentId='null'.`);
        if (queryDto.level === 1) {
            query = query.is('parent_id', null);
        }
    }

    if (queryDto.includeChildren) {
        this.logger.warn(`'includeChildren=true' requested for findAll. This typically implies returning a tree or all descendants. This flat list query does not build a tree. For full tree, use getTree(). For all descendants in flat list, a recursive query is needed.`);
        // For now, this flag doesn't change the flat list behavior of findAll.
        // A separate getTree method will handle tree construction.
    }

    query = query.order('name', { ascending: true }).range(offset, offset + pageSize - 1);

    try {
      const { data, error, count } = await query;
      if (error) this.handleSupabaseError(error, 'findAll organization units');
      const units = data ? data.map(d => this.mapSupabaseRecordToOrgUnit(d as SupabaseOrganizationUnit)) : [];
      return { data: units, total: count || 0, page, pageSize };
    } catch (e) {
      this.handleGenericError(e, 'findAll organization units');
    }
  }

  async getTree(tenantId: string, status?: OrganizationUnitStatus): Promise<OrganizationUnit[]> {
    this.logger.log(`Service: Building organization unit tree for tenant: ${tenantId}, status: ${status || 'any'}`);
    const supabaseClient = this.supabaseService.getClient();
    // This requires a recursive CTE, which Supabase supports via rpc calls to SQL functions.
    // For simplicity in this context, we'll fetch all units for the tenant and build the tree in memory.
    // This is NOT performant for large datasets. A DB-side recursive query is preferred.
    this.logger.warn("Building tree in memory: NOT performant for large datasets. Use DB-side recursion for production.");

    let query = supabaseClient.from(this.tableName).select('*').eq('tenant_id', tenantId);
    if (status) {
        query = query.eq('status', status);
    }
    query = query.order('name', {ascending: true});

    try {
        const { data, error } = await query;
        if (error) this.handleSupabaseError(error, 'getTree - fetch all units');
        
        const allUnits = data ? data.map(d => this.mapSupabaseRecordToOrgUnit(d as SupabaseOrganizationUnit)) : [];
        return this.buildTreeStructure(allUnits);

    } catch (e) {
        this.handleGenericError(e, 'getTree organization units');
    }
  }

  private buildTreeStructure(units: OrganizationUnit[], parentId: string | null = null): OrganizationUnit[] {
    return units
      .filter(unit => unit.parentId === parentId)
      .map(unit => ({
        ...unit,
        children: this.buildTreeStructure(units, unit.id), // Recursively find children
      }));
  }


  // --- FIND ONE (with optional children) ---
  async findOneWithHierarchy(id: string, includeChildren: boolean = false): Promise<OrganizationUnit> {
    this.logger.log(`Service: Finding org unit with id: ${id}, includeChildren: ${includeChildren}`);
    const unit = await this._findOne(id); // Fetches the main unit, throws if not found

    if (includeChildren) {
      this.logger.log(`Fetching children for org unit ${id}. This is a simplified version (direct children only).`);
      // For now, fetch direct children. Full recursive fetch is more complex.
      const directChildren = await this.fetchDirectChildren(id, unit.tenantId);
      (unit as any).children = directChildren; // Add children to the response, type assertion needed if not in entity
    }
    return unit;
  }

  private async fetchDirectChildren(parentId: string, tenantId: string): Promise<OrganizationUnit[]> {
    const supabaseClient = this.supabaseService.getClient();
    try {
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('parent_id', parentId);
        if (error) this.handleSupabaseError(error, `fetchDirectChildren for parent ${parentId}`);
        return data ? data.map(d => this.mapSupabaseRecordToOrgUnit(d as SupabaseOrganizationUnit)) : [];
    } catch (e) {
        this.handleGenericError(e, `fetchDirectChildren for parent ${parentId}`);
    }
  }


  // --- UPDATE ---
  async update(id: string, updateDto: UpdateOrganizationUnitDto): Promise<OrganizationUnit> {
    this.logger.log(`Service: Updating organization unit ${id} with data: ${JSON.stringify(updateDto)}`);
    const existingUnit = await this._findOne(id);

    if (updateDto.parentId === id) {
        throw new BadRequestException('An organization unit cannot be its own parent.');
    }

    if (updateDto.parentId !== undefined && updateDto.parentId !== existingUnit.parentId) {
        await this.validateTenantAndParent(existingUnit.tenantId, updateDto.parentId);
        if (updateDto.parentId) { // Only check for circular if new parentId is not null
            await this.checkForCircularDependency(id, updateDto.parentId, existingUnit.tenantId);
        }
    }

    if (updateDto.name && updateDto.name !== existingUnit.name) {
        await this.checkNameUniqueness(updateDto.name, existingUnit.tenantId, updateDto.parentId !== undefined ? updateDto.parentId : existingUnit.parentId);
    }
    
    const unitToUpdate: Partial<SupabaseOrganizationUnit> = {
      name: updateDto.name,
      parent_id: updateDto.parentId, // handles null if DTO sends null
      description: updateDto.description,
      leader_user_id: updateDto.leaderUserId, // handles null
      updated_at: new Date().toISOString(),
    };
    Object.keys(unitToUpdate).forEach(key => unitToUpdate[key] === undefined && delete unitToUpdate[key]);

    if (Object.keys(unitToUpdate).length <= 1) { // only updated_at
        this.logger.log(`No updatable fields provided for org unit ${id}. Returning current state.`);
        return existingUnit;
    }

    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.tableName).update(unitToUpdate).eq('id', id).select().single();
      if (error) this.handleSupabaseError(error, `update organization unit ${id}`);
      if (!data) throw new InternalServerErrorException('Failed to update org unit: No data returned.');
      this.logger.log(`AUDIT_LOG: OrganizationUnit updated. ID: ${id}, Changes: ${JSON.stringify(updateDto)}`);
      return this.mapSupabaseRecordToOrgUnit(data as SupabaseOrganizationUnit);
    } catch (e) {
      this.handleGenericError(e, `update organization unit ${id}`);
    }
  }

  // --- UPDATE STATUS ---
  async updateStatus(id: string, statusDto: OrganizationUnitStatusDto): Promise<OrganizationUnit> {
    this.logger.log(`Service: Updating status for org unit ${id} to: ${statusDto.status}`);
    await this._findOne(id); // Check existence

    const statusUpdate = { status: statusDto.status, updated_at: new Date().toISOString() };
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient.from(this.tableName).update(statusUpdate).eq('id', id).select().single();
      if (error) this.handleSupabaseError(error, `update org unit status ${id}`);
      if (!data) throw new InternalServerErrorException('Failed to update org unit status: No data returned.');
      this.logger.log(`Cascading Effect Note: Deactivating an org unit effectively deactivates all its children. Activating does not auto-activate children with 'Inactive' status. This logic is typically handled by queries reading the data, not by changing child statuses here. OrgUnit ID: ${id}, New Status: ${statusDto.status}`);
      this.logger.log(`AUDIT_LOG: OrganizationUnit status updated. ID: ${id}, NewStatus: ${statusDto.status}`);
      return this.mapSupabaseRecordToOrgUnit(data as SupabaseOrganizationUnit);
    } catch (e) {
      this.handleGenericError(e, `update org unit status ${id}`);
    }
  }

  // --- REMOVE ---
  async remove(id: string): Promise<void> {
    this.logger.log(`Service: Deleting organization unit with id: ${id}`);
    await this._findOne(id); // Check existence
    const supabaseClient = this.supabaseService.getClient();

    // Dependency Check: Child units
    const { count: childCount, error: childError } = await supabaseClient.from(this.tableName).select('id', { count: 'exact' }).eq('parent_id', id);
    if (childError) this.handleSupabaseError(childError, `remove org unit - checking children for ${id}`);
    if (childCount !== null && childCount > 0) {
      throw new ConflictException(`Organization unit ${id} has ${childCount} child unit(s). Cannot delete. Re-parent or delete children first.`);
    }

    // Dependency Check: User assignments
    const { count: userCount, error: userError } = await supabaseClient.from(this.usersTableName).select('id', { count: 'exact' }).eq('organization_unit_id', id);
    if (userError) this.handleSupabaseError(userError, `remove org unit - checking user assignments for ${id}`);
    if (userCount !== null && userCount > 0) {
      this.logger.warn(`Organization unit ${id} is assigned to ${userCount} user(s). Deletion will proceed, but assignments should be handled (e.g., unassign users or prevent deletion based on policy).`);
      // For now, allow deletion but log. Strict policy might throw ConflictException here.
    }
    
    try {
      const { error } = await supabaseClient.from(this.tableName).delete().eq('id', id);
      if (error) this.handleSupabaseError(error, `delete organization unit ${id}`);
      this.logger.log(`AUDIT_LOG: OrganizationUnit deleted. ID: ${id}`);
    } catch (e) {
      this.handleGenericError(e, `delete organization unit ${id}`);
    }
  }

  // --- PRIVATE HELPERS ---
  private async _findOne(id: string, tenantId?: string): Promise<OrganizationUnit> {
    this.logger.log(`Service: _findOne searching for org unit id: ${id}` + (tenantId ? `, tenant: ${tenantId}` : ''));
    const supabaseClient = this.supabaseService.getClient();
    let query = supabaseClient.from(this.tableName).select('*').eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    try {
        const { data, error } = await query.single(); // Use .single() for expecting one row or error
        if (error) this.handleSupabaseError(error, `_findOne org unit ${id}`); // PGRST116 (not found) will be handled
        if (!data) throw new NotFoundException(`Organization unit with id ${id} not found` + (tenantId ? ` within tenant ${tenantId}.` : '.'));
        return this.mapSupabaseRecordToOrgUnit(data as SupabaseOrganizationUnit);
    } catch (e) {
        this.handleGenericError(e, `_findOne org unit ${id}`);
    }
  }

  private async validateTenantAndParent(tenantId: string, parentId?: string | null): Promise<void> {
    await this.tenantsService.findOne(tenantId); // Validates tenant, throws NotFoundException if an issue
    if (parentId) {
      const parentOrgUnit = await this._findOne(parentId, tenantId); // Use _findOne to ensure it's within the same tenant
      if (!parentOrgUnit) { // _findOne now throws NotFoundException
        throw new BadRequestException(`Parent organization unit with ID '${parentId}' not found within tenant '${tenantId}'.`);
      }
    }
  }

  private async checkNameUniqueness(name: string, tenantId: string, parentId?: string | null): Promise<void> {
    this.logger.log(`Checking name uniqueness for "${name}", tenant "${tenantId}", parent "${parentId || 'root'}"`);
    const supabaseClient = this.supabaseService.getClient();
    let query = supabaseClient.from(this.tableName).select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('name', name);
    query = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null);
    
    try {
        const { count, error } = await query;
        if (error) this.handleSupabaseError(error, 'checkNameUniqueness org unit');
        if (count !== null && count > 0) {
            const parentContext = parentId ? `under parent '${parentId}'` : 'at the root level';
            throw new ConflictException(`An organization unit with name '${name}' already exists ${parentContext} for this tenant.`);
        }
    } catch (e) {
        this.handleGenericError(e, 'checkNameUniqueness org unit');
    }
  }

  private async checkForCircularDependency(unitId: string, newParentId: string, tenantId: string): Promise<void> {
    this.logger.log(`Checking for circular dependency: unit ${unitId} -> new parent ${newParentId}`);
    const supabaseClient = this.supabaseService.getClient();
    let currentParentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === unitId) {
        throw new BadRequestException(`Circular dependency detected: cannot set '${newParentId}' as parent of '${unitId}'.`);
      }
      if (visited.has(currentParentId)) { // Should not happen in a well-formed tree, but good for safety
        this.logger.error(`Circular dependency check encountered already visited node ${currentParentId} - tree might be broken.`);
        throw new InternalServerErrorException("Error during circular dependency check due to inconsistent data.");
      }
      visited.add(currentParentId);

      try {
        const { data: parent, error } = await supabaseClient
          .from(this.tableName)
          .select('parent_id')
          .eq('id', currentParentId)
          .eq('tenant_id', tenantId) // Ensure we stay within the tenant
          .single();
        
        if (error || !parent) { // Parent not found or error fetching it
            this.logger.warn(`Circular dependency check: parent ${currentParentId} not found or error. Assuming no further parents up this chain.`);
            break; 
        }
        currentParentId = parent.parent_id;
      } catch (e) {
          this.handleGenericError(e, `Circular dependency check, fetching parent ${currentParentId}`);
      }
    }
  }

  private handleGenericError(e: any, context: string): never {
    if (e instanceof ConflictException || 
        e instanceof BadRequestException || 
        e instanceof NotFoundException || 
        e instanceof InternalServerErrorException) {
      throw e;
    }
    this.logger.error(`Unexpected error in ${context}: ${e.message}`, e.stack);
    throw new InternalServerErrorException(`An unexpected error occurred in ${context}.`);
  }
}

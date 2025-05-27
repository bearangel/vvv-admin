import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantStatusDto } from './dto/tenant-status.dto';
import { Tenant, TenantStatus, TenantType } from './entities/tenant.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { PostgrestError } from '@supabase/supabase-js';

// Interface for paginated response
export interface PaginatedTenantsResponse {
  data: Tenant[];
  total: number;
  page: number;
  pageSize: number;
}

// Helper type for Supabase tenant record (snake_case)
interface SupabaseTenant {
  id: string;
  name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  tenant_type: TenantType;
  subscription_plan_id?: number;
  status: TenantStatus;
  created_at: string; // Supabase returns dates as strings
  updated_at: string;
}

@Injectable()
export class TenantsService {
  public readonly logger = new Logger(TenantsService.name);
  private readonly tableName = 'tenants';

  constructor(private readonly supabaseService: SupabaseService) {}

  // Helper to convert Supabase record (snake_case) to Tenant entity (camelCase)
  private mapSupabaseRecordToTenant(record: SupabaseTenant): Tenant {
    return {
      id: record.id,
      name: record.name,
      contactPerson: record.contact_person,
      contactEmail: record.contact_email,
      contactPhone: record.contact_phone,
      logoUrl: record.logo_url,
      tenantType: record.tenant_type,
      subscriptionPlanId: record.subscription_plan_id,
      status: record.status,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Helper to handle Supabase errors
  private handleSupabaseError(error: PostgrestError, context?: string): never {
    this.logger.error(`Supabase error in ${context || 'operation'}: ${error.message}`, error);
    if (error.code === '23505') { // Unique constraint violation
      throw new ConflictException(error.details || error.message);
    }
    throw new InternalServerErrorException(`An unexpected error occurred: ${error.message}`);
  }


  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    this.logger.log(`Service: Creating tenant with data: ${JSON.stringify(createTenantDto)}`);
    const supabaseClient = this.supabaseService.getClient();

    const tenantToInsert = {
      name: createTenantDto.name,
      contact_person: createTenantDto.contactPerson,
      contact_email: createTenantDto.contactEmail,
      contact_phone: createTenantDto.contactPhone,
      logo_url: createTenantDto.logoUrl,
      tenant_type: createTenantDto.tenantType,
      subscription_plan_id: createTenantDto.subscriptionPlanId,
      status: TenantStatus.ACTIVE, // Default status
    };

    try {
      const { data, error } = await supabaseClient
        .from(this.tableName)
        .insert(tenantToInsert)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'create tenant');
      }
      if (!data) {
        this.logger.error('Supabase create tenant: No data returned after insert');
        throw new InternalServerErrorException('Failed to create tenant: No data returned.');
      }
      
      this.logger.log(`AUDIT_LOG: Tenant created with ID: ${data.id}, Data: ${JSON.stringify(data)}`);
      this.logger.log("Service Placeholder: Default data initialization for the new tenant would occur here (e.g., default roles, admin user).");
      return this.mapSupabaseRecordToTenant(data as SupabaseTenant);
    } catch (e) {
      if (e instanceof ConflictException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in create tenant: ${e.message}`, e.stack);
      throw new InternalServerErrorException('An unexpected error occurred while creating the tenant.');
    }
  }

  async findAll(queryTenantDto: QueryTenantDto): Promise<PaginatedTenantsResponse> {
    this.logger.log(`Service: Finding all tenants with query: ${JSON.stringify(queryTenantDto)}`);
    const supabaseClient = this.supabaseService.getClient();
    const page = queryTenantDto.page || 1;
    const pageSize = queryTenantDto.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (queryTenantDto.name) {
      query = query.ilike('name', `%${queryTenantDto.name}%`);
    }
    if (queryTenantDto.status) {
      query = query.eq('status', queryTenantDto.status);
    }
    if (queryTenantDto.startDate) {
      query = query.gte('created_at', queryTenantDto.startDate);
    }
    if (queryTenantDto.endDate) {
      // Adjust to include the whole end day
      const endDate = new Date(queryTenantDto.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString().split('T')[0]);
    }

    query = query.range(offset, offset + pageSize - 1);

    try {
      const { data, error, count } = await query;

      if (error) {
        this.handleSupabaseError(error, 'findAll tenants');
      }

      const tenants = data ? data.map(d => this.mapSupabaseRecordToTenant(d as SupabaseTenant)) : [];
      
      return {
        data: tenants,
        total: count || 0,
        page,
        pageSize,
      };
    } catch (e) {
      if (e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in findAll tenants: ${e.message}`, e.stack);
      throw new InternalServerErrorException('An unexpected error occurred while fetching tenants.');
    }
  }
  
  // Public findOne for controller, uses private _findOne
  async findOne(id: string): Promise<Tenant | null> {
    this.logger.log(`Service: Public findOne called for tenant with id: ${id}`);
    const tenant = await this._findOneSupabase(id);
    if (!tenant) {
      this.logger.warn(`Service: Tenant with id ${id} not found.`);
      throw new NotFoundException(`Tenant with id ${id} not found.`);
    }
    return tenant;
  }

  // Private helper to fetch from Supabase, returns Tenant or null
  private async _findOneSupabase(id: string): Promise<Tenant | null> {
    this.logger.log(`Service: _findOneSupabase searching for tenant with id: ${id}`);
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { data, error } = await supabaseClient
        .from(this.tableName)
        .select()
        .eq('id', id)
        .maybeSingle(); // Returns null if not found, instead of error

      if (error) {
        this.handleSupabaseError(error, `_findOneSupabase tenant with id ${id}`);
      }
      
      return data ? this.mapSupabaseRecordToTenant(data as SupabaseTenant) : null;
    } catch (e) {
        if (e instanceof InternalServerErrorException) throw e;
        this.logger.error(`Unexpected error in _findOneSupabase for tenant id ${id}: ${e.message}`, e.stack);
        throw new InternalServerErrorException(`An unexpected error occurred while fetching tenant ${id}.`);
    }
  }


  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    this.logger.log(`Service: Updating tenant ${id} with data: ${JSON.stringify(updateTenantDto)}`);
    
    // Check existence first using the private Supabase fetcher
    const existingTenant = await this._findOneSupabase(id);
    if (!existingTenant) {
      this.logger.warn(`Service: Tenant with id ${id} not found for update.`);
      throw new NotFoundException(`Tenant with id ${id} not found.`);
    }
    
    const supabaseClient = this.supabaseService.getClient();
    const tenantToUpdate = {
      name: updateTenantDto.name,
      contact_person: updateTenantDto.contactPerson,
      contact_email: updateTenantDto.contactEmail,
      contact_phone: updateTenantDto.contactPhone,
      logo_url: updateTenantDto.logoUrl,
      tenant_type: updateTenantDto.tenantType,
      subscription_plan_id: updateTenantDto.subscriptionPlanId,
      // status is updated via updateStatus method
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields so they are not sent in the update
    Object.keys(tenantToUpdate).forEach(key => tenantToUpdate[key] === undefined && delete tenantToUpdate[key]);


    try {
      const { data, error } = await supabaseClient
        .from(this.tableName)
        .update(tenantToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, `update tenant ${id}`);
      }
      if (!data) {
        this.logger.error(`Supabase update tenant ${id}: No data returned after update`);
        throw new InternalServerErrorException(`Failed to update tenant ${id}: No data returned.`);
      }

      this.logger.log(`AUDIT_LOG: Tenant updated. ID: ${id}, UpdatedFields: ${JSON.stringify(updateTenantDto)}`);
      return this.mapSupabaseRecordToTenant(data as SupabaseTenant);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof ConflictException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in update tenant ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`An unexpected error occurred while updating tenant ${id}.`);
    }
  }

  async updateStatus(id: string, tenantStatusDto: TenantStatusDto): Promise<Tenant> {
    this.logger.log(`Service: Updating status for tenant ${id} to: ${tenantStatusDto.status}`);

    const existingTenant = await this._findOneSupabase(id);
    if (!existingTenant) {
      this.logger.warn(`Service: Tenant with id ${id} not found for status update.`);
      throw new NotFoundException(`Tenant with id ${id} not found.`);
    }

    const supabaseClient = this.supabaseService.getClient();
    const statusUpdate = {
      status: tenantStatusDto.status,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseClient
        .from(this.tableName)
        .update(statusUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, `updateStatus for tenant ${id}`);
      }
       if (!data) {
        this.logger.error(`Supabase updateStatus tenant ${id}: No data returned after update`);
        throw new InternalServerErrorException(`Failed to update status for tenant ${id}: No data returned.`);
      }

      const updatedTenant = this.mapSupabaseRecordToTenant(data as SupabaseTenant);

      if (updatedTenant.status === TenantStatus.INACTIVE) {
        this.logger.log(`Business Logic: Tenant ${id} is now Inactive. Users of this tenant will be blocked from login.`);
      } else if (updatedTenant.status === TenantStatus.ACTIVE) {
        this.logger.log(`Business Logic: Tenant ${id} is now Active. Users of this tenant can login.`);
      }

      this.logger.log(`AUDIT_LOG: Tenant status updated. ID: ${id}, NewStatus: ${tenantStatusDto.status}`);
      return updatedTenant;
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in updateStatus for tenant ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`An unexpected error occurred while updating status for tenant ${id}.`);
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Service: Deleting tenant with id: ${id}`);

    const existingTenant = await this._findOneSupabase(id);
    if (!existingTenant) {
      this.logger.warn(`Service: Tenant with id ${id} not found for deletion.`);
      throw new NotFoundException(`Tenant with id ${id} not found.`);
    }
    
    const supabaseClient = this.supabaseService.getClient();
    try {
      const { error } = await supabaseClient
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleSupabaseError(error, `remove tenant ${id}`);
      }
      this.logger.log(`AUDIT_LOG: Tenant ${id} deleted.`);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof InternalServerErrorException) throw e;
      this.logger.error(`Unexpected error in remove tenant ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`An unexpected error occurred while deleting tenant ${id}.`);
    }
  }
}

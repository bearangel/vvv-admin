import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatusDto } from './dto/user-status.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User, UserStatus } from './entities/user.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestError, AuthError, User as SupabaseAuthUser } from '@supabase/supabase-js';

// Interface for paginated response
export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
}

// Helper type for Supabase user_profiles record (snake_case)
interface SupabaseUserProfile {
  id: string; // UUID from auth.users
  tenant_id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role_ids?: string[];
  organization_unit_id?: string;
  status: UserStatus;
  created_at: string; // Supabase returns dates as strings
  updated_at: string;
}

// Helper to check if an error is a PostgrestError
function isPostgrestError(error: any): error is PostgrestError {
  return error && typeof error.code === 'string' && typeof error.details === 'string' && typeof error.message === 'string' && typeof error.hint === 'string';
}


@Injectable()
export class UsersService {
  public readonly logger = new Logger(UsersService.name);
  private readonly userProfilesTable = 'user_profiles';

  constructor(private readonly supabaseService: SupabaseService) {}

  // Helper to convert Supabase record (snake_case) to User entity (camelCase)
  private mapSupabaseRecordToUser(
    profileRecord: SupabaseUserProfile,
    authEmail?: string,
  ): User {
    return {
      id: profileRecord.id,
      tenantId: profileRecord.tenant_id,
      email: authEmail || '', // Fallback, should be provided
      firstName: profileRecord.first_name,
      lastName: profileRecord.last_name,
      phoneNumber: profileRecord.phone_number,
      roleIds: profileRecord.role_ids,
      organizationUnitId: profileRecord.organization_unit_id,
      status: profileRecord.status,
      createdAt: new Date(profileRecord.created_at),
      updatedAt: new Date(profileRecord.updated_at),
    };
  }

  private handleSupabaseError(
    error: PostgrestError | AuthError | Error, // Added generic Error
    context?: string,
  ): never {
    this.logger.error(
      `Supabase error in ${context || 'operation'}: ${error.message}`,
      JSON.stringify(error),
    );

    if (isPostgrestError(error)) {
      if (error.code === '23505') {
        throw new ConflictException(error.details || `Unique constraint failed: ${error.message}`);
      }
      if (error.code === '22P02') {
        throw new BadRequestException(`Invalid input data: ${error.details || error.message}`);
      }
      if (error.code === 'PGRST116') { // Not found (e.g. view/table missing or RLS)
        throw new NotFoundException(`Resource not found: ${error.details || error.message}`);
      }
    } else if ('status' in error && typeof error.status === 'number') { // AuthError
      if (error.status === 400) {
        throw new BadRequestException(error.message || 'Request failed due to invalid input.');
      }
      if (error.status === 404) {
        throw new NotFoundException(error.message || 'User not found in Auth.');
      }
      if (error.status === 422 || (error.message && error.message.includes('User already registered'))) {
        throw new ConflictException(error.message || 'User with this email already exists.');
      }
    }
    
    throw new InternalServerErrorException(
      `An unexpected error occurred in ${context || 'operation'}: ${error.message}`,
    );
  }

  // --- CREATE ---
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(
      `Service: Creating user for tenant ${createUserDto.tenantId} with email ${createUserDto.email}`,
    );
    const supabaseClient = this.supabaseService.getClient(); // Standard client for signUp

    this.logger.log(`Attempting to sign up user in Supabase Auth: ${createUserDto.email}`);
    const { data: authData, error: authError } =
      await supabaseClient.auth.signUp({
        email: createUserDto.email,
        password: createUserDto.password,
      });

    if (authError) {
      this.handleSupabaseError(authError, 'Supabase Auth signUp');
    }
    if (!authData.user) {
      throw new InternalServerErrorException('User authentication record creation failed: No user data returned.');
    }
    this.logger.log(`Supabase Auth user created/retrieved successfully: ID ${authData.user.id}, Email: ${authData.user.email}`);

    const userProfileToInsert = {
      id: authData.user.id,
      tenant_id: createUserDto.tenantId,
      first_name: createUserDto.firstName,
      last_name: createUserDto.lastName,
      phone_number: createUserDto.phoneNumber,
      role_ids: createUserDto.roleIds,
      organization_unit_id: createUserDto.organizationUnitId,
      status: UserStatus.ACTIVE,
    };

    this.logger.log(`Attempting to insert user profile for ID: ${authData.user.id}`);
    try {
      const { data: profileData, error: profileError } = await supabaseClient
        .from(this.userProfilesTable)
        .insert(userProfileToInsert)
        .select()
        .single();

      if (profileError) {
        this.logger.warn(`COMPENSATION NEEDED: Auth user ${authData.user.id} created, but profile insertion failed.`);
        this.handleSupabaseError(profileError, 'insert user profile');
      }
      if (!profileData) {
         this.logger.warn(`COMPENSATION NEEDED: Auth user ${authData.user.id} created, but profile insertion returned no data.`);
        throw new InternalServerErrorException('User profile creation failed: No data returned.');
      }

      this.logger.log(`AUDIT_LOG: User created. AuthID: ${authData.user.id}, ProfileID: ${profileData.id}`);
      return this.mapSupabaseRecordToUser(profileData as SupabaseUserProfile, authData.user.email);
    } catch (e) {
      this.logger.warn(`COMPENSATION NEEDED: Auth user ${authData.user.id} may exist. Error during profile creation: ${e.message}`);
      if (e instanceof ConflictException || e instanceof BadRequestException || e instanceof InternalServerErrorException) throw e;
      throw new InternalServerErrorException(`Unexpected error creating profile for Auth User ${authData.user.id}.`);
    }
  }

  // --- FIND ALL (List Users) ---
  async findAll(queryUserDto: QueryUserDto): Promise<PaginatedUsersResponse> {
    this.logger.log(`Service: Finding all users with query: ${JSON.stringify(queryUserDto)}`);
    const supabaseClient = this.supabaseService.getClient(); // Standard client, RLS should handle tenant scoping
    const page = queryUserDto.page || 1;
    const pageSize = queryUserDto.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient
      .from(this.userProfilesTable)
      .select('*, auth_user_email:users!inner(email)', { count: 'exact' }) // Assuming 'users' is the auth table, and a FK exists or join is possible.
                                                                       // This is a simplified join for fetching email.
                                                                       // Supabase might require a view or function for direct join on auth.users.
                                                                       // For this example, we'll assume a column `auth_user_email` exists via some mechanism
                                                                       // or we adapt this if direct join is not feasible.
                                                                       // A more robust way is to fetch profiles then emails separately if no direct join.
      .eq('tenant_id', queryUserDto.tenantId); // CRUCIAL: Tenant scoping

    if (queryUserDto.keyword) {
      // This is a basic keyword search. For more complex searches on first_name, last_name, AND email,
      // a Supabase function (e.g., using pg_trgm for fuzzy search) would be more efficient.
      // Or, fetch emails into profiles or search email separately.
      // For now, we'll search on first_name and last_name in profiles.
      query = query.or(`first_name.ilike.%${queryUserDto.keyword}%,last_name.ilike.%${queryUserDto.keyword}%`);
      // If email is denormalized or joined: query = query.or(`first_name.ilike.%${queryUserDto.keyword}%,last_name.ilike.%${queryUserDto.keyword}%,email.ilike.%${queryUserDto.keyword}%`);
    }
    if (queryUserDto.status) {
      query = query.eq('status', queryUserDto.status);
    }
    if (queryUserDto.roleId) {
      query = query.contains('role_ids', [queryUserDto.roleId]);
    }
    if (queryUserDto.organizationUnitId) {
      query = query.eq('organization_unit_id', queryUserDto.organizationUnitId);
    }

    query = query.range(offset, offset + pageSize - 1);

    try {
      const { data: profileData, error, count } = await query;
      if (error) this.handleSupabaseError(error, 'findAll users (profiles)');

      // Fetch Auth user emails if not effectively joined (simulating for now if 'auth_user_email' is not real)
      // This part is tricky without a real Supabase setup for joins with auth.users.
      // Assuming for now 'auth_user_email' from the select gives us what we need.
      // If not, we'd iterate profileData, collect IDs, and batch fetch from auth.admin.listUsers().
      const users = profileData
        ? profileData.map(p => {
            // If 'users(email)' was joined, it might be nested like p.users.email or p.auth_user_email
            // This needs to align with how Supabase returns joined data.
            // Let's assume a simplified structure where email is directly available or under a known key.
            const email = (p as any).auth_user_email?.email || (p as any).email; // Adjust based on actual Supabase join result structure
            if (!email) this.logger.warn(`Email missing for user profile ID ${p.id} in findAll. Consider denormalizing or improving join.`);
            return this.mapSupabaseRecordToUser(p as SupabaseUserProfile, email || 'email_not_found@example.com');
          })
        : [];
      
      return { data: users, total: count || 0, page, pageSize };
    } catch (e) {
      this.handleSupabaseError(e, 'findAll users processing');
    }
  }
  
  // --- FIND ONE (Get Single User) ---
  async findOne(id: string): Promise<User | null> {
    this.logger.log(`Service: Finding user with id: ${id}`);
    const supabaseClient = this.supabaseService.getClient(); // For profile
    const supabaseAdminClient = this.supabaseService.getAdminClient(); // For auth data

    const { data: profileData, error: profileError } = await supabaseClient
      .from(this.userProfilesTable)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (profileError) this.handleSupabaseError(profileError, `findOne user profile ${id}`);
    if (!profileData) throw new NotFoundException(`User profile with id ${id} not found.`);

    let authUserEmail = 'auth_email_not_found@example.com';
    try {
      const { data: authUserData, error: authUserError } = await supabaseAdminClient.auth.admin.getUserById(id);
      if (authUserError) {
        this.logger.warn(`Could not fetch auth user for ID ${id}: ${authUserError.message}. Proceeding with profile data only.`);
        // Depending on policy, you might throw NotFoundException here if auth user is mandatory.
      } else if (authUserData?.user?.email) {
        authUserEmail = authUserData.user.email;
      }
    } catch (e) {
        this.logger.warn(`Error fetching auth user for ID ${id} (admin client): ${e.message}. Proceeding with profile data only.`);
    }
    
    return this.mapSupabaseRecordToUser(profileData as SupabaseUserProfile, authUserEmail);
  }

  // --- UPDATE USER ---
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    this.logger.log(`Service: Updating user ${id} with data: ${JSON.stringify(updateUserDto)}`);
    const supabaseClient = this.supabaseService.getClient(); // For profile update
    const supabaseAdminClient = this.supabaseService.getAdminClient(); // For auth updates

    // 1. Update Auth data if email/password are provided (Admin capability)
    // Note: UpdateUserDto for this subtask was defined to not include email/password.
    // If they were included, the logic would be here.
    // Example:
    // if (updateUserDto.email || updateUserDto.password) {
    //   const authUpdate: any = {};
    //   if (updateUserDto.email) authUpdate.email = updateUserDto.email;
    //   if (updateUserDto.password) authUpdate.password = updateUserDto.password;
    //   const { error: authUpdateError } = await supabaseAdminClient.auth.admin.updateUserById(id, authUpdate);
    //   if (authUpdateError) this.handleSupabaseError(authUpdateError, `update user auth data ${id}`);
    //   this.logger.log(`AUDIT_LOG: User Auth data updated for ID: ${id}`);
    // }

    // 2. Update profile data
    const profileToUpdate: Partial<SupabaseUserProfile> = {
      first_name: updateUserDto.firstName,
      last_name: updateUserDto.lastName,
      phone_number: updateUserDto.phoneNumber,
      role_ids: updateUserDto.roleIds,
      organization_unit_id: updateUserDto.organizationUnitId,
      updated_at: new Date().toISOString(),
    };
    Object.keys(profileToUpdate).forEach(key => profileToUpdate[key] === undefined && delete profileToUpdate[key]);

    if (Object.keys(profileToUpdate).length > 1) { // updated_at is always there
      const { data: updatedProfile, error: profileUpdateError } = await supabaseClient
        .from(this.userProfilesTable)
        .update(profileToUpdate)
        .eq('id', id)
        .select()
        .single();
      if (profileUpdateError) this.handleSupabaseError(profileUpdateError, `update user profile ${id}`);
      if (!updatedProfile) throw new InternalServerErrorException('Failed to update user profile: No data returned.');
      this.logger.log(`AUDIT_LOG: User Profile updated for ID: ${id}, Data: ${JSON.stringify(updateUserDto)}`);
    } else {
      this.logger.log(`No profile fields to update for user ID: ${id}. Only fetching current state.`);
    }
    
    return this.findOne(id); // Fetch and return the full, combined user state
  }

  // --- UPDATE USER STATUS ---
  async updateStatus(id: string, userStatusDto: UserStatusDto): Promise<User | null> {
    this.logger.log(`Service: Updating status for user ${id} to: ${userStatusDto.status}`);
    const supabaseClient = this.supabaseService.getClient(); // For profile status

    const statusUpdate = {
      status: userStatusDto.status,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: profileStatusError } = await supabaseClient
      .from(this.userProfilesTable)
      .update(statusUpdate)
      .eq('id', id)
      .select()
      .single();

    if (profileStatusError) this.handleSupabaseError(profileStatusError, `update user profile status ${id}`);
    if (!updatedProfile) throw new InternalServerErrorException('Failed to update user status: No data returned.');

    // Sync with Supabase Auth (conceptual for now, as direct ban isn't always the desired effect)
    // If status is 'Inactive', you might:
    // 1. Rely on RLS and your app logic to block logins based on user_profiles.status. (Simplest)
    // 2. Update user_app_metadata in Supabase Auth to reflect this, e.g., { data: { is_active: false } }.
    //    const supabaseAdminClient = this.supabaseService.getAdminClient();
    //    const { error: authMetaError } = await supabaseAdminClient.auth.admin.updateUserById(id, {
    //      user_metadata: { ...existing_metadata, custom_status: userStatusDto.status }
    //    });
    //    if (authMetaError) this.logger.error(`Failed to update user_metadata in Auth for ${id}: ${authMetaError.message}`);
    this.logger.log(`Conceptual: If user ${id} is Inactive, Supabase Auth user state might be updated (e.g. via metadata or other flags). Currently, only user_profiles.status is updated.`);
    
    this.logger.log(`AUDIT_LOG: User status updated for ID: ${id}, NewStatus: ${userStatusDto.status}`);
    return this.findOne(id); // Fetch and return the full, combined user state
  }

  // --- REMOVE USER --- (Admin action, includes Auth and Profile deletion)
  async remove(id: string): Promise<void> {
    this.logger.log(`Service: Attempting to delete user with ID: ${id}`);
    const supabaseAdminClient = this.supabaseService.getAdminClient();

    // First, attempt to delete from user_profiles to avoid orphaned auth users if profile FK is restrictive.
    // Or, delete auth user first and let cascade/trigger handle profile (depends on DB setup).
    // Current approach: delete profile, then auth user.
    
    const { error: profileDeleteError } = await supabaseAdminClient // Use admin for direct delete if RLS is restrictive for standard client
        .from(this.userProfilesTable)
        .delete()
        .eq('id', id);

    if (profileDeleteError && profileDeleteError.code !== 'PGRST116') { // PGRST116 = row not found, which is fine if already deleted or never existed
        this.logger.warn(`Error deleting user profile for ID ${id}: ${profileDeleteError.message}. Proceeding to delete Auth user.`);
        // Depending on policy, might throw here if profile must exist.
    } else if (!profileDeleteError) {
        this.logger.log(`User profile for ID ${id} deleted successfully or was already gone.`);
    }


    // Delete Supabase Auth user
    const { error: authDeleteError } = await supabaseAdminClient.auth.admin.deleteUser(id);
    if (authDeleteError) {
        // If profile was deleted but auth user deletion fails, this is a partial failure.
        this.logger.error(`Failed to delete Supabase Auth user for ID ${id}: ${authDeleteError.message}. Profile might have been deleted.`);
        this.handleSupabaseError(authDeleteError, `delete Supabase Auth user ${id}`);
    }
    
    this.logger.log(`AUDIT_LOG: User deleted successfully (Auth and Profile attempted). ID: ${id}`);
  }
}

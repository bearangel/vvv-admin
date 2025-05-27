import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase URL and Key must be provided in .env file');
      throw new Error('Supabase URL and Key must be provided in .env file');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Standard Supabase client initialized.');

    if (supabaseServiceRoleKey && supabaseServiceRoleKey !== 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.logger.log('Supabase Admin client initialized successfully.');
    } else {
      this.logger.warn(
        'Supabase Service Role Key not found or is default placeholder. Supabase Admin client not initialized. Admin operations will fail.',
      );
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    if (!this.supabaseAdmin) {
      this.logger.error(
        'Supabase Admin client is not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is configured.',
      );
      throw new Error(
        'Supabase Admin client is not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is configured.',
      );
    }
    return this.supabaseAdmin;
  }
}

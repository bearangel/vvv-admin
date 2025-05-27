import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule

@Global() // Makes the module global
@Module({
  imports: [ConfigModule], // Import ConfigModule to use ConfigService
  providers: [SupabaseService],
  exports: [SupabaseService], // Export SupabaseService to be used in other modules
})
export class SupabaseModule {}

import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Patch, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { TenantsService, PaginatedTenantsResponse } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantStatusDto } from './dto/tenant-status.dto';
import { Tenant } from './entities/tenant.entity';
import { QueryTenantDto } from './dto/query-tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    this.tenantsService.logger.log(`Controller: Received request to create tenant: ${JSON.stringify(createTenantDto)}`);
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  async findAll(@Query() queryTenantDto: QueryTenantDto): Promise<PaginatedTenantsResponse> {
    this.tenantsService.logger.log(`Controller: Received request to find all tenants with query: ${JSON.stringify(queryTenantDto)}`);
    return this.tenantsService.findAll(queryTenantDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Tenant | null> {
    this.tenantsService.logger.log(`Controller: Received request to find tenant with id: ${id}`);
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant | null> {
    this.tenantsService.logger.log(`Controller: Received request to update tenant ${id} with data: ${JSON.stringify(updateTenantDto)}`);
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() tenantStatusDto: TenantStatusDto,
  ): Promise<Tenant | null> {
    this.tenantsService.logger.log(`Controller: Received request to update status for tenant ${id} to: ${tenantStatusDto.status}`);
    return this.tenantsService.updateStatus(id, tenantStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.tenantsService.logger.log(`Controller: Received request to delete tenant with id: ${id}`);
    return this.tenantsService.remove(id);
  }
}

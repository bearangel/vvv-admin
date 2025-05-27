import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { OrganizationService, PaginatedOrganizationUnitsResponse } from './organization.service';
import { CreateOrganizationUnitDto } from './dto/create-organization-unit.dto';
import { UpdateOrganizationUnitDto } from './dto/update-organization-unit.dto';
import { OrganizationUnitStatusDto } from './dto/organization-unit-status.dto';
import { QueryOrganizationUnitDto } from './dto/query-organization-unit.dto';
import { OrganizationUnit } from './entities/organization-unit.entity';

@Controller('organization-units')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrgUnitDto: CreateOrganizationUnitDto): Promise<OrganizationUnit> {
    this.organizationService.logger.log(`Controller: Received request to create organization unit: ${JSON.stringify(createOrgUnitDto)}`);
    return this.organizationService.create(createOrgUnitDto);
  }

  @Get()
  async findAll(@Query() queryOrgUnitDto: QueryOrganizationUnitDto): Promise<PaginatedOrganizationUnitsResponse | OrganizationUnit[]> {
    this.organizationService.logger.log(`Controller: Received request to find all organization units with query: ${JSON.stringify(queryOrgUnitDto)}`);
    if (queryOrgUnitDto.includeChildren && queryOrgUnitDto.parentId === undefined && queryOrgUnitDto.level === undefined && queryOrgUnitDto.name === undefined) {
      // Requesting a full tree structure for the tenant
      return this.organizationService.getTree(queryOrgUnitDto.tenantId, queryOrgUnitDto.status);
    }
    return this.organizationService.findAll(queryOrgUnitDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeChildren') includeChildren?: boolean, // Not fully implemented in service for tree in this pass
    @Query('tenantId') tenantId?: string, // Optional tenantId for validation if needed, though ID should be unique
  ): Promise<OrganizationUnit> {
    this.organizationService.logger.log(`Controller: Received request to find organization unit with id: ${id}, includeChildren: ${includeChildren}`);
    // TenantId from query could be used for an extra layer of validation if desired, but findOne in service should handle it.
    return this.organizationService.findOneWithHierarchy(id, includeChildren);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrgUnitDto: UpdateOrganizationUnitDto,
  ): Promise<OrganizationUnit> {
    this.organizationService.logger.log(`Controller: Received request to update organization unit ${id} with data: ${JSON.stringify(updateOrgUnitDto)}`);
    return this.organizationService.update(id, updateOrgUnitDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: OrganizationUnitStatusDto,
  ): Promise<OrganizationUnit> {
    this.organizationService.logger.log(`Controller: Received request to update status for organization unit ${id} to: ${statusDto.status}`);
    return this.organizationService.updateStatus(id, statusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.organizationService.logger.log(`Controller: Received request to delete organization unit with id: ${id}`);
    return this.organizationService.remove(id);
  }
}

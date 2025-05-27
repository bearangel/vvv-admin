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
  Put,
} from '@nestjs/common';
import { RolesService, PaginatedRolesResponse } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleStatusDto } from './dto/role-status.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { Role } from './entities/role.entity';
import { AssignPermissionsToRoleDto } from '../permissions/dto/assign-permissions-to-role.dto';
import { Permission } from '../permissions/entities/permission.entity'; // Import Permission entity

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    this.rolesService.logger.log(`Controller: Received request to create role: ${JSON.stringify(createRoleDto)}`);
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  async findAll(@Query() queryRoleDto: QueryRoleDto): Promise<PaginatedRolesResponse> {
    this.rolesService.logger.log(`Controller: Received request to find all roles with query: ${JSON.stringify(queryRoleDto)}`);
    return this.rolesService.findAll(queryRoleDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
    this.rolesService.logger.log(`Controller: Received request to find role with id: ${id}`);
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    this.rolesService.logger.log(`Controller: Received request to update role ${id} with data: ${JSON.stringify(updateRoleDto)}`);
    return this.rolesService.update(id, updateRoleDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roleStatusDto: RoleStatusDto,
  ): Promise<Role> {
    this.rolesService.logger.log(`Controller: Received request to update status for role ${id} to: ${roleStatusDto.status}`);
    return this.rolesService.updateStatus(id, roleStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.rolesService.logger.log(`Controller: Received request to delete role with id: ${id}`);
    return this.rolesService.remove(id);
  }

  @Put(':roleId/permissions')
  @HttpCode(HttpStatus.OK)
  async updateRolePermissions(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsToRoleDto,
  ): Promise<{ roleId: string; assignedPermissionIds: string[] }> {
    this.rolesService.logger.log(
      `Controller: Received request to update permissions for role ${roleId} with permission IDs: ${assignPermissionsDto.permissionIds.join(', ')}`,
    );
    const assignedIds = await this.rolesService.updateRolePermissions(roleId, assignPermissionsDto);
    return { roleId, assignedPermissionIds: assignedIds };
  }

  @Get(':roleId/permissions')
  async getRolePermissions(@Param('roleId', ParseUUIDPipe) roleId: string): Promise<Permission[]> {
    this.rolesService.logger.log(`Controller: Received request to get permissions for role ${roleId}`);
    return this.rolesService.getRolePermissions(roleId);
  }
}

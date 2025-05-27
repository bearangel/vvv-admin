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
import { PermissionsService, PaginatedPermissionsResponse } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionStatusDto } from './dto/permission-status.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { Permission } from './entities/permission.entity';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPermissionDto: CreatePermissionDto): Promise<Permission> {
    this.permissionsService.logger.log(`Controller: Received request to create permission: ${JSON.stringify(createPermissionDto)}`);
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  async findAll(@Query() queryPermissionDto: QueryPermissionDto): Promise<PaginatedPermissionsResponse> {
    this.permissionsService.logger.log(`Controller: Received request to find all permissions with query: ${JSON.stringify(queryPermissionDto)}`);
    return this.permissionsService.findAll(queryPermissionDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Permission> {
    this.permissionsService.logger.log(`Controller: Received request to find permission with id: ${id}`);
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    this.permissionsService.logger.log(`Controller: Received request to update permission ${id} with data: ${JSON.stringify(updatePermissionDto)}`);
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() permissionStatusDto: PermissionStatusDto,
  ): Promise<Permission> {
    this.permissionsService.logger.log(`Controller: Received request to update status for permission ${id} to: ${permissionStatusDto.status}`);
    return this.permissionsService.updateStatus(id, permissionStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.permissionsService.logger.log(`Controller: Received request to delete permission with id: ${id}`);
    return this.permissionsService.remove(id);
  }
}

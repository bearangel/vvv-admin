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
  Delete, // Added for completeness, though not explicitly requested in this subtask
} from '@nestjs/common';
import { UsersService, PaginatedUsersResponse } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatusDto } from './dto/user-status.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(@Query() queryUserDto: QueryUserDto): Promise<PaginatedUsersResponse> {
    this.usersService.logger.log(`Controller: Received request to find all users with query: ${JSON.stringify(queryUserDto)}`);
    return this.usersService.findAll(queryUserDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User | null> {
    this.usersService.logger.log(`Controller: Received request to find user with id: ${id}`);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    this.usersService.logger.log(`Controller: Received request to update user ${id} with data: ${JSON.stringify(updateUserDto)}`);
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() userStatusDto: UserStatusDto,
  ): Promise<User | null> {
    this.usersService.logger.log(`Controller: Received request to update status for user ${id} to: ${userStatusDto.status}`);
    return this.usersService.updateStatus(id, userStatusDto);
  }

  // Optional: DELETE endpoint if needed in the future
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.usersService.logger.log(`Controller: Received request to delete user with id: ${id}`);
    return this.usersService.remove(id); // Assuming remove method will be added to service
  }
}

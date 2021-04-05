import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Put,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseInterceptors,
  } from '@nestjs/common';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { Role, GroupRoles, Scope, RoleScopes } from '@prisma/client';
  import { Files } from '../../helpers/interfaces';
  import { CursorPipe } from '../../pipes/cursor.pipe';
  import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
  import { OrderByPipe } from '../../pipes/order-by.pipe';
  import { WherePipe } from '../../pipes/where.pipe';
  import { Expose } from '../../providers/prisma/prisma.interface';
  import { UserRequest } from '../auth/auth.interface';
  import { RateLimit } from '../auth/rate-limit.decorator';
  import { Scopes } from '../auth/scope.decorator';
  import { RoleDto, RevokeGroupRoleDto } from './roles.dto';
  import { RoleService } from './roles.service';
  import { ScopeDto } from './scopes.dto';
  
  @Controller('roles')
  export class RoleController {
    constructor(private roleservice: RoleService) {}
  
    /** Get roles */
    @Get()
    @Scopes('user-*:read-info')
    async getAll(
      @Query('skip', OptionalIntPipe) skip?: number,
      @Query('take', OptionalIntPipe) take?: number,
      @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
      @Query('where', WherePipe) where?: Record<string, number | string>,
      @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
    ): Promise<{roles: Expose<Role>[], length: number}> {
      return this.roleservice.getRoles({ skip, take, orderBy, cursor, where });
    }
  
    /** Get role details */
    @Get(':roleId')
    @Scopes('user-{userId}:read-info')
    async getRoleDetails(@Param('roleId', ParseIntPipe) id: number): Promise<Expose<Role>> {
      return this.roleservice.getRoleDetails(id);
    }

    /** Get Scopes for roles */
    @Get(':roleId/scopes')
    @Scopes('user-{userId}:read-info')
    async getRoleScopes(
      @Param('roleId', ParseIntPipe) id: number,
      @Query('skip', OptionalIntPipe) skip?: number,
      @Query('take', OptionalIntPipe) take?: number): Promise<{scopes: Scope[], length: number}> {
      return this.roleservice.getRoleScopes(id, {skip, take});
    }

    /** Get user roles */
    @Get('user/:userId')
    @Scopes('user-{userId}:read-info')
    async getUserRoles(@Param('userId', ParseIntPipe) id: number): Promise<{id: number, name: string}[]> {
      return this.roleservice.getUserRoles(id);
    }

    /** Get group roles */
    @Get('group/:groupId')
    @Scopes('user-{userId}:read-info')
    async getGroupRoles(
      @Param('groupId', ParseIntPipe) id: number,
      @Query('skip', OptionalIntPipe) skip?: number,
      @Query('take', OptionalIntPipe) take?: number): 
      Promise<{roles: {id: number, name: string}[], length: number}> {
      return this.roleservice.getGroupRoles(id);
    }
  
    /** Create role */
    @Post()
    @Scopes('user-*:read-info')
    async createRole( @Body() createRole: RoleDto,
    ): Promise<Expose<Role>> {
      return this.roleservice.createRole(createRole);
    }

    /** Add group role */
    @Post('group/:groupId')
    @Scopes('user-{userId}:write-info')
    async addGroupRole(
      @Param('groupId', ParseIntPipe) id: number,
      @Body() data: RoleDto,
    ): Promise<Expose<GroupRoles>> {
      return this.roleservice.addGroupRole(id, data);
    }

    /** update role scopes */
    @Put(':roleId')
    @Scopes('user-{userId}:write-info')
    async updateRoleScopes(
      @Param('roleId', ParseIntPipe) id: number,
      @Body() data: ScopeDto[],
    ): Promise<RoleScopes[]> {
      return this.roleservice.updateRoleScopes(id, data);
    }

    /** update group roles */
    @Put('group/:groupId')
    @Scopes('user-{userId}:write-info')
    async updateGroupRoles(
      @Param('groupId', ParseIntPipe) id: number,
      @Body() data: RoleDto[],
    ): Promise<GroupRoles[]> {
      return this.roleservice.updateGroupRolesRecursively(id, data);
    }

    /** delete role */
    @Delete(':roleId')
    @Scopes('user-{userId}:write-info')
    async deleteRole(
      @Param('roleId', ParseIntPipe) id: number,
    ) {
      return this.roleservice.deleteRole(id);
    }

    /** revoke role from a group */
    @Delete('group/:groupId')
    @Scopes('user-{userId}:write-info')
    async deleteGroupRole(
      @Req() request: UserRequest,
      @Param('groupId', ParseIntPipe) id: number,
      @Body() data: RevokeGroupRoleDto,
    ) {
      return this.roleservice.deleteGroupRole(id, data);
    }
  }
  
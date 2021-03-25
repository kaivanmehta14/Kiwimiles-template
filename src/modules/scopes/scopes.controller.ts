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
  } from '@nestjs/common';
  import { Role } from '@prisma/client';
  import { CursorPipe } from '../../pipes/cursor.pipe';
  import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
  import { OrderByPipe } from '../../pipes/order-by.pipe';
  import { WherePipe } from '../../pipes/where.pipe';
  import { Expose } from '../../providers/prisma/prisma.interface';
  import { Scopes } from '../auth/scope.decorator';
  import { ScopeService } from './scopes.service';
  
  @Controller('scopes')
  export class ScopeController {
    constructor(private scopesService: ScopeService) {}
  
    /** Get scopes */
    @Get()
    @Scopes('user-*:read-info')
    async getAll(
      @Query('skip', OptionalIntPipe) skip?: number,
      @Query('take', OptionalIntPipe) take?: number,
      @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
      @Query('where', WherePipe) where?: Record<string, number | string>,
      @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
    ): Promise<Expose<Role>[]> {
      return this.scopesService.getAllScopes({ skip, take, orderBy, cursor, where });
    }
  }
  
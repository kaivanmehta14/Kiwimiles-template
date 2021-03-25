import {
  BadRequestException,
  ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
  } from '@nestjs/common';
  import type { Prisma, GroupRoles, RoleScopes, UserRole } from '@prisma/client';
  import { Role, Group, Scope } from '@prisma/client';
import { String } from 'aws-sdk/clients/appstream';
import { Number } from 'aws-sdk/clients/iot';
import { exception } from 'console';
  import {
    ROLE_NOT_FOUND,
  } from '../../errors/errors.constants';
  import { Expose } from '../../providers/prisma/prisma.interface';
  import { PrismaService } from '../../providers/prisma/prisma.service';
import { RevokeGroupRoleDto, RoleDto } from './roles.dto';
  
  @Injectable()
  export class RoleService {
    constructor(
      private prisma: PrismaService
    ) {}
  
    public async createRole(createRole: RoleDto): Promise<Expose<Role>> {
  
      try {
        const role: Role = await this.prisma.role.create({
          data: {
            name: createRole.name
          }
        });
        return this.prisma.expose<Role>(role);
      }
      catch(error) {
        console.log(error);
        throw new InternalServerErrorException(error);
      }
    }

    public async getRoles(params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.UserWhereUniqueInput;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByInput;
    }): Promise<Expose<Role>[]> {
      const { skip, take, cursor, where, orderBy } = params;
      try {
        const roles = await this.prisma.role.findMany({
          skip,
          take,
          cursor,
          where,
          orderBy,
        });
        return roles.map((role) => this.prisma.expose<Role>(role));
      } catch (error) {
        return [];
      }
    }

    public async getRoleDetails(roleId: number): Promise<Expose<Role>> {
      try {
        const role: Role = await this.prisma.role.findUnique({
          where:{
            id: roleId
          }
        });
        return this.prisma.expose<Role>(role)
      } catch (error) {
        throw new NotFoundException("role not found");
      }
    }

    public async getRoleScopes(roleId: number): Promise<Scope[]> {
      const role: Role = await this.prisma.role.findFirst({
        where:{
          id: roleId
        }
      })
      if(!role) {
        throw new BadRequestException("Role not available")
      }

      const scopes: Scope[] = (await this.prisma.roleScopes.findMany({
        include:{
          scope: true
        },
        where: {
          roleId: role.id
        }
      })).map(data => data.scope);
      return scopes;
    }

    public async getUserRoles(id: number): Promise<{id: number, name: string}[]> {
      
      try{
        const groupIds: number[] = (await this.prisma.membership.findMany({
          select: {
            group: {
              select: {
                id: true
              }
            }
          },
          where: {userId: id}
        }))
        .map(object => object.group.id);
    
        const roles: {id: number, name: string}[] = (await this.prisma.groupRoles.findMany({
          select: {
            role: {
              select:{
                id: true,
                name: true
              }
            }
          },
          where: {
            groupId: {
              in: groupIds
            }
          }
        })).map(object => object.role);
        return roles;
      }
      catch (error){
        return [];
      }
    }
  
    public async getGroupRoles(id: number): Promise<{id: number, name: string}[]> {
      
      try{
        const roles: {id: number, name: string}[] = (await this.prisma.groupRoles.findMany({
          select: {
            role: {
              select:{
                id: true,
                name: true
              }
            }
          },
          where: {
            groupId: id
          }
        })).map(object => object.role);
        return roles;
      }
      catch (error){
        return [];
      }
    }
  
    public async addGroupRole(
      id: number,
      data: RoleDto
    ): Promise<Expose<GroupRoles>> {
      
      const group: Group = await this.prisma.group.findUnique({
        where: {
          id: id
        }
      });

      if(!group) {
        throw new BadRequestException("Group not found");
      }

      const role: Role = await this.prisma.role.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive"
          }
        }
      });

      if(!role) {
        throw new BadRequestException("Role not found");
      }
      
      const result = await this.prisma.groupRoles.findFirst({
        where:{
          roleId: role.id,
          groupId: group.id
        }
      })

      if(!result) {
        return await this.prisma.groupRoles.create({
          data:{
            role: { connect: { id: role.id } },
            group: { connect: { id: group.id } },
          }
        });
      }
      else {
        throw new ConflictException("This group has already been allocated to this role")
      }
      
    }

    public async updateRoleScopes(
      id: number,
      data: RoleDto[]
    ): Promise<RoleScopes[]> {
      const role: Role = await this.prisma.role.findUnique({
        where: {
          id: id
        }
      });

      if(!role) {
        throw new BadRequestException("Group not found");
      }

      await this.prisma.roleScopes.deleteMany({
        where: {
          roleId: id
        }
      });

      const scopeNames: string[] = data.map((value) => value.name);
      const scopes: Scope[] = await this.prisma.scope.findMany({
        where: {
          name: {
            in: scopeNames
          }
        }
      });
      const createPromises: Promise<RoleScopes>[] = [];
      scopes.forEach(async scope => {      
        createPromises.push(
           this.prisma.roleScopes.create({
          data: {
            scope: { connect: { id : scope.id } },
            role: { connect: { id: role.id } }
          }
        }))
      })
      return await this.prisma.$transaction(createPromises); 
    }
  
    public async updateGroupRoles(
      id: number,
      data: RoleDto[]
    ): Promise<GroupRoles[]> {
      const group: Group = await this.prisma.group.findUnique({
        where: {
          id: id
        }
      });

      if(!group) {
        throw new BadRequestException("Group not found");
      }

      await this.prisma.groupRoles.deleteMany({
        where: {
          groupId: id
        }
      });

      const roleNames: string[] = data.map((value) => value.name);
      const roles: Role[] = await this.prisma.role.findMany({
        where: {
          name: {
            in: roleNames
          }
        }
      });
      const createPromises: Promise<GroupRoles>[] = [];
      roles.forEach(async role => {      
        createPromises.push(
          this.prisma.groupRoles.create({
            data: {
              group: { connect: { id : group.id } },
              role: { connect: { id: role.id } }
            }
          })
        )
      })
      return await this.prisma.$transaction(createPromises);
    }
    
    public async deleteGroupRole(groupId: number,  data: RevokeGroupRoleDto): Promise<Prisma.BatchPayload> {
    
      const RoleId: Number = (await this.prisma.role.findFirst({
        select: {
          id: true
        },
        where: {
          name: {
            equals: data.name,
            mode: "insensitive"
          }
        }
      }))?.id

      if(!RoleId) {
        throw new BadRequestException(data.name + " is not available");
      }

      const rolesOnGroups: Prisma.BatchPayload = await this.prisma.groupRoles.deleteMany({ 
        where:
          {
            groupId: groupId,
            roleId: RoleId
          }
        });
      return rolesOnGroups;
    }

    public async deleteRole(id: number): Promise<Role> {
      
      try {
        await this.prisma.groupRoles.deleteMany({
          where:{
            roleId: id
          }
        })
        await this.prisma.roleScopes.deleteMany({
          where:{
            roleId: id
          }
        })
        const role: Role = await this.prisma.role.delete({
          where:{
            id: id
          }
        });
        return role;
      }
      catch(error) {
        console.log(error);
        throw new InternalServerErrorException(error);
      }
    }
  }
  
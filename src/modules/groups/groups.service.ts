import { Injectable, NotFoundException } from '@nestjs/common';
import type { GroupRoles, Prisma } from '@prisma/client';
import { Group } from '@prisma/client';
import randomColor from 'randomcolor';
import { GROUP_NOT_FOUND } from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import {CommonService} from '../../helpers/common-functions'

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(
    userId: number,
    data: Omit<Omit<Prisma.GroupCreateInput, 'group'>, 'user'>,
    parentId: number
  ) {
    let initials = data.name.trim().substr(0, 2).toUpperCase();
    if (data.name.includes(' '))
      initials = data.name
        .split(' ')
        .map((i) => i.trim().substr(0, 1))
        .join('')
        .toUpperCase();
    data.profilePictureUrl =
      data.profilePictureUrl ??
      `https://ui-avatars.com/api/?name=${initials}&background=${randomColor({
        luminosity: 'light',
      }).replace('#', '')}&color=000000`;

    if(parentId) {
      const createdGroup = await this.prisma.group.create({
        include: { memberships: { include: { group: true } } },
        data: {
          ...data,
          parent: {connect: {id: parentId}},
          memberships: {
            create: { role: 'OWNER', user: { connect: { id: userId } } },
          },
        },
      });
      await this.getParentRoles(createdGroup.id, createdGroup.parentId);
      return createdGroup;
    }
    else {
      return this.prisma.group.create({
        include: { memberships: { include: { group: true } } },
        data: {
          ...data,
          memberships: {
            create: { role: 'OWNER', user: { connect: { id: userId } } },
          },
        },
      });
    }
  }

  async getGroups(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GroupWhereUniqueInput;
    where?: Prisma.GroupWhereInput;
    orderBy?: Prisma.GroupOrderByInput;
    startDate ?: string;
    endDate ?: string;
  }): Promise<{groups: Expose<Group>[], length: number}> {
    var { skip, take, cursor, where, orderBy, startDate, endDate } = params;
    
    try {
      var dateRange: {start: string, end: string} = null;
      if(startDate && endDate) dateRange = {start: startDate, end: endDate}
      if(where) {
        if(where.name) {
          where.name['mode'] = 'insensitive'
        }
      }
      else {
        where = {}
      }

      if(dateRange) {
        const creationDateRange: {gt: string, lt: string} = {
          gt: dateRange.start,
          lt: dateRange.end
        }
        where['createdAt'] = creationDateRange
      }
      if(!orderBy){
        orderBy = {
          createdAt: 'desc'
        }
      }
      const groups = await this.prisma.group.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include:{
          parent: true
        }
      });
      const totalGroups: number = await this.prisma.group.count({where});
      return {groups: groups.map((user) => this.prisma.expose<Group>(user)), length: totalGroups};
    } catch (error) {
      return {groups: [], length: 0};
    }
  }

  async getParents(): Promise<{name: string, id: number}[]> {
    try {
      const groups: {name: string, id: number}[] = (await this.prisma.group.findMany({
        select:{
          parent: true
        },
        where:{
          parent: {
            isNot: null
          }
        }
      })).map(tuple => {
          return {name: tuple.parent.name, id: tuple.parent.id}
        });
      return CommonService.findUnique(groups, 'name');
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getGroup(
    id: number,
    {
      select,
      include,
    }: {
      select?: Record<string, boolean>;
      include?: Record<string, boolean>;
    },
  ): Promise<Expose<Group>> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      select,
      include,
    } as any);
    if (!group) throw new NotFoundException(GROUP_NOT_FOUND);
    return this.prisma.expose<Group>(group);
  }

  async updateGroup(
    id: number,
    data: Prisma.GroupUpdateInput,
  ): Promise<Expose<Group>> {
    const testGroup = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.group.update({
      where: { id },
      data,
    });
    return this.prisma.expose<Group>(group);
  }

  async replaceGroup(
    id: number,
    data: Prisma.GroupCreateInput,
  ): Promise<Expose<Group>> {
    const testGroup = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.group.update({
      where: { id },
      data,
    });
    return this.prisma.expose<Group>(group);
  }

  async deleteGroup(id: number): Promise<Expose<Group>> {
    const testGroup = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    await this.prisma.membership.deleteMany({ where: { group: { id } } });
    await this.prisma.groupRoles.deleteMany({ where: { group: { id } } });
    const group = await this.prisma.group.delete({
      where: { id },
    });
    return this.prisma.expose<Group>(group);
  }

  async getSubgroups(
    id: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.GroupWhereUniqueInput;
      where?: Prisma.GroupWhereInput;
      orderBy?: Prisma.GroupOrderByInput;
    },
  ): Promise<Expose<Group>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    try {
      const groups = await this.prisma.group.findMany({
        skip,
        take,
        cursor,
        where: { ...where, parent: { id } },
        orderBy,
      });
      return groups.map((user) => this.prisma.expose<Group>(user));
    } catch (error) {
      return [];
    }
  }

  private async getParentRoles(groupId: number, parentId: number): Promise<void> {

    const parentRoleIds: number[] = (await this.prisma.groupRoles.findMany({
      select: {
        roleId: true
      },
      where: {
        groupId: parentId
      }
    })).map(tuple => tuple.roleId);

    for await(let roleId of parentRoleIds) {
      await this.prisma.groupRoles.create({
        data:{
          group: { connect: { id : groupId} },
          role: { connect: { id: roleId } }
        }
      })
    }
  }
}

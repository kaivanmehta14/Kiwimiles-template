import {
    Injectable,
} from '@nestjs/common';
import { Prisma, Scope } from '@prisma/client';
import { Expose } from 'src/providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class ScopeService {
    constructor(
    private prisma: PrismaService
    ) {}

    public async getAllScopes(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByInput;
      }): Promise<{scopes: Expose<Scope>[], length: number}> {
        const { skip, take, cursor, where, orderBy } = params;
        const scopes: Scope[] = await this.prisma.scope.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
          });
        const totalScopes: number = await this.prisma.scope.count();
        return {scopes: scopes, length: totalScopes};
    }
}

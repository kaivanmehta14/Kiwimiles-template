import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DomainsModule } from '../../modules/domains/domains.module';
import { ElasticSearchModule } from '../elasticsearch/elasticsearch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../../modules/users/users.module';
import { MetricsModule } from '../../modules/metrics/metrics.module';
import { TasksController } from './tasks.controller';
import { DynamicTasksService } from './dynamic-tasks.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ElasticSearchModule,
    DomainsModule,
    UsersModule,
    MetricsModule,
  ],
  controllers: [TasksController],
  providers: [DynamicTasksService],
  exports: [DynamicTasksService],
})
export class TasksModule {}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Configuration } from '../../config/configuration.interface';
import { DomainsService } from '../../modules/domains/domains.service';
import { MetricsService } from '../../modules/metrics/metrics.service';
import { UsersService } from '../../modules/users/users.service';
import { ElasticSearchService } from '../elasticsearch/elasticsearch.service';
import { PrismaService } from '../prisma/prisma.service';
import { CronJob } from 'cron';
import { TaskSchedules } from '@prisma/client';

@Injectable()
export class DynamicTasksService {
  private readonly logger = new Logger(DynamicTasksService.name);
  private taskNames: string[];
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private elasticSearchService: ElasticSearchService,
    private domainsService: DomainsService,
    private usersService: UsersService,
    private metricsService: MetricsService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    const tasks: TaskSchedules[] = await this.prisma.taskSchedules.findMany();
    this.taskNames = tasks.map(task => task.taskName);
    this.syncTasksWithDatabase(tasks);
  }

  async updateMetrics(that:this) {
    await that.metricsService.updateProcessMetrics();
  }
  
  async deleteOldSessions(that:this) {
    const now = new Date();
    const unusedRefreshTokenExpiryDays =
      that.configService.get<number>('security.unusedRefreshTokenExpiryDays') ??
      30;
    now.setDate(now.getDate() - unusedRefreshTokenExpiryDays);
    const deleted = await that.prisma.session.deleteMany({
      where: { updatedAt: { lte: now } },
    });
    if (deleted.count)
      that.logger.debug(`Deleted ${deleted.count} expired sessions`);
  }

  async deleteInactiveUsers(that:this) {
    const now = new Date();
    const inactiveUserDeleteDays:number =
      that.configService.get<number>('security.inactiveUserDeleteDays') ?? 30;
    now.setDate(now.getDate() - inactiveUserDeleteDays);
    const deleted = await that.prisma.user.findMany({
      select: { id: true },
      where: {
        active: false,
        sessions: { every: { updatedAt: { lte: now } } },
      },
    });
    if (deleted.length) {
      for await (const user of deleted)
        await that.usersService.deleteUser(user.id);
      that.logger.debug(`Deleted ${deleted.length} inactive users`);
    }
  }

  async deleteOldLogs(that:this) {
    const tracking = that.configService.get<Configuration['tracking']>(
      'tracking',
    );
    if (tracking.deleteOldLogs)
      return that.elasticSearchService.deleteOldRecords(
        tracking.index,
        tracking.deleteOldLogsDays,
      );
  }

  async verifyDomains(that:this) {
    const domains = await that.prisma.domain.findMany({
      where: { isVerified: false },
    });
    for await (const domain of domains) {
      try {
        await that.domainsService.verifyDomain(domain.groupId, domain.id);
      } catch (error) {}
    }
  }
  
  async deleteOldAuditLogs(that) {
    const now = new Date();
    now.setDate(now.getDate() - 90);
    const deleted = await that.prisma.auditLog.deleteMany({
      where: { createdAt: { lte: now } },
    });
    if (deleted.count) that.logger.debug(`Deleted ${deleted.count} audit logs`);
  }

  public getAllJobs(): {name: string, time: string}[] {
    const jobs = this.schedulerRegistry.getCronJobs();
    const returnJobs: {name: string, time: string}[] = [];
    for(let [key, value] of jobs){
      const dto: {name: string,  time: string} = {
        name: key,
        time: this.convertCronTimingToTiming(value['cronTime']['source'])
      }
      returnJobs.push(dto);
    }
    return returnJobs;
  }

  public getAllTimingOptions(): string[] {
    return Object.keys(CronExpression);
  }

  public updateTimings(updatedTiming: UpdateTimingDto[]): void {
    const that = this
    updatedTiming.forEach(async (timing) => {
      if(this.taskNames.indexOf(timing.taskName) < 0) { throw new BadRequestException("Task name not found")}
      this.schedulerRegistry.deleteCronJob(timing.taskName);
      const cronTime: string = this.convertTimingToCronTiming(timing.timing);
      if(!cronTime) {throw new BadRequestException("Timings are wrong");}
      const job = new CronJob(cronTime, () => {
        switch(timing.taskName) {
          case "Update Metrics":
            that.updateMetrics(that);
            break;
          case "Delete Old Sessions":
            that.deleteOldSessions(that);
            break;
          case "Delete Inactive Users":
            that.deleteInactiveUsers(that);
            break;
          case "Delete Old Logs":
            that.deleteOldLogs(that);
            break;
          case "Verify Domains":
            that.verifyDomains(that);
            break;
          case "Delete Old Audit Logs":
            that.deleteOldAuditLogs(that);
            break;
        }
      })
      this.schedulerRegistry.addCronJob(timing.taskName, job);
      job.start();

      const dbtaskId: number = (await this.prisma.taskSchedules.findFirst({
        select: {
          id: true
        },
        where: {
          taskName: timing.taskName
        }
      }))?.id;
      if(!dbtaskId) this.logger.error("task not found");
      else {
        await this.prisma.taskSchedules.update({
          where:{
            id: dbtaskId
          },
          data:{
            taskTime: timing.timing
          }
        })
      }
    })
  }

  private convertTimingToCronTiming(timing: string): string {
    const clockTime: string = timing.toUpperCase().replace(' ', '').trim(); 
    return CronExpression[clockTime];
  }

  private convertCronTimingToTiming(timing: string): string {
    for(let [key, value] of Object.entries(CronExpression)){
      if(value == timing)
        return key;
    }
    return '';
  }

  private syncTasksWithDatabase(tasks: TaskSchedules[]){
    const that = this;
    tasks.forEach(task => {
      const cronTime: string = this.convertTimingToCronTiming(task.taskTime);
      const job = new CronJob(cronTime, () => {
        switch(task.taskName) {
          case "Update Metrics":
            that.updateMetrics(that);
            break;
          case "Delete Old Sessions":
            that.deleteOldSessions(that);
            break;
          case "Delete Inactive Users":
            that.deleteInactiveUsers(that);
            break;
          case "Delete Old Logs":
            that.deleteOldLogs(that);
            break;
          case "Verify Domains":
            that.verifyDomains(that);
            break;
          case "Delete Old Audit Logs":
            that.deleteOldAuditLogs(that);
            break;
        }
      })
      this.schedulerRegistry.addCronJob(task.taskName, job);
      job.start();
    })
  }
}

export class UpdateTimingDto {
  taskName: string;
  timing: string;
}
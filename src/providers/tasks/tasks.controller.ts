import {
  Body,
    Controller,
    Post, 
    Get
} from '@nestjs/common';
import { DynamicTasksService, UpdateTimingDto } from './dynamic-tasks.service';
  
  @Controller('tasks')
  export class TasksController {
    constructor(private tasksService: DynamicTasksService) {}
  
    /** Update timings */
    @Get()
    async getAll(): Promise<{name: string, time: string}[]> {
      return this.tasksService.getAllJobs();
    }

    @Get('/timing-options')
    async getAllAvailableTimingOptions(): Promise<string[]> {
      return this.tasksService.getAllTimingOptions();
    }

    /** Update timings */
    @Post()
    async updateTimings(@Body() data: UpdateTimingDto[]) {
      return this.tasksService.updateTimings(data);
    }
  }
  
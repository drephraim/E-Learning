import { Controller, Patch, Body, Param, Get, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses/progress')
export class ProgressController {
  constructor(private readonly coursesService: CoursesService) {}

  @Patch(':moduleId')
  async updateProgress(
    @Param('moduleId') moduleId: string,
    @Body() dto: { userId: string, status?: string, quizScore?: number, metadata?: any }
  ) {
    return await this.coursesService.updateProgress({
      ...dto,
      moduleId
    });
  }
}

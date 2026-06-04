import { Controller, Patch, Body, Param, Get, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class ProgressController {
  constructor(private readonly coursesService: CoursesService) {}

  @Patch('progress/:moduleId')
  async updateProgress(
    @Param('moduleId') moduleId: string,
    @Body() dto: { userId: string, status?: string, quizScore?: number, confidenceRating?: number, metadata?: any }
  ) {
    return await this.coursesService.updateProgress({
      ...dto,
      moduleId
    });
  }

  @Get(':courseId/progress')
  async getProgress(
    @Param('courseId') courseId: string,
    @Query('userId') userId: string
  ) {
    return await this.coursesService.getCourseProgress(courseId, userId);
  }

  @Patch(':courseId/complete')
  async completeCourse(
    @Param('courseId') courseId: string,
    @Body() dto: { userId: string }
  ) {
    return await this.coursesService.completeCourse(courseId, dto.userId);
  }

  @Post(':courseId/reviews')
  async addRating(
    @Param('courseId') courseId: string,
    @Body() dto: { userId: string, rating: number, review?: string }
  ) {
    return await this.coursesService.addRating({
      ...dto,
      courseId
    });
  }

  @Get(':courseId/reviews')
  async getRatings(@Param('courseId') courseId: string) {
    return await this.coursesService.getRatings(courseId);
  }

  @Get('suggestions')
  async getSuggestions(
    @Query('userId') userId: string,
    @Query('courseId') courseId: string
  ) {
    return await this.coursesService.getSuggestions(userId, courseId);
  }
}

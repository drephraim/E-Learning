import { Controller, Post, Body, Get, Param, Query, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('generate')
  async generateCourse(
    @Body() dto: { userId: string, topic: string, difficulty: string, chapters: number, includeYoutube: boolean }
  ) {
    return await this.coursesService.generateCourse(dto);
  }

  @Get('all')
  async getAllCourses(@Query('userId') userId?: string) {
    return await this.coursesService.getAllCourses(userId);
  }

  @Get('user/:userId')
  async getUserCourses(@Param('userId') userId: string) {
    return await this.coursesService.getUserCourses(userId);
  }

  @Get('enrolled/:userId')
  async getEnrolledCourses(@Param('userId') userId: string) {
    return await this.coursesService.getEnrolledCourses(userId);
  }

  @Get('daily-recommendation')
  async getDailyRecommendation(@Query('userId') userId?: string) {
    return await this.coursesService.getDailyRecommendation(userId);
  }

  @Post(':id/enroll')
  async enrollInCourse(@Param('id') id: string, @Body() dto: { userId: string }) {
    return await this.coursesService.enrollInCourse(id, dto.userId);
  }

  @Post(':id/unenroll')
  async unenrollCourse(@Param('id') id: string, @Body() dto: { userId: string }) {
    return await this.coursesService.unenrollCourse(id, dto.userId);
  }

  @Get(':id')
  async getCourse(@Param('id') id: string, @Query('userId') userId?: string) {
    return await this.coursesService.getCourse(id, userId);
  }

  @Delete(':id')
  async deleteCourse(@Param('id') id: string, @Query('userId') userId: string) {
    return await this.coursesService.deleteCourse(id, userId);
  }
}

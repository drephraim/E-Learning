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
  async getAllCourses() {
    return await this.coursesService.getAllCourses();
  }

  @Get('user/:userId')
  async getUserCourses(@Param('userId') userId: string) {
    return await this.coursesService.getUserCourses(userId);
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

import { Controller, Post, Body, Get, Param, Query, Delete, Res } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('generate')
  async generateCourse(
    @Body()
    dto: {
      userId: string;
      topic: string;
      difficulty: string;
      chapters: number;
      includeYoutube: boolean;
      groundingMode?: string;
      academicCourseId?: string;
      academicMaterialIds?: string[];
      recommendationUserId?: string;
      recommendationSourceId?: string;
    },
  ) {
    return await this.coursesService.generateCourse(dto);
  }

  // --- PHASE 3: INSTITUTIONAL SELECTION & PREVIEW ENDPOINTS ---
  @Get('institutional-courses')
  async getInstitutionalCourses(
    @Query('userId') userId?: string,
    @Query('search') search?: string,
  ) {
    return await this.coursesService.getInstitutionalCourses(userId, search);
  }

  @Get('institutional-courses/:id/materials')
  async getInstitutionalMaterials(
    @Param('id') courseId: string,
    @Query('userId') userId?: string,
  ) {
    return await this.coursesService.getInstitutionalMaterials(courseId, userId);
  }

  @Get('materials/:id/preview')
  async getMaterialPreview(
    @Param('id') materialId: string,
    @Query('userId') userId?: string,
  ) {
    return await this.coursesService.getMaterialPreview(materialId, userId);
  }

  @Get('materials/:id/download')
  async downloadMaterial(
    @Param('id') materialId: string,
    @Res() res: any,
  ) {
    return await this.coursesService.downloadMaterialFile(materialId, res);
  }

  @Get(':id/references')
  async getCourseReferences(@Param('id') courseId: string) {
    return await this.coursesService.getCourseReferences(courseId);
  }

  // --- EXISTING COURSE ENDPOINTS ---
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

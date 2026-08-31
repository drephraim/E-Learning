import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles,
  BadRequestException,
  Headers
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { LecturerService, CreateCourseDto } from './lecturer.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('lecturer')
@UseGuards(RolesGuard)
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  // --- STATS ---
  @Get('stats/:userId')
  @Roles('LECTURER')
  async getLecturerStats(@Param('userId') userId: string) {
    return this.lecturerService.getLecturerStats(userId);
  }

  // --- COURSES ---
  @Post('courses')
  @Roles('LECTURER')
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.lecturerService.createCourse(dto);
  }

  @Get('courses/:userId')
  @Roles('LECTURER')
  async getCourses(@Param('userId') userId: string) {
    return this.lecturerService.getCourses(userId);
  }

  @Get('courses/detail/:id')
  @Roles('LECTURER')
  async getCourseDetail(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.lecturerService.getCourseDetail(id, userId);
  }

  @Patch('courses/:id')
  @Roles('LECTURER')
  async updateCourse(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() body: Partial<CreateCourseDto> & { status?: string },
  ) {
    return this.lecturerService.updateCourse(id, userId, body);
  }

  @Delete('courses/:id')
  @Roles('LECTURER')
  async deleteCourse(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.lecturerService.deleteCourse(id, userId);
  }

  // --- ACADEMIC MATERIALS ---
  @Post('materials/upload')
  @Roles('LECTURER')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadMaterial(
    @UploadedFiles() files: any[],
    @UploadedFile() singleFile: any,
    @Body() body: { userId: string; courseId?: string; title?: string; description?: string; materialType?: string; visibility?: string },
  ) {
    const uploadedFiles = (files && files.length > 0) ? files : (singleFile ? [singleFile] : []);
    if (uploadedFiles.length === 0) {
      throw new BadRequestException('Please attach at least one document file (PDF, DOCX, PPTX, TXT).');
    }

    const createdMaterials = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      let fileTitle = body.title;
      if (!fileTitle || uploadedFiles.length > 1) {
        const cleanName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        fileTitle = (uploadedFiles.length > 1 && body.title) ? `${body.title} - ${cleanName}` : cleanName;
      }

      const mat = await this.lecturerService.uploadAcademicMaterial({
        userId: body.userId,
        courseId: body.courseId,
        title: fileTitle,
        description: body.description,
        materialType: body.materialType || 'OTHER',
        visibility: body.visibility || 'AVAILABLE',
        file,
      });
      createdMaterials.push(mat);
    }

    return {
      status: 'success',
      count: createdMaterials.length,
      materials: createdMaterials,
    };
  }

  @Get('materials/:userId')
  @Roles('LECTURER')
  async getMaterials(
    @Param('userId') userId: string,
    @Query('courseId') courseId?: string,
    @Query('materialType') materialType?: string,
    @Query('search') search?: string,
  ) {
    return this.lecturerService.getMaterials(userId, { courseId, materialType, search });
  }

  @Get('materials/detail/:id')
  @Roles('LECTURER')
  async getMaterialDetail(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.lecturerService.getMaterialDetail(id, userId);
  }

  @Patch('materials/:id')
  @Roles('LECTURER')
  async updateMaterial(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { title?: string; description?: string; visibility?: string; materialType?: string },
  ) {
    return this.lecturerService.updateMaterial(id, userId, body);
  }

  @Delete('materials/:id')
  @Roles('LECTURER')
  async deleteMaterial(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.lecturerService.deleteMaterial(id, userId);
  }

  @Put('materials/:id/content')
  @Roles('LECTURER')
  async updateMaterialContent(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { text: string },
  ) {
    if (!body.text || !body.text.trim()) {
      throw new BadRequestException('Text content cannot be empty.');
    }
    return this.lecturerService.updateMaterialText(id, userId, body.text);
  }

  @Post('materials/:id/reprocess')
  @Roles('LECTURER')
  async reprocessMaterial(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.lecturerService.reprocessMaterial(id, userId);
  }

  // --- SYLLABI MANAGEMENT & MANUAL CORRECTIONS ---
  @Get('syllabi/:userId')
  @Roles('LECTURER')
  async getSyllabi(@Param('userId') userId: string) {
    return this.lecturerService.getSyllabi(userId);
  }

  @Get('syllabi/detail/:id')
  @Roles('LECTURER')
  async getSyllabusDetail(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.lecturerService.getSyllabusDetail(id, userId);
  }

  @Put('syllabi/:id')
  @Roles('LECTURER')
  async updateSyllabus(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body()
    body: {
      title?: string;
      objectives?: Array<{ text: string }>;
      outcomes?: Array<{ text: string }>;
      topics?: Array<{ title: string; description?: string; weekNumber?: number }>;
      readings?: Array<{ citation: string; title?: string; author?: string }>;
    },
  ) {
    return this.lecturerService.updateSyllabus(id, userId, body);
  }

  // --- STUDENTS & ENROLMENT MANAGEMENT ---
  @Get('students/:userId')
  @Roles('LECTURER')
  async getStudents(@Param('userId') userId: string) {
    return this.lecturerService.getStudents(userId);
  }

  @Post('students/enroll')
  @Roles('LECTURER')
  async enrollStudent(
    @Headers('x-user-id') userId: string,
    @Body() body: { courseId: string; studentEmail: string },
  ) {
    if (!body.courseId || !body.studentEmail) {
      throw new BadRequestException('Please provide both courseId and studentEmail.');
    }
    return this.lecturerService.enrollStudentByEmail(userId, body.courseId, body.studentEmail);
  }

  @Post('students/unenroll')
  @Roles('LECTURER')
  async unenrollStudent(
    @Headers('x-user-id') userId: string,
    @Body() body: { courseId: string; studentEmail: string },
  ) {
    if (!body.courseId || !body.studentEmail) {
      throw new BadRequestException('Please provide both courseId and studentEmail.');
    }
    return this.lecturerService.unenrollStudentByEmail(userId, body.courseId, body.studentEmail);
  }

  @Patch('courses/:id/visibility')
  @Roles('LECTURER')
  async updateCourseVisibility(
    @Param('id') courseId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { visibility: string },
  ) {
    if (!body.visibility) {
      throw new BadRequestException('Please provide visibility (PUBLIC or PRIVATE).');
    }
    return this.lecturerService.updateCourseVisibility(courseId, userId, body.visibility);
  }

  @Get('profile/:userId')
  @Roles('LECTURER')
  async getProfile(@Param('userId') userId: string) {
    return this.lecturerService.getProfile(userId);
  }

  @Patch('profile/:userId')
  @Roles('LECTURER')
  async updateProfile(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    return this.lecturerService.updateProfile(userId, body);
  }

  @Patch('modules/:moduleId')
  @Roles('LECTURER')
  async updateModuleContent(
    @Param('moduleId') moduleId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { title?: string; content?: string; youtubeUrl?: string },
  ) {
    return this.lecturerService.updateModuleContent(userId, moduleId, body);
  }

  // --- CONTENT VALIDATION & ANALYTICS ENDPOINTS ---
  @Get('validation/:userId')
  @Roles('LECTURER', 'STUDENT', 'ADMIN')
  async getValidationCourses(@Param('userId') userId: string) {
    return this.lecturerService.getValidationCourses(userId);
  }

  @Patch('validation/verify/:courseId')
  @Roles('LECTURER')
  async verifyCourseContent(
    @Param('courseId') courseId: string,
    @Body() body: { status: string },
  ) {
    return this.lecturerService.verifyCourseContent(courseId, body.status || 'VERIFIED');
  }

  @Get('analytics/:userId')
  @Roles('LECTURER')
  async getDepartmentAnalytics(@Param('userId') userId: string) {
    return this.lecturerService.getDepartmentAnalytics(userId);
  }
}

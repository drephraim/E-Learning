import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { ProgressController } from './progress.controller';
import { CoursesService } from './courses.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController, ProgressController],
  providers: [CoursesService],
})
export class CoursesModule {}

import { Module } from '@nestjs/common';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';
import { DocumentProcessorService } from './document-processor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LecturerController],
  providers: [LecturerService, DocumentProcessorService],
  exports: [LecturerService, DocumentProcessorService],
})
export class LecturerModule {}

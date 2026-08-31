import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { LecturerModule } from './lecturer/lecturer.module';

@Module({
  imports: [AuthModule, CoursesModule, UsersModule, LecturerModule],
})
export class AppModule {}

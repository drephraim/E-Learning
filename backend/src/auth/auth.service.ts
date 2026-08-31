import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SyncUserDto {
  uid: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string; // "STUDENT" | "LECTURER"
  institution?: string;
  studentProfile?: {
    programme: string;
    level: string;
  };
  lecturerProfile?: {
    title: string;
    department: string;
    specialization?: string;
    verificationStatus?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithDatabase(dto: SyncUserDto) {
    this.logger.log(`Syncing user ${dto.email} (UID: ${dto.uid}, Role: ${dto.role || 'STUDENT'}) to database...`);

    const role = (dto.role || 'STUDENT').toUpperCase();
    const cleanStr = (s?: string) => (s && s !== 'undefined' && s !== 'null' ? s.trim() : undefined);
    const firstName = cleanStr(dto.firstName);
    const lastName = cleanStr(dto.lastName);
    const nameInput = cleanStr(dto.name);
    const fullName = nameInput || [firstName, lastName].filter(Boolean).join(' ') || dto.email.split('@')[0];

    try {
      // Upsert main User record
      const user = await this.prisma.user.upsert({
        where: { id: dto.uid },
        update: {
          email: dto.email,
          name: fullName,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role: role,
          institution: cleanStr(dto.institution) || undefined,
        },
        create: {
          id: dto.uid,
          email: dto.email,
          name: fullName,
          firstName: firstName || null,
          lastName: lastName || null,
          role: role,
          institution: cleanStr(dto.institution) || null,
        },
      });

      // Handle student profile creation/update
      if (role === 'STUDENT' && dto.studentProfile) {
        await this.prisma.studentProfile.upsert({
          where: { userId: user.id },
          update: {
            programme: dto.studentProfile.programme,
            level: dto.studentProfile.level,
          },
          create: {
            userId: user.id,
            programme: dto.studentProfile.programme,
            level: dto.studentProfile.level,
          },
        });
      }

      // Handle lecturer profile creation/update
      if (role === 'LECTURER' && dto.lecturerProfile) {
        await this.prisma.lecturerProfile.upsert({
          where: { userId: user.id },
          update: {
            title: dto.lecturerProfile.title,
            department: dto.lecturerProfile.department,
            specialization: dto.lecturerProfile.specialization || null,
            verificationStatus: dto.lecturerProfile.verificationStatus || 'VERIFIED',
          },
          create: {
            userId: user.id,
            title: dto.lecturerProfile.title,
            department: dto.lecturerProfile.department,
            specialization: dto.lecturerProfile.specialization || null,
            verificationStatus: dto.lecturerProfile.verificationStatus || 'VERIFIED',
          },
        });
      }

      // Automatically link pending course invitations for student email
      if (dto.email) {
        const cleanEmail = dto.email.trim().toLowerCase();
        try {
          const pendingInvites = await this.prisma.courseEnrollment.findMany({
            where: { studentEmail: cleanEmail },
          });

          for (const invite of pendingInvites) {
            await this.prisma.courseEnrollment.update({
              where: { id: invite.id },
              data: { studentId: user.id, status: 'ENROLLED' },
            });

            await this.prisma.userCourseProgress.upsert({
              where: { userId_courseId: { userId: user.id, courseId: invite.courseId } },
              update: {},
              create: {
                userId: user.id,
                courseId: invite.courseId,
                isCompleted: false,
                totalTimeSpentSeconds: 0,
              },
            });
          }
        } catch (e: any) {
          this.logger.warn(`Failed linking pending invites for ${cleanEmail}: ${e.message}`);
        }
      }

      // Fetch complete user with profiles
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          studentProfile: true,
          lecturerProfile: true,
        },
      });

      return { status: 'success', user: fullUser };
    } catch (err: any) {
      if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
        this.logger.warn(`Email ${dto.email} already registered. Fetching existing record.`);
        const existing = await this.prisma.user.findUnique({
          where: { email: dto.email },
          include: {
            studentProfile: true,
            lecturerProfile: true,
          },
        });
        if (existing) {
          return { status: 'success', user: existing };
        }
      }
      this.logger.error(`Failed to sync user ${dto.email}: ${err.message}`);
      throw err;
    }
  }

  async getUserRoleAndProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        lecturerProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  }
}

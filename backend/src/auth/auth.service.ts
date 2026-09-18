import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    this.logger.log(`Syncing user ${dto.email} (UID: ${dto.uid}, Requested Role: ${dto.role || 'Unspecified'}) to database...`);

    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanStr = (s?: string) => (s && s !== 'undefined' && s !== 'null' ? s.trim() : undefined);
    const firstName = cleanStr(dto.firstName);
    const lastName = cleanStr(dto.lastName);
    const nameInput = cleanStr(dto.name);
    const fullName = nameInput || [firstName, lastName].filter(Boolean).join(' ') || cleanEmail.split('@')[0];

    try {
      // Find existing user by ID or Email
      let existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: dto.uid },
            { email: cleanEmail },
          ],
        },
        include: {
          studentProfile: true,
          lecturerProfile: true,
        },
      });

      let effectiveRole: string;

      if (existingUser) {
        // Check role mismatch if dto.role was explicitly passed
        if (dto.role) {
          const requestedRole = dto.role.toUpperCase();
          const currentRole = existingUser.role.toUpperCase();
          if (requestedRole !== currentRole) {
            const registeredRoleLabel = currentRole === 'STUDENT' ? 'Student' : 'Lecturer';
            const message = `This account is registered as a ${registeredRoleLabel}. Please select the ${registeredRoleLabel} tab to sign in.`;
            this.logger.warn(`Role mismatch for ${cleanEmail}: requested ${requestedRole}, registered as ${currentRole}`);
            throw new BadRequestException(message);
          }
        }

        effectiveRole = existingUser.role.toUpperCase();

        // Update existing user without changing role
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: cleanEmail,
            name: fullName || existingUser.name,
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            institution: cleanStr(dto.institution) || existingUser.institution,
          },
        });
      } else {
        // Create new user
        effectiveRole = (dto.role || 'STUDENT').toUpperCase();

        existingUser = await this.prisma.user.create({
          data: {
            id: dto.uid,
            email: cleanEmail,
            name: fullName,
            firstName: firstName || null,
            lastName: lastName || null,
            role: effectiveRole,
            institution: cleanStr(dto.institution) || null,
          },
          include: {
            studentProfile: true,
            lecturerProfile: true,
          },
        });
      }

      // Handle student profile creation/update ONLY if user's effectiveRole is STUDENT
      if (effectiveRole === 'STUDENT') {
        const studentData = dto.studentProfile || {
          programme: cleanStr(dto.institution) || 'General Student',
          level: 'Level 100',
        };
        await this.prisma.studentProfile.upsert({
          where: { userId: existingUser.id },
          update: {
            programme: studentData.programme,
            level: studentData.level,
          },
          create: {
            userId: existingUser.id,
            programme: studentData.programme,
            level: studentData.level,
          },
        });
      }

      // Handle lecturer profile creation/update ONLY if user's effectiveRole is LECTURER
      if (effectiveRole === 'LECTURER') {
        const lecturerData = dto.lecturerProfile || {
          title: 'Dr.',
          department: cleanStr(dto.institution) || 'General',
          specialization: null,
          verificationStatus: 'VERIFIED',
        };
        await this.prisma.lecturerProfile.upsert({
          where: { userId: existingUser.id },
          update: {
            title: lecturerData.title,
            department: lecturerData.department,
            specialization: lecturerData.specialization || null,
            verificationStatus: lecturerData.verificationStatus || 'VERIFIED',
          },
          create: {
            userId: existingUser.id,
            title: lecturerData.title,
            department: lecturerData.department,
            specialization: lecturerData.specialization || null,
            verificationStatus: lecturerData.verificationStatus || 'VERIFIED',
          },
        });
      }

      // Automatically link pending course invitations for student email
      if (cleanEmail && effectiveRole === 'STUDENT') {
        try {
          const pendingInvites = await this.prisma.courseEnrollment.findMany({
            where: { studentEmail: cleanEmail },
          });

          for (const invite of pendingInvites) {
            await this.prisma.courseEnrollment.update({
              where: { id: invite.id },
              data: { studentId: existingUser.id, status: 'ENROLLED' },
            });

            await this.prisma.userCourseProgress.upsert({
              where: { userId_courseId: { userId: existingUser.id, courseId: invite.courseId } },
              update: {},
              create: {
                userId: existingUser.id,
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
        where: { id: existingUser.id },
        include: {
          studentProfile: true,
          lecturerProfile: true,
        },
      });

      return { status: 'success', user: fullUser };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
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

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithDatabase(dto: { uid: string; email: string; name: string }) {
    this.logger.log(`Syncing Firebase user ${dto.email} (UID: ${dto.uid}) to database...`);

    try {
      // Primary path: upsert by Firebase UID
      const user = await this.prisma.user.upsert({
        where: { id: dto.uid },
        update: {},
        create: {
          id: dto.uid,
          email: dto.email,
          name: dto.name,
        },
      });
      return { status: 'success', user };
    } catch (err: any) {
      // Handle unique constraint violation on email (e.g. same email, different UID)
      if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
        this.logger.warn(`Email ${dto.email} already registered under a different UID. Fetching existing record.`);
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
          return { status: 'success', user: existing };
        }
      }
      this.logger.error(`Failed to sync user ${dto.email}: ${err.message}`);
      throw err;
    }
  }
}

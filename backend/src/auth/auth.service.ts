import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithDatabase(dto: { uid: string; email: string; name: string }) {
    this.logger.log(`Syncing Firebase user ${dto.email} (UID: ${dto.uid}) to Neon database...`);

    // We use Prisma's upsert functionality to either return the existing user or create a new one
    const user = await this.prisma.user.upsert({
      where: {
        id: dto.uid, // Mapping Firebase UID directly to User.id
      },
      update: {
        // If they already exist, we could update their name or leave it alone
      },
      create: {
        id: dto.uid,
        email: dto.email,
        name: dto.name,
      },
    });

    return { status: 'success', user };
  }
}

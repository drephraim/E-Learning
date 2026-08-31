import * as dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    let retries = 5;
    let delay = 1000;
    while (retries > 0) {
      try {
        await this.$connect();
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          console.error('Failed to connect to Prisma database after retries:', err.message);
          throw err;
        }
        console.warn(`Prisma database connection failed (${err.message}). Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

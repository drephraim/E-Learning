import * as dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Enable full CORS for frontend connections
  app.enableCors({ origin: true, credentials: true }); 
  
  // Serve static assets from uploads directory with browser caching enabled
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { 
    prefix: '/uploads',
    maxAge: '1d',
    etag: true,
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`AdaptiveLearn Backend running on port ${port}`);
}
bootstrap();

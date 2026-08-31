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
  
  // Serve static assets from uploads directory
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`AdaptiveLearn Backend running on port ${port}`);
}
bootstrap();

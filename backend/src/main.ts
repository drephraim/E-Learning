import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Enable CORS so the React frontend can reach the Auth syncing endpoint safely
  app.enableCors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }); 
  
  // Serve AI-generated cover images from the uploads directory
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  
  await app.listen(3000);
}
bootstrap();

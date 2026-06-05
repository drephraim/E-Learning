import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../backend/src/app.module';
import express from 'express';

const server = express();

let nestApp: any;

export const createServer = async () => {
  if (!nestApp) {
    nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));
    nestApp.enableCors();
    await nestApp.init();
  }
  return server;
};

export default async (req: any, res: any) => {
  // Strip the /api prefix before forwarding to NestJS
  req.url = req.url.replace(/^\/api/, '');
  if (req.url === '') {
    req.url = '/';
  }
  
  await createServer();
  server(req, res);
};

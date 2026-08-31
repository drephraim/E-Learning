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
  try {
    // Strip the /api prefix before forwarding to NestJS
    req.url = req.url.replace(/^\/api/, '');
    if (req.url === '' || req.url === '/') {
      req.url = '/';
    }
    
    await createServer();
    server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

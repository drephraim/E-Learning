import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @HttpCode(200)
  async syncUser(@Body() syncDto: { uid: string; email: string; name: string }) {
    if (!syncDto.uid || !syncDto.email) {
      return { status: 'error', message: 'Missing authentication parameters' };
    }
    
    return await this.authService.syncUserWithDatabase(syncDto);
  }
}

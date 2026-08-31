import { Controller, Post, Body, HttpCode, Get, Param, NotFoundException } from '@nestjs/common';
import { AuthService, SyncUserDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @HttpCode(200)
  async syncUser(@Body() syncDto: SyncUserDto) {
    if (!syncDto.uid || !syncDto.email) {
      return { status: 'error', message: 'Missing authentication parameters' };
    }
    
    return await this.authService.syncUserWithDatabase(syncDto);
  }

  @Get('me/:userId')
  async getMe(@Param('userId') userId: string) {
    const user = await this.authService.getUserRoleAndProfile(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return { status: 'success', user };
  }
}

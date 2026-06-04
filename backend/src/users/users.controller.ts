import { Controller, Get, Patch, Body, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: { name?: string; email?: string }) {
    return this.usersService.update(id, data);
  }

  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Get(':id/analytics')
  async getUserAnalytics(@Param('id') id: string) {
    return this.usersService.getUserAnalytics(id);
  }

  @Post(':id/adapt')
  async adaptCognitiveState(@Param('id') id: string, @Body() body?: { moduleId?: string; confidenceRating?: number }) {
    return this.usersService.recalculateCognitiveState(id, body?.moduleId, body?.confidenceRating);
  }
}

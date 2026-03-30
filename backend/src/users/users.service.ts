// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true }
        }
      }
    });
  }

  async update(id: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getUserStats(userId: string) {
    const progress = await this.prisma.userProgress.findMany({
      where: { userId },
    });

    const totalCourses = await this.prisma.course.count({ where: { userId } });
    const completedModules = progress.filter(p => p.status === 'COMPLETED').length;
    
    // Average score calculation
    const scores = progress.filter(p => p.quizScore !== null).map(p => p.quizScore as number);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Get mastery breakdown (avg score per course)
    const courses = await this.prisma.course.findMany({
      where: { userId },
      include: {
        modules: {
          include: {
            userProgress: {
              where: { userId }
            }
          }
        }
      }
    });

    const mastery = courses.map(c => {
      const courseScores = c.modules
        .flatMap(m => m.userProgress)
        .filter(p => p.quizScore !== null)
        .map(p => p.quizScore as number);
      
      const courseAvg = courseScores.length > 0 
        ? courseScores.reduce((a, b) => a + b, 0) / courseScores.length 
        : 0;
      
      return {
        title: c.title,
        score: Math.round(courseAvg)
      };
    });

    return {
      totalCourses,
      completedModules,
      avgScore: Math.round(avgScore * 10) / 10,
      mastery
    };
  }

  async getUserAnalytics(userId: string) {
    // Group progress by completion date for "Learning Pulse"
    const completedProgress = await this.prisma.userProgress.findMany({
      where: { 
        userId,
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      orderBy: { completedAt: 'asc' }
    });

    // Simple grouping by date
    const dailyCompletion: Record<string, number> = {};
    completedProgress.forEach(p => {
      if (p.completedAt) {
        const date = p.completedAt.toISOString().split('T')[0];
        dailyCompletion[date] = (dailyCompletion[date] || 0) + 1;
      }
    });

    return {
      pulse: Object.entries(dailyCompletion).map(([date, count]) => ({ date, count })),
    };
  }
}

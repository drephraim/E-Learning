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
        },
        topicStates: true,
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
      include: { module: { select: { courseId: true } } }
    });

    const totalCourses = await this.prisma.course.count({ where: { userId } });
    const completedModules = progress.filter(p => p.status === 'COMPLETED').length;

    // Enrolled courses: courses where the user has a UserCourseProgress record OR has module progress
    const courseProgresses = await this.prisma.userCourseProgress.findMany({
      where: { userId }
    });
    const progressCourseIds = progress.map(p => p.module?.courseId).filter(Boolean);
    const progressIdsSet = new Set([
      ...courseProgresses.map(cp => cp.courseId),
      ...progressCourseIds
    ]);
    const enrolledCount = progressIdsSet.size;

    // Completed courses: check from UserCourseProgress
    const completedCount = await this.prisma.userCourseProgress.count({
      where: { userId, isCompleted: true }
    });

    // Time spent: sum of time spent in hours
    const totalTimeSpentSeconds = progress.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0);
    const timeSpentHours = Math.round((totalTimeSpentSeconds / 3600) * 10) / 10;

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
      enrolledCount,
      completedCount,
      timeSpentHours,
      avgScore: Math.round(avgScore * 10) / 10,
      mastery,
      topicStates: await this.prisma.topicState.findMany({ where: { userId } }),
    };
  }

  /**
   * Adaptive difficulty engine.
   *
   * Uses Exponential Moving Average (EMA) to recalculate cognitive state:
   *   EMA = (score * k) + (prevEMA * (1 - k))
   *   where k = 2 / (N + 1), N = total quizzes taken
   *
   * Per-topic state is tracked separately via TopicState table.
   * Global state falls back to the topic with the most quizzes.
   *
   * Thresholds:
   *   avg >= 80%  → ADVANCED
   *   avg >= 50%  → INTERMEDIATE
   *   avg <  50%  → BEGINNER
   */
  async recalculateCognitiveState(
    userId: string,
    moduleId?: string,
    confidenceRating?: number,
  ): Promise<{
    cognitiveState: string;
    avgScore: number;
    topicStates: any[];
    changed: boolean;
    prevState: string;
    quizCount: number;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { cognitiveState: 'BEGINNER', avgScore: 0, topicStates: [], changed: false, prevState: 'BEGINNER', quizCount: 0 };

    const prevState = user.cognitiveState || 'BEGINNER';

    // Fetch all progress with quiz scores, including module→course for topic extraction
    const progressWithModules = await this.prisma.userProgress.findMany({
      where: { userId, quizScore: { not: null } },
      include: {
        module: {
          include: {
            course: true,
            learningAids: true,
          },
        },
      },
    });

    if (progressWithModules.length === 0) {
      return { cognitiveState: 'BEGINNER', avgScore: 0, topicStates: [], changed: false, prevState, quizCount: 0 };
    }

    // Sort progress records chronologically by quiz submission date, falling back to completedAt, then earliest date
    const sortedProgress = progressWithModules.map(p => {
      const date = (p.metadata as any)?.quizSubmittedAt
        ? new Date((p.metadata as any).quizSubmittedAt)
        : p.completedAt
        ? new Date(p.completedAt)
        : new Date(0);
      return { p, date };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by topic (course title normalized)
    const topicMap: Record<string, { performances: number[]; count: number; ema: number }> = {};

    for (const { p } of sortedProgress) {
      const topic = (p.module.course.title || 'general').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Find Quiz and Task learning aids
      const quizAid = p.module.learningAids.find(a => a.type === 'QUIZ');
      const taskAid = p.module.learningAids.find(a => a.type === 'TASK');

      // Calculate Quiz score percentage
      const quizPayload = quizAid?.payload as any;
      const questionCount = quizPayload?.quizzes?.length || 5;
      const quizScorePercent = questionCount > 0 ? ((p.quizScore as number) / questionCount) * 100 : 0;

      // Calculate Task completion percentage
      const taskPayload = taskAid?.payload as any;
      const totalTasksCount = taskPayload?.tasks?.length || 0;
      let taskPercent = 0;
      if (totalTasksCount > 0) {
        const completedTasks = (p.metadata as any)?.completedTasks || {};
        const completedCount = Object.values(completedTasks).filter(v => v === true).length;
        taskPercent = (completedCount / totalTasksCount) * 100;
      }

      // Calculate Confidence score percentage (if confidence rating is provided)
      let confidencePercent = 0;
      const hasConfidence = p.confidenceRating !== null && p.confidenceRating !== undefined;
      if (hasConfidence) {
        confidencePercent = ((p.confidenceRating - 1) / 4) * 100;
      }

      // Calculate weights dynamically (Quiz: 65% base, Task: 20% base, Confidence: 15% base)
      let quizWeight = 1.0;
      let taskWeight = 0.0;
      let confidenceWeight = 0.0;

      if (totalTasksCount > 0) {
        taskWeight = 0.20;
        quizWeight -= 0.20;
      }
      if (hasConfidence) {
        confidenceWeight = 0.15;
        quizWeight -= 0.15;
      }

      const performanceScore = (quizScorePercent * quizWeight) + (taskPercent * taskWeight) + (confidencePercent * confidenceWeight);

      if (!topicMap[topic]) {
        topicMap[topic] = { performances: [], count: 0, ema: 0 };
      }
      topicMap[topic].performances.push(performanceScore);
      topicMap[topic].count++;
    }

    // Compute EMA per topic
    const TOPIC_THRESHOLDS = [
      { state: 'ADVANCED', min: 80 },
      { state: 'INTERMEDIATE', min: 50 },
    ] as const;

    const updatedTopicStates = [];
    for (const [topic, data] of Object.entries(topicMap)) {
      // EMA calculation
      const k = 2 / (data.count + 1);
      let ema = data.performances[0]; // seed with first value
      for (let i = 1; i < data.performances.length; i++) {
        ema = (data.performances[i] * k) + (ema * (1 - k));
      }

      // Determine state from EMA
      let newState = 'BEGINNER';
      for (const t of TOPIC_THRESHOLDS) {
        if (ema >= t.min) { newState = t.state; break; }
      }

      // Upsert TopicState
      const upserted = await this.prisma.topicState.upsert({
        where: { userId_topic: { userId, topic } },
        update: { cognitiveState: newState, emaScore: ema, totalQuizzes: data.count, updatedAt: new Date() },
        create: { userId, topic, cognitiveState: newState, emaScore: ema, totalQuizzes: data.count },
      });
      updatedTopicStates.push(upserted);

      // Track this EMA calculation in user's Analytics table so we can plot a visual learning curve
      await this.prisma.analytics.create({
        data: {
          userId,
          metricType: `COGNITIVE_STATE_EMA:${topic}`,
          value: ema,
        }
      });
    }

    // Global state = topic with the most quizzes, or highest EMA if tied
    const primaryTopic = updatedTopicStates.sort((a, b) =>
      b.totalQuizzes - a.totalQuizzes || b.emaScore - a.emaScore
    )[0];

    const newGlobalState = primaryTopic?.cognitiveState || 'BEGINNER';
    const avgScore = primaryTopic ? Math.round(primaryTopic.emaScore * 10) / 10 : 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: { cognitiveState: newGlobalState },
    });

    return {
      cognitiveState: newGlobalState,
      avgScore,
      topicStates: updatedTopicStates,
      changed: prevState !== newGlobalState,
      prevState,
      quizCount: progressWithModules.length,
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

    // Fetch historical EMA scores from Analytics table
    const emaHistory = await this.prisma.analytics.findMany({
      where: {
        userId,
        metricType: { startsWith: 'COGNITIVE_STATE_EMA:' }
      },
      orderBy: { recordedAt: 'asc' }
    });

    const emaProgression = emaHistory.map(h => ({
      topic: h.metricType.replace('COGNITIVE_STATE_EMA:', ''),
      score: Math.round(h.value * 10) / 10,
      date: h.recordedAt.toISOString().split('T')[0],
      timestamp: h.recordedAt.getTime(),
    }));

    return {
      pulse: Object.entries(dailyCompletion).map(([date, count]) => ({ date, count })),
      emaProgression,
    };
  }
}

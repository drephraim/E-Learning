// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

declare const process: any;

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private groq: Groq;
  private genAI: GoogleGenerativeAI;
  constructor(private prisma: PrismaService) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  private async generateCourseCover(topic: string): Promise<string> {
    try {
      this.logger.log(`Requesting "WOW" Factor AI-Curated visuals for topic: "${topic}" (via Groq + High-Res Photography)`);
      
      // Phase 1: Optimize Photographic Search Keywords via Groq
      const promptCraftingInput = `
        Summarize the course topic "${topic}" into a 2-word professional photographic search query.
        Examples: "Mars base", "Cooking closeup", "Modern laboratory".
        Provide ONLY the keywords. No quotes.
      `;

      let searchKeywords = topic;
      try {
        const promptResult = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: promptCraftingInput }],
          model: 'llama-3.3-70b-versatile',
        });
        searchKeywords = promptResult.choices[0]?.message?.content || topic;
      } catch (e) {
        this.logger.warn(`Search optimization failed, using raw topic: ${e.message}`);
      }

      // Phase 2: Fetch High-Res Professional Photo (AI-Curated Keywords)
      const encodedKeywords = encodeURIComponent(searchKeywords.replace(/\s+/g, '-'));
      const imageUrl = `https://loremflickr.com/800/450/${encodedKeywords}`;
      
      this.logger.log(`Fetching Professional Imagery for keywords: "${searchKeywords}"`);
      
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      
      return `data:image/jpeg;base64,${base64}`;
    } catch (err) {
      this.logger.error(`AI-Curated imagery retrieval failed for "${topic}": ${err.message}. Falling back to procedural SVG.`);
      const fallbackSvg = this.generateProceduralSVG(topic);
      const base64 = Buffer.from(fallbackSvg).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    }
  }

  /**
   * Fail-safe procedural SVG generator (Old reliable logic)
   */
  private generateProceduralSVG(topic: string): string {
    const hash = crypto.createHash('md5').update(topic).digest('hex');
    const hue1 = parseInt(hash.substring(0, 2), 16) % 360;
    const hue2 = (hue1 + 40 + (parseInt(hash.substring(2, 4), 16) % 40)) % 360;
    const sat = 65 + (parseInt(hash.substring(4, 6), 16) % 25);
    const light1 = 45 + (parseInt(hash.substring(6, 8), 16) % 15);
    const light2 = 35 + (parseInt(hash.substring(8, 10), 16) % 15);
    
    const shapes = [];
    for (let i = 0; i < 6; i++) {
        const idx = (i * 4 + 10) % 32;
        const cx = parseInt(hash.substring(idx, idx + 2), 16) % 800;
        const cy = parseInt(hash.substring((idx + 2) % 32, (idx + 4) % 32), 16) % 450;
        const r = 30 + (parseInt(hash.substring((idx + 3) % 32, (idx + 5) % 32), 16) % 120);
        const opacity = 0.06 + (parseInt(hash.substring((idx + 1) % 32, (idx + 3) % 32), 16) % 10) / 100;
        shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" opacity="${opacity.toFixed(2)}"/>`);
    }

    const decorations = [];
    for (let i = 0; i < 4; i++) {
        const idx = (i * 3 + 5) % 32;
        const x = 100 + parseInt(hash.substring(idx, idx + 2), 16) % 600;
        const y = 50 + parseInt(hash.substring((idx + 2) % 32, (idx + 4) % 32), 16) % 350;
        const size = 20 + parseInt(hash.substring((idx + 1) % 32, (idx + 3) % 32), 16) % 40;
        const rotation = parseInt(hash.substring((idx + 4) % 32, (idx + 6) % 32), 16) % 360;
        const opacity = 0.1 + (parseInt(hash.substring((idx + 5) % 32, (idx + 7) % 32), 16) % 15) / 100;
        
        if (i % 3 === 0) {
            decorations.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="white" opacity="${opacity.toFixed(2)}" transform="rotate(${rotation}, ${x + size/2}, ${y + size/2})"/>`);
        } else if (i % 3 === 1) {
            decorations.push(`<polygon points="${x},${y - size/2} ${x + size/2},${y + size/2} ${x - size/2},${y + size/2}" fill="white" opacity="${opacity.toFixed(2)}"/>`);
        } else {
            decorations.push(`<circle cx="${x}" cy="${y}" r="${size/2}" fill="none" stroke="white" stroke-width="2" opacity="${opacity.toFixed(2)}"/>`);
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue1}, ${sat}%, ${light1}%)"/>
          <stop offset="50%" stop-color="hsl(${hue2}, ${sat}%, ${light2}%)"/>
          <stop offset="100%" stop-color="hsl(${hue1}, ${sat - 10}%, ${light2 - 10}%)"/>
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="30%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bg)"/>
      <rect width="800" height="450" fill="url(#glow)"/>
      ${shapes.join('\n      ')}
      ${decorations.join('\n      ')}
    </svg>`;
  }

  async generateCourse(dto: { userId: string, topic: string, difficulty: string, chapters: number, includeYoutube: boolean }) {
    this.logger.log(`Starting AI course generation for topic: "${dto.topic}"`);
    this.logger.log(`Generation settings: difficulty=${dto.difficulty}, chapters=${dto.chapters}, youtube=${dto.includeYoutube}`);
    
    try {
      // 0. Generate Course Cover
      const coverImage = await this.generateCourseCover(dto.topic);

      // 1. Generate Syllabus Outline
      const outlinePrompt = `Act as an expert curriculum designer. The user wants to learn "${dto.topic}" at a "${dto.difficulty}" level. 
    Create a syllabus with exactly ${dto.chapters} chapters. 
    Return strictly JSON in this format: 
    { "courseTitle": "String", "chapters": [{ "title": "String", "searchQuery": "Detailed search query for web facts", "youtubeSearchQuery": "Highly specific query to find a matching educational video for this SPECIFIC chapter title" }] }`;
    
      const outlineCompletion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: outlinePrompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      const outlineText = outlineCompletion.choices[0]?.message?.content || '{}';
      const outlineData = JSON.parse(outlineText);
      
      // 2. Multi-phase generation for each chapter
      const modulesData = [];
      let orderIndex = 0;
      
      for (const chapter of outlineData.chapters) {
        this.logger.log(`Processing chapter: ${chapter.title}`);
        
        // A. Tavily Search & Scrape
        let scrapedContext = "";
        try {
          const tavilyResp = await axios.post('https://api.tavily.com/search', {
            api_key: process.env.TAVILY_API_KEY,
            query: `${dto.topic} ${chapter.searchQuery}`,
            search_depth: "basic",
            include_answer: true,
            include_raw_content: true,
            max_results: 3
          });
          scrapedContext = tavilyResp.data.results.map((r: any) => r.raw_content || r.content).join("\n\n") || tavilyResp.data.answer || "";
        } catch (err: any) {
          this.logger.error("Tavily search failed", err.response?.data || err.message);
        }
        
        // B. Detailed Groq Synthesis
        const detailPrompt = `You are a world-class instructor writing a course chapter. Topic: ${dto.topic}. Chapter Title: ${chapter.title}. Target Audience: ${dto.difficulty}.
        Use the following scraped web content to enrich your explanation with facts and deep details:\n\n${scrapedContext.substring(0, 15000)}\n\n
        Write a highly detailed, engaging, and comprehensive explanation for this chapter in Markdown format. Use clear headings, bullet points, and code snippets or examples if applicable. Ensure code snippets are correctly formatted with language identifiers (e.g. \`\`\`javascript).`;
        
        const detailCompletion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: detailPrompt }],
          model: 'llama-3.1-8b-instant',
        });
        const content = detailCompletion.choices[0]?.message?.content || '';
        
        // C. YouTube Integration
        let youtubeUrl = null;
        if (dto.includeYoutube && process.env.YOUTUBE_API_KEY) {
          try {
            const ytResp = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
              params: {
                key: process.env.YOUTUBE_API_KEY,
                q: chapter.youtubeSearchQuery || `${dto.topic} ${chapter.title} tutorial`,
                part: "snippet",
                type: "video",
                maxResults: 1
              }
            });
            if (ytResp.data.items && ytResp.data.items.length > 0) {
              youtubeUrl = `https://www.youtube.com/embed/${ytResp.data.items[0].id.videoId}`;
            }
          } catch (err: any) {
            this.logger.error("YouTube search failed", err.response?.data || err.message);
          }
        }
        
        // D. Learning Aids Generation (Quizzes, Flashcards, Summary, Tasks)
        let learningAidsData = [];
        try {
          const learningAidsPrompt = `Based ONLY on the following chapter content, generate exactly:
- 5 multiple choice quiz questions
- 10 flashcards
- 1 brief executive summary
- 10 practical tasks (each must have a clear "answer" or "solution steps" field)

Content:
${content.substring(0, 10000)}

Output STRICTLY valid JSON exactly matching this format:
{
  "quizzes": [
    { "question": "Question text?", "options": ["A", "B", "C", "D"], "answerIndex": 0 }
  ],
  "flashcards": [
    { "front": "Concept name", "back": "Concept definition" }
  ],
  "summary": "Brief 2-3 sentence summary of the core concepts.",
  "tasks": [
    { "title": "Task Name", "description": "What to do", "answer": "Model answer or solution" }
  ]
}`;
          const aidsCompletion = await this.groq.chat.completions.create({
            messages: [{ role: 'user', content: learningAidsPrompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
          });
          const aidsText = aidsCompletion.choices[0]?.message?.content || '{}';
          const aidsJson = JSON.parse(aidsText);
          
          if (aidsJson.quizzes && Array.isArray(aidsJson.quizzes)) {
            learningAidsData.push({ type: 'QUIZ', payload: { quizzes: aidsJson.quizzes } });
          }
          if (aidsJson.flashcards && Array.isArray(aidsJson.flashcards)) {
            learningAidsData.push({ type: 'FLASHCARD', payload: { flashcards: aidsJson.flashcards } });
          }
          if (aidsJson.summary && typeof aidsJson.summary === 'string') {
            learningAidsData.push({ type: 'SUMMARY', payload: { summary: aidsJson.summary } });
          }
          if (aidsJson.tasks && Array.isArray(aidsJson.tasks)) {
            learningAidsData.push({ type: 'TASK', payload: { tasks: aidsJson.tasks } });
          }
        } catch (err: any) {
          this.logger.error("Learning Aids generation failed", err.message);
        }

        modulesData.push({
          title: chapter.title,
          content: content,
          youtubeUrl: youtubeUrl,
          orderIndex: orderIndex,
          difficultyWeight: dto.difficulty.toUpperCase() === 'BEGINNER' ? 1 : dto.difficulty.toUpperCase() === 'INTERMEDIATE' ? 2 : 3,
          learningAids: { create: learningAidsData }
        });
        orderIndex++;
      }
      
      // 3. Save to DB
      let normalizedDifficulty = dto.difficulty.toUpperCase();
      if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normalizedDifficulty)) {
         normalizedDifficulty = 'BEGINNER';
      }

      const course = await this.prisma.course.create({
        data: {
          userId: dto.userId,
          title: outlineData.courseTitle,
          targetDifficulty: normalizedDifficulty,
          coverImage: coverImage,
          modules: {
            create: modulesData
          }
        },
        include: {
          modules: true
        }
      });
      
      return { success: true, courseId: course.id, course };
    } catch (error: any) {
      this.logger.error("Failed to generate course", error.stack);
      if (error.message?.includes('429')) {
        return { success: false, message: "AI rate limit strictly exhausted! Please check your Groq console." };
      }
      return { success: false, message: "Generating the course failed due to an unexpected server issue." };
    }
  }

  async getCourse(id: string, userId?: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: { 
            learningAids: true,
            userProgress: userId ? { where: { userId } } : undefined
          }
        }
      }
    });
  }

  async updateProgress(dto: { userId: string, moduleId: string, status?: any, quizScore?: number, metadata?: any }) {
    const { userId, moduleId, status, quizScore, metadata } = dto;
    
    // Ensure metadata is a valid object if provided, otherwise default to {} for Prisma Json field
    const prismaMetadata = metadata || {};

    return this.prisma.userProgress.upsert({
      where: {
        userId_moduleId: { userId, moduleId }
      },
      update: {
        status: status,
        quizScore: quizScore,
        metadata: prismaMetadata,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      },
      create: {
        userId,
        moduleId,
        status: status || 'IN_PROGRESS',
        quizScore: quizScore,
        metadata: prismaMetadata
      }
    });
  }

  async getUserCourses(userId: string) {
    return this.prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          include: {
            userProgress: {
              where: { userId }
            }
          }
        },
        _count: {
          select: { modules: true }
        }
      }
    });
  }
  async getAllCourses() {
    return await this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { modules: true }
        }
      }
    });
  }

  async deleteCourse(id: string, userId: string) {
    this.logger.log(`Deleting course: ${id} for user: ${userId}`);
    
    // 1. Verify ownership and existence
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { modules: { select: { id: true } } }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.userId !== userId) {
      throw new Error('Unauthorized to delete this course');
    }

    const moduleIds = course.modules.map(m => m.id);

    // 2. Manual cleanup of related records (Fallback for cascade)
    // Delete LearningAids
    await this.prisma.learningAid.deleteMany({
      where: { moduleId: { in: moduleIds } }
    });

    // Delete UserProgress
    await this.prisma.userProgress.deleteMany({
      where: { moduleId: { in: moduleIds } }
    });

    // Delete Modules
    await this.prisma.module.deleteMany({
      where: { courseId: id }
    });

    // 3. Delete Course
    return await this.prisma.course.delete({
      where: { id }
    });
  }
}

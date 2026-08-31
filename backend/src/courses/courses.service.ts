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

  private cleanJsonString(str: string): string {
    if (!str) return '{}';
    let cleaned = str.trim();

    // 1. Strip markdown fences if present
    cleaned = cleaned.replace(/```(?:json|xml)?\n?/gi, '').replace(/```$/gi, '').trim();

    // 2. Extract strictly between the first '{' or '[' and the last '}' or ']'
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    let firstIndex = -1;
    let isArray = false;

    if (firstBrace !== -1 && firstBracket !== -1) {
      if (firstBrace < firstBracket) {
        firstIndex = firstBrace;
      } else {
        firstIndex = firstBracket;
        isArray = true;
      }
    } else if (firstBrace !== -1) {
      firstIndex = firstBrace;
    } else if (firstBracket !== -1) {
      firstIndex = firstBracket;
      isArray = true;
    }

    if (firstIndex !== -1) {
      const lastIndex = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
      if (lastIndex > firstIndex) {
        cleaned = cleaned.substring(firstIndex, lastIndex + 1);
      }
    }

    // 3. Remove non-printable control characters that break JSON.parse
    cleaned = cleaned.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ' ');

    return cleaned.trim();
  }

  private async callGroqWithRetry(params: any, retries = 4, delayMs = 3000): Promise<any> {
    let currentParams = { ...params };
    for (let i = 0; i < retries; i++) {
      try {
        return await this.groq.chat.completions.create(currentParams);
      } catch (err: any) {
        const isJsonError =
          err.status === 400 ||
          err.code === 'json_validate_failed' ||
          (err.message && (err.message.includes('json_validate_failed') || err.message.includes('Failed to validate JSON')));

        if (isJsonError && currentParams.response_format) {
          this.logger.warn(`Groq server-side JSON validation failed. Stripping response_format and retrying... (Attempt ${i + 1}/${retries})`);
          delete currentParams.response_format;
          continue;
        }

        if ((err.status === 429 || err.message?.includes('429') || err.message?.includes('Rate limit')) && i < retries - 1) {
          this.logger.warn(`Groq API rate limit encountered. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // exponential backoff
          continue;
        }
        throw err;
      }
    }
  }

  private async generateGeminiSVG(topic: string): Promise<string> {
    try {
      this.logger.log(`Querying Gemini to generate custom SVG cover for: "${topic}"`);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `You are a professional graphic designer. Create a premium, modern, topic-aware vector SVG cover for a course on "${topic}".
The SVG must have a viewBox="0 0 800 450" and width="800" height="450". It should use a dark theme matching a modern tech website (e.g. dark background gradients: #0c0e12, #161922, etc.).
It must include:
1. A beautiful, harmonized background gradient.
2. Subtle background patterns (like tech grid lines, dots, or abstract overlapping circles with low opacity).
3. A stylized glassmorphic card on the left side (with a semi-transparent dark fill and a glowing border) that displays the course title "${topic}" in white bold typography (use system-ui, Inter, sans-serif font).
4. A beautiful, colored, detailed vector logo or abstract tech illustration representing "${topic}" on the right side. For example, if it's CSS, render a stylized shield. If it's React, render orbits. Use vibrant gradient fills and glowing strokes.

Return ONLY valid, well-formed SVG code starting with <svg> and ending with </svg>. Do not wrap it in markdown code blocks or write any explanations. Just start with <svg> and end with </svg>.`;

      const result = await model.generateContent(prompt);
      let svgText = result.response.text().trim();
      
      // Clean up markdown wrapper if any
      if (svgText.startsWith('```')) {
        svgText = svgText.replace(/^```(xml|svg)?\n/, '').replace(/\n```$/, '').trim();
      }
      
      if (svgText.includes('<svg') && svgText.includes('</svg>')) {
        return svgText;
      }
      throw new Error("Invalid SVG response from Gemini");
    } catch (err: any) {
      this.logger.warn(`Failed to generate SVG using Gemini: ${err.message}.`);
      return null;
    }
  }

  private async generateCourseCover(topic: string, coverTheme?: any): Promise<string> {
    try {
      this.logger.log(`Generating fast vector cover for: "${topic}"`);
      const geminiPromise = this.generateGeminiSVG(topic);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 600));
      let svg = await Promise.race([geminiPromise, timeoutPromise]);
      if (!svg) {
        svg = this.generateProceduralSVG(topic, coverTheme);
      }
      const base64 = Buffer.from(svg).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    } catch (err: any) {
      const fallbackSvg = this.generateProceduralSVG(topic, coverTheme);
      const base64 = Buffer.from(fallbackSvg).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    }
  }

  /**
   * Generates a topic-aware premium vector SVG cover with modern typography,
   * glassmorphism components, and matching tech icons.
   */
  private generateProceduralSVG(topic: string, customTheme?: any): string {
    const t = topic.toLowerCase();
    
    const hash = crypto.createHash('md5').update(topic).digest('hex');
    const h = parseInt(hash.substring(0, 2), 16) % 360;
    const s = 45 + (parseInt(hash.substring(2, 4), 16) % 15); // 45-60%
    const l1 = 11 + (parseInt(hash.substring(4, 6), 16) % 5);  // 11-15%
    const l2 = 5 + (parseInt(hash.substring(6, 8), 16) % 4);   // 5-8%
    
    const h2 = (h + 40 + (parseInt(hash.substring(8, 10), 16) % 50)) % 360;
    const accent1 = `hsl(${h}, 85%, 60%)`;
    const accent2 = `hsl(${h2}, 85%, 60%)`;

    // Default fallback gradients/colors (Creative/Other)
    let theme = {
      gradStart: customTheme?.gradStart || `hsl(${h}, ${s}%, ${l1}%)`,
      gradEnd: customTheme?.gradEnd || `hsl(${h}, ${s}%, ${l2}%)`,
      accent: customTheme?.accent || accent1,
      accent2: customTheme?.accent2 || accent2,
      tag: customTheme?.tag || 'ADAPTIVELEARN COURSE',
      icon: ''
    };

    let selectedTag = theme.tag;
    let selectedIcon = '';
    let matched = false;

    // Predefined high-quality logos
    if (t.includes('html') || t.includes('markup') || t.includes('web design')) {
      selectedTag = 'HTML & MARKUP';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <polygon points="35 15, 105 15, 98 85, 70 98, 42 85" fill="#E44D26" />
          <polygon points="70 15, 105 15, 98 85, 70 98" fill="#F16529" />
          <path d="M 88 32 L 54 32 L 55 52 L 85 52 L 83 75 L 70 81 L 57 75 L 56 65" stroke="white" stroke-width="8" stroke-linecap="square" fill="none" />
        </g>
      `;
      matched = true;
    } else if (t.includes('css') || t.includes('style') || t.includes('tailwind') || t.includes('sass') || t.includes('less') || t.includes('bootstrap') || t.includes('flexbox') || t.includes('grid')) {
      selectedTag = 'CSS & DESIGN';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <polygon points="35 15, 105 15, 98 85, 70 98, 42 85" fill="#2196F3" />
          <polygon points="70 15, 105 15, 98 85, 70 98" fill="#29B6F6" />
          <path d="M 54 32 L 88 32 L 86 52 L 60 52 M 86 52 L 83 75 L 70 81 L 57 75" stroke="white" stroke-width="8" stroke-linecap="square" fill="none" />
        </g>
      `;
      matched = true;
    } else if (t.includes('react') || t.includes('next') || t.includes('vue') || t.includes('angular') || t.includes('svelte') || t.includes('jsx')) {
      selectedTag = 'REACT FRAMEWORK';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <ellipse cx="75" cy="60" rx="60" ry="20" transform="rotate(30, 75, 60)" stroke="#00D8FF" stroke-width="5" fill="none" />
          <ellipse cx="75" cy="60" rx="60" ry="20" transform="rotate(90, 75, 60)" stroke="#00D8FF" stroke-width="5" fill="none" />
          <ellipse cx="75" cy="60" rx="60" ry="20" transform="rotate(150, 75, 60)" stroke="#00D8FF" stroke-width="5" fill="none" />
          <circle cx="75" cy="60" r="10" fill="#00D8FF" />
        </g>
      `;
      matched = true;
    } else if (t.includes('typescript') || t.includes('ts')) {
      selectedTag = 'TYPESCRIPT';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <rect x="25" y="15" width="90" height="90" rx="6" fill="#3178C6" />
          <text x="105" y="95" text-anchor="end" fill="#FFFFFF" font-size="36" font-family="'Inter', 'Outfit', sans-serif" font-weight="900">TS</text>
        </g>
      `;
      matched = true;
    } else if (t.includes('javascript') || t.includes('js') || t.includes('npm') || t.includes('express')) {
      selectedTag = 'JAVASCRIPT';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <rect x="25" y="15" width="90" height="90" rx="6" fill="#F7DF1E" />
          <text x="105" y="95" text-anchor="end" fill="#000000" font-size="36" font-family="'Inter', 'Outfit', sans-serif" font-weight="900">JS</text>
        </g>
      `;
      matched = true;
    } else if (t.includes('node')) {
      selectedTag = 'NODE.JS';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <polygon points="70 15, 110 38, 110 82, 70 105, 30 82, 30 38" fill="none" stroke="#68A063" stroke-width="6" stroke-linejoin="round" />
          <path d="M 70 30 C 50 50, 70 90, 70 90 C 70 90, 90 50, 70 30 Z" fill="#68A063" opacity="0.3" />
          <path d="M 70 30 C 50 50, 70 90, 70 90" stroke="#68A063" stroke-width="4" fill="none" />
        </g>
      `;
      matched = true;
    } else if (t.includes('python') || t.includes('django') || t.includes('flask') || t.includes('numpy') || t.includes('pandas') || t.includes('py')) {
      selectedTag = 'PYTHON';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 75 15 L 115 15 C 130 15, 130 45, 115 45 L 75 45 C 60 45, 60 75, 75 75 L 115 75" stroke="#3776AB" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <circle cx="105" cy="30" r="4" fill="#3776AB" />
          <path d="M 75 45 L 35 45 C 20 45, 20 75, 35 75 L 75 75 C 90 75, 90 105, 75 105 L 35 105" stroke="#FFD343" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <circle cx="45" cy="90" r="4" fill="#FFD343" />
        </g>
      `;
      matched = true;
    } else if (t.includes('java') && !t.includes('javascript')) {
      selectedTag = 'JAVA';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 40 45 L 45 80 C 45 92, 95 92, 95 80 L 100 45 Z" fill="none" stroke="url(#accentGrad)" stroke-width="6" stroke-linejoin="round" />
          <path d="M 100 52 C 115 52, 115 72, 100 72" fill="none" stroke="url(#accentGrad)" stroke-width="5" />
          <path d="M 30 92 C 30 98, 110 98, 110 92 Z" fill="none" stroke="url(#accentGrad)" stroke-width="6" />
          <path d="M 52 35 C 50 25, 60 25, 58 15" fill="none" stroke="#FF5E62" stroke-width="4" stroke-linecap="round" />
          <path d="M 70 35 C 68 25, 78 25, 76 15" fill="none" stroke="#FF9966" stroke-width="4" stroke-linecap="round" />
          <path d="M 88 35 C 86 25, 96 25, 94 15" fill="none" stroke="#FF5E62" stroke-width="4" stroke-linecap="round" />
        </g>
      `;
      matched = true;
    } else if (t.includes('docker')) {
      selectedTag = 'DOCKER';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 20 75 C 20 60, 40 45, 90 45 C 105 45, 115 50, 120 60 C 120 75, 105 80, 90 80 L 30 80 C 22 80, 20 77, 20 75 Z" fill="none" stroke="#0db7ed" stroke-width="6" />
          <path d="M 20 72 C 10 70, 5 60, 10 52 C 12 55, 16 68, 20 72 Z" fill="none" stroke="#0db7ed" stroke-width="5" />
          <rect x="50" y="30" width="18" height="12" rx="2" fill="none" stroke="#0db7ed" stroke-width="4" />
          <rect x="72" y="30" width="18" height="12" rx="2" fill="none" stroke="#0db7ed" stroke-width="4" />
          <rect x="61" y="15" width="18" height="12" rx="2" fill="none" stroke="#0db7ed" stroke-width="4" />
        </g>
      `;
      matched = true;
    } else if (t.includes('git') || t.includes('github')) {
      selectedTag = 'GIT CONTROL';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <line x1="40" y1="90" x2="40" y2="25" stroke="#F05032" stroke-width="6" stroke-linecap="round" />
          <path d="M 40 70 C 65 70, 90 60, 90 40" fill="none" stroke="#F05032" stroke-width="6" stroke-linecap="round" />
          <circle cx="40" cy="80" r="10" fill="#161922" stroke="#F05032" stroke-width="5" />
          <circle cx="40" cy="35" r="10" fill="#161922" stroke="#F05032" stroke-width="5" />
          <circle cx="90" cy="35" r="10" fill="#161922" stroke="#F05032" stroke-width="5" />
        </g>
      `;
      matched = true;
    } else if (t.includes('c++') || t.includes('cpp')) {
      selectedTag = 'C++ LANGUAGE';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <polygon points="70 15, 110 38, 110 82, 70 105, 30 82, 30 38" fill="none" stroke="#00599C" stroke-width="6" stroke-linejoin="round" />
          <text x="65" y="70" text-anchor="middle" fill="white" font-size="28" font-family="'Inter', sans-serif" font-weight="900">C</text>
          <path d="M 80 50 L 90 50 M 85 45 L 85 55 M 95 50 L 105 50 M 100 45 L 100 55" stroke="#00599C" stroke-width="4" stroke-linecap="round" />
        </g>
      `;
      matched = true;
    } else if (t.includes('c#') || t.includes('csharp')) {
      selectedTag = 'C# LANGUAGE';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <polygon points="70 15, 110 38, 110 82, 70 105, 30 82, 30 38" fill="none" stroke="#178600" stroke-width="6" stroke-linejoin="round" />
          <text x="60" y="70" text-anchor="middle" fill="white" font-size="28" font-family="'Inter', sans-serif" font-weight="900">C</text>
          <text x="85" y="70" text-anchor="middle" fill="#178600" font-size="26" font-family="'Inter', sans-serif" font-weight="900">#</text>
        </g>
      `;
      matched = true;
    } else if (t.includes('go') && (t.includes('golang') || t.includes('programming') || t.includes('language') || t.includes('code'))) {
      selectedTag = 'GO LANG';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <circle cx="70" cy="60" r="45" fill="none" stroke="#00ADD8" stroke-width="6" />
          <text x="70" y="72" text-anchor="middle" fill="white" font-size="34" font-family="'Inter', sans-serif" font-weight="900">Go</text>
        </g>
      `;
      matched = true;
    } else if (t.includes('rust')) {
      selectedTag = 'RUST';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <circle cx="70" cy="60" r="38" fill="none" stroke="#dea584" stroke-width="6" />
          <circle cx="108" cy="60" r="5" fill="#dea584" />
          <circle cx="102.9" cy="79" r="5" fill="#dea584" />
          <circle cx="89" cy="92.9" r="5" fill="#dea584" />
          <circle cx="70" cy="98" r="5" fill="#dea584" />
          <circle cx="51" cy="92.9" r="5" fill="#dea584" />
          <circle cx="37.1" cy="79" r="5" fill="#dea584" />
          <circle cx="32" cy="60" r="5" fill="#dea584" />
          <circle cx="37.1" cy="41" r="5" fill="#dea584" />
          <circle cx="51" cy="27.1" r="5" fill="#dea584" />
          <circle cx="70" cy="22" r="5" fill="#dea584" />
          <circle cx="89" cy="27.1" r="5" fill="#dea584" />
          <circle cx="102.9" cy="41" r="5" fill="#dea584" />
          <text x="70" y="72" text-anchor="middle" fill="white" font-size="30" font-family="'Inter', sans-serif" font-weight="900">R</text>
        </g>
      `;
      matched = true;
    } else if (t.includes('sql') || t.includes('database') || t.includes('postgres') || t.includes('mysql') || t.includes('mongodb') || t.includes('sqlite') || t.includes('db') || t.includes('prisma') || t.includes('nosql') || t.includes('redis')) {
      selectedTag = 'DATABASE SYSTEMS';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 30 75 L 30 90 C 30 100, 110 100, 110 90 L 110 75" fill="rgba(255,255,255,0.05)" stroke="url(#accentGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <ellipse cx="70" cy="75" rx="40" ry="12" fill="rgba(255,255,255,0.05)" stroke="url(#accentGrad)" stroke-width="5" />
          <path d="M 30 50 L 30 65 C 30 75, 110 75, 110 65 L 110 50" fill="rgba(255,255,255,0.05)" stroke="url(#accentGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <ellipse cx="70" cy="50" rx="40" ry="12" fill="rgba(255,255,255,0.05)" stroke="url(#accentGrad)" stroke-width="5" />
          <path d="M 30 25 L 30 40 C 30 50, 110 50, 110 40 L 110 25" fill="rgba(255,255,255,0.05)" stroke="url(#accentGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <ellipse cx="70" cy="25" rx="40" ry="12" fill="rgba(255,255,255,0.05)" stroke="url(#accentGrad)" stroke-width="5" />
        </g>
      `;
      matched = true;
    } else if (t.includes('aws') || t.includes('cloud') || t.includes('azure') || t.includes('gcp')) {
      selectedTag = 'CLOUD SYSTEMS';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 35 75 A 20 20 0 0 1 45 37 A 25 25 0 0 1 90 32 A 20 20 0 0 1 105 75 Z" fill="none" stroke="url(#accentGrad)" stroke-width="6" stroke-linejoin="round" />
          <line x1="35" y1="75" x2="105" y2="75" stroke="url(#accentGrad)" stroke-width="6" />
        </g>
      `;
      matched = true;
    } else if (t.includes('ai') || t.includes('intelligence') || t.includes('machine learning') || t.includes('ml') || t.includes('deep learning') || t.includes('neural') || t.includes('gemini') || t.includes('gpt') || t.includes('openai') || t.includes('llm') || t.includes('nlp')) {
      selectedTag = 'INTELLIGENCE ENGINE';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <line x1="20" y1="60" x2="65" y2="25" stroke="url(#accentGrad)" stroke-width="4" />
          <line x1="20" y1="60" x2="65" y2="60" stroke="url(#accentGrad)" stroke-width="4" />
          <line x1="20" y1="60" x2="65" y2="95" stroke="url(#accentGrad)" stroke-width="4" />
          <line x1="65" y1="25" x2="120" y2="40" stroke="url(#accentGrad)" stroke-width="4" />
          <line x1="65" y1="60" x2="120" y2="40" stroke="url(#accentGrad)" stroke-width="4" />
          <line x1="65" y1="60" x2="120" y2="80" stroke="url(#accentGrad)" stroke-width="4" />
          <line x1="65" y1="95" x2="120" y2="80" stroke="url(#accentGrad)" stroke-width="4" />
          <circle cx="20" cy="60" r="8" fill="#1b1625" stroke="url(#accentGrad)" stroke-width="4" />
          <circle cx="65" cy="25" r="8" fill="#1b1625" stroke="url(#accentGrad)" stroke-width="4" />
          <circle cx="65" cy="60" r="8" fill="#1b1625" stroke="url(#accentGrad)" stroke-width="4" />
          <circle cx="65" cy="95" r="8" fill="#1b1625" stroke="url(#accentGrad)" stroke-width="4" />
          <circle cx="120" cy="40" r="8" fill="#1b1625" stroke="url(#accentGrad)" stroke-width="4" />
          <circle cx="120" cy="80" r="8" fill="#1b1625" stroke="url(#accentGrad)" stroke-width="4" />
        </g>
      `;
      matched = true;
    } else if (t.includes('science') || t.includes('math') || t.includes('calculus') || t.includes('algebra') || t.includes('physics') || t.includes('biology') || t.includes('chemistry') || t.includes('lab')) {
      selectedTag = 'SCIENCE & MATH';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 45 30 L 60 65 L 60 100 L 90 100 L 90 65 L 105 30 Z" fill="none" stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="53" y1="48" x2="97" y2="48" stroke-width="4" stroke="url(#accentGrad)" opacity="0.5" />
          <path d="M 50 85 L 100 85" stroke-dasharray="2 2" stroke="url(#accentGrad)" stroke-width="5" />
          <circle cx="68" cy="75" r="4" fill="url(#accentGrad)" stroke="none" />
          <circle cx="82" cy="80" r="3" fill="url(#accentGrad)" stroke="none" />
        </g>
      `;
      matched = true;
    } else if (t.includes('business') || t.includes('finance') || t.includes('marketing') || t.includes('economics') || t.includes('money') || t.includes('startup') || t.includes('sales')) {
      selectedTag = 'BUSINESS & FINANCE';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <path d="M 25 95 L 125 95 M 25 95 L 25 25" stroke="url(#accentGrad)" stroke-width="4" opacity="0.5" />
          <rect x="35" y="65" width="18" height="30" rx="3" stroke="url(#accentGrad)" stroke-width="5" fill="none" />
          <rect x="65" y="45" width="18" height="50" rx="3" stroke="url(#accentGrad)" stroke-width="5" fill="none" />
          <rect x="95" y="30" width="18" height="65" rx="3" stroke="url(#accentGrad)" stroke-width="5" fill="none" />
          <path d="M 30 55 L 60 35 L 90 20 L 120 15" stroke="url(#accentGrad)" stroke-width="6" fill="none" />
          <path d="M 105 15 L 120 15 L 120 30" stroke="url(#accentGrad)" stroke-width="6" fill="none" />
        </g>
      `;
      matched = true;
    } else if (t.includes('code') || t.includes('coding') || t.includes('program') || t.includes('software') || t.includes('developer') || t.includes('computer') || t.includes('algorithm') || t.includes('cyber')) {
      selectedTag = 'COMPUTER SCIENCE';
      selectedIcon = `
        <g transform="translate(520, 140) scale(1.7)">
          <rect x="15" y="20" width="110" height="80" rx="8" stroke="white" stroke-width="4" opacity="0.3" fill="none" />
          <path d="M 35 50 L 50 60 L 35 70" stroke="url(#accentGrad)" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="60" y1="70" x2="85" y2="70" stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" />
          <text x="95" y="45" fill="url(#accentGrad)" font-size="16" font-family="monospace" font-weight="bold" stroke="none">1</text>
          <text x="105" y="75" fill="url(#accentGrad)" font-size="16" font-family="monospace" font-weight="bold" stroke="none" opacity="0.6">0</text>
        </g>
      `;
      matched = true;
    }

    // Fallback if not matched by keyword
    if (!matched) {
      const isIconValid = customTheme?.icon && 
        (customTheme.icon.includes('<path') || 
         customTheme.icon.includes('<rect') || 
         customTheme.icon.includes('<circle') || 
         customTheme.icon.includes('<polygon') ||
         customTheme.icon.includes('<line') ||
         customTheme.icon.includes('<ellipse') ||
         customTheme.icon.includes('<text'));

      if (isIconValid) {
        selectedIcon = customTheme.icon.trim().startsWith('<g') || customTheme.icon.trim().startsWith('<svg')
          ? customTheme.icon
          : `<g stroke="url(#accentGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">${customTheme.icon}</g>`;
      } else {
        // Monogram Fallback
        const clean = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        let monogram = '?';
        if (words.length > 0) {
          const stopWords = ['to', 'the', 'a', 'an', 'of', 'and', 'in', 'on', 'with', 'for'];
          const filtered = words.filter(w => !stopWords.includes(w.toLowerCase()));
          const activeWords = filtered.length > 0 ? filtered : words;
          if (activeWords.length === 1) {
            monogram = activeWords[0].substring(0, 2).toUpperCase();
          } else {
            monogram = (activeWords[0][0] + activeWords[1][0]).toUpperCase();
          }
        }
        selectedIcon = `
          <g transform="translate(520, 140) scale(1.7)">
            <circle cx="70" cy="60" r="45" fill="rgba(255, 255, 255, 0.03)" stroke="url(#accentGrad)" stroke-width="4" />
            <circle cx="70" cy="60" r="37" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5" />
            <text x="70" y="70" text-anchor="middle" fill="white" font-size="28" font-family="'Outfit', 'Inter', sans-serif" font-weight="900" letter-spacing="-0.5">${monogram}</text>
          </g>
        `;
      }
    }

    theme.tag = selectedTag;
    theme.icon = selectedIcon;

    // Wrap title text into lines
    const wrapTitleText = (text: string): string[] => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        if ((currentLine + " " + word).trim().length <= 16) {
          currentLine = (currentLine + " " + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines.slice(0, 3);
    };

    const escapeXml = (unsafe: string) => {
      return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    const titleLines = wrapTitleText(topic).map(escapeXml);
    let titleSVG = '';
    
    if (titleLines.length === 1) {
      titleSVG = `<text x="70" y="200" fill="white" font-size="38" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="800">${titleLines[0]}</text>`;
    } else if (titleLines.length === 2) {
      titleSVG = `
        <text x="70" y="180" fill="white" font-size="34" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="800">${titleLines[0]}</text>
        <text x="70" y="225" fill="white" font-size="34" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="800">${titleLines[1]}</text>
      `;
    } else {
      titleSVG = `
        <text x="70" y="160" fill="white" font-size="30" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="800">${titleLines[0]}</text>
        <text x="70" y="205" fill="white" font-size="30" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="800">${titleLines[1]}</text>
        <text x="70" y="250" fill="white" font-size="30" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="800">${titleLines[2]}</text>
      `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.gradStart}" />
          <stop offset="100%" stop-color="${theme.gradEnd}" />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${theme.accent}" />
          <stop offset="100%" stop-color="${theme.accent2}" />
        </linearGradient>

        <radialGradient id="glow" cx="80%" cy="50%" r="60%">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.25" />
          <stop offset="100%" stop-color="${theme.gradEnd}" stop-opacity="0" />
        </radialGradient>

        <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.5" fill="white" opacity="0.08" />
        </pattern>
      </defs>

      <rect width="800" height="450" fill="url(#bgGrad)" />
      <rect width="800" height="450" fill="url(#glow)" />
      <rect width="800" height="450" fill="url(#dots)" />

      <circle cx="750" cy="50" r="120" fill="none" stroke="white" stroke-width="1" opacity="0.03" />
      <circle cx="750" cy="50" r="80" fill="none" stroke="white" stroke-dasharray="4 4" stroke-width="1" opacity="0.04" />
      <circle cx="50" cy="400" r="150" fill="none" stroke="white" stroke-width="1.5" opacity="0.03" />

      <!-- GLASSMORPHIC CARD -->
      <rect x="40" y="40" width="430" height="370" rx="20" fill="rgba(10, 10, 15, 0.45)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5" />
      <rect x="40" y="40" width="430" height="370" rx="20" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" opacity="0.15" />

      <!-- CARD CONTENT -->
      <g transform="translate(70, 75)">
        <rect x="0" y="0" width="${theme.tag.length * 7 + 24}" height="24" rx="12" fill="rgba(255, 255, 255, 0.05)" stroke="url(#accentGrad)" stroke-width="1" opacity="0.9" />
        <circle cx="12" cy="12" r="3.5" fill="url(#accentGrad)" />
        <text x="24" y="16" fill="white" font-size="10" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="700" letter-spacing="1.5">${theme.tag}</text>
      </g>

      ${titleSVG}

      <g transform="translate(70, 335)">
        <rect x="0" y="0" width="190" height="30" rx="8" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
        <path d="M 18 10 L 21 15 L 18 20 L 15 15 Z" fill="url(#accentGrad)" />
        <text x="32" y="19" fill="#cccccc" font-size="11" font-family="'Outfit', 'Inter', 'Segoe UI', system-ui, sans-serif" font-weight="600" letter-spacing="1">ADAPTIVELEARN PLATFORM</text>
      </g>

      ${theme.icon}
    </svg>`;
  }

  async getInstitutionalCourses(userId?: string, search?: string) {
    let studentUser = null;
    if (userId) {
      studentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { studentProfile: true },
      });
    }

    // 1. Fetch Published Academic Courses
    const academicCourses = await this.prisma.academicCourse.findMany({
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
            institution: true,
            lecturerProfile: { select: { title: true, department: true } },
          },
        },
        materials: {
          where: { visibility: 'AVAILABLE', processingStatus: 'READY' },
          select: { id: true, title: true, fileName: true, fileSize: true, materialType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resultList: any[] = academicCourses.map((course) => {
      const lecturerTitle = course.lecturer?.lecturerProfile?.title || 'Dr.';
      const lecturerNameStr = course.lecturer?.name && course.lecturer.name !== 'undefined undefined' ? course.lecturer.name : 'Faculty';
      const matCount = course.materials?.length || 0;

      return {
        ...course,
        lecturerName: `${lecturerTitle} ${lecturerNameStr}`,
        availableMaterialCount: matCount,
        materialCount: matCount,
      };
    });

    // 2. Fetch Standalone Academic Materials (uploaded without an AcademicCourse link)
    const standaloneMaterials = await this.prisma.academicMaterial.findMany({
      where: {
        courseId: null,
        visibility: 'AVAILABLE',
        processingStatus: 'READY',
      },
      include: {
        lecturer: {
          select: {
            name: true,
            email: true,
            institution: true,
            lecturerProfile: { select: { title: true, department: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    standaloneMaterials.forEach((mat) => {
      const codeMatch = mat.title.match(/([A-Z]{3,4}\s*\d{3,4})/i) || mat.fileName.match(/([A-Z]{3,4}\s*\d{3,4})/i);
      const lecturerTitle = mat.lecturer?.lecturerProfile?.title || 'Dr.';
      const lecturerNameStr = mat.lecturer?.name && mat.lecturer.name !== 'undefined undefined' ? mat.lecturer.name : 'Faculty';

      resultList.push({
        id: `standalone-${mat.id}`,
        title: mat.title,
        code: codeMatch ? codeMatch[1].toUpperCase() : 'DOC',
        department: mat.department || mat.lecturer?.lecturerProfile?.department || 'General Department',
        programme: mat.programme || 'All Programmes',
        level: mat.level || 'All Levels',
        academicYear: '2026/2027',
        institution: mat.lecturer?.institution || 'University',
        lecturerName: `${lecturerTitle} ${lecturerNameStr}`,
        materials: [{ id: mat.id, title: mat.title, materialType: mat.materialType, fileName: mat.fileName }],
        availableMaterialCount: 1,
        materialCount: 1,
        isStandalone: true,
      });
    });

    // 3. Filter by Search Query if present
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      return resultList.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q) ||
          c.department?.toLowerCase().includes(q) ||
          c.programme?.toLowerCase().includes(q) ||
          c.lecturerName?.toLowerCase().includes(q)
      );
    }

    return resultList;
  }

  async getInstitutionalMaterials(courseId: string, userId?: string) {
    if (courseId.startsWith('standalone-')) {
      const matId = courseId.replace('standalone-', '');
      const mat = await this.prisma.academicMaterial.findUnique({
        where: { id: matId },
        include: {
          lecturer: { select: { name: true, lecturerProfile: true } },
          documentContent: { select: { wordCount: true } },
          syllabi: { select: { id: true, title: true, academicYear: true } },
        },
      });

      if (!mat || mat.visibility !== 'AVAILABLE' || mat.processingStatus !== 'READY') {
        throw new Error('Institutional material not found or not available');
      }

      const codeMatch = mat.title.match(/([A-Z]{3,4}\s*\d{3,4})/i) || mat.fileName.match(/([A-Z]{3,4}\s*\d{3,4})/i);
      const lecturerTitle = mat.lecturer?.lecturerProfile?.title || 'Dr.';
      const lecturerNameStr = mat.lecturer?.name && mat.lecturer.name !== 'undefined undefined' ? mat.lecturer.name : 'Lecturer';

      return {
        course: {
          id: courseId,
          title: mat.title,
          code: codeMatch ? codeMatch[1].toUpperCase() : 'INFT 458',
          institution: mat.lecturer?.institution || 'University',
          department: mat.department || 'Computer Science & IT',
          programme: mat.programme || 'Computer Science',
          level: mat.level || 'Undergraduate',
          semester: 'FIRST',
          academicYear: '2026/2027',
          lecturerName: `${lecturerTitle} ${lecturerNameStr}`,
        },
        materials: [
          {
            id: mat.id,
            title: mat.title,
            description: mat.description,
            materialType: mat.materialType,
            fileName: mat.fileName,
            fileSize: mat.fileSize,
            createdAt: mat.createdAt,
            wordCount: mat.documentContent?.wordCount || 0,
            isSyllabusOrOutline: mat.materialType === 'COURSE_SYLLABUS' || mat.materialType === 'COURSE_OUTLINE',
          },
        ],
      };
    }

    const course = await this.prisma.academicCourse.findUnique({
      where: { id: courseId },
      include: { lecturer: { select: { name: true, lecturerProfile: true } } },
    });

    if (!course) {
      throw new Error('Institutional course not found');
    }

    const materials = await this.prisma.academicMaterial.findMany({
      where: {
        courseId,
        visibility: 'AVAILABLE',
        processingStatus: 'READY',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        documentContent: { select: { wordCount: true } },
        syllabi: { select: { id: true, title: true, academicYear: true } },
      },
    });

    const lecturerTitle = course.lecturer?.lecturerProfile?.title || 'Dr.';
    const lecturerNameStr = course.lecturer?.name && course.lecturer.name !== 'undefined undefined' ? course.lecturer.name : 'Lecturer';

    return {
      course: {
        id: course.id,
        title: course.title,
        code: course.code,
        institution: course.institution,
        department: course.department,
        programme: course.programme,
        level: course.level,
        semester: course.semester,
        academicYear: course.academicYear,
        lecturerName: `${lecturerTitle} ${lecturerNameStr}`,
      },
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        materialType: m.materialType,
        fileName: m.fileName,
        fileSize: m.fileSize,
        fileUrl: m.fileUrl,
        downloadUrl: `/courses/materials/${m.id}/download`,
        createdAt: m.createdAt,
        wordCount: m.documentContent?.wordCount || 0,
        isSyllabusOrOutline: m.materialType === 'COURSE_SYLLABUS' || m.materialType === 'COURSE_OUTLINE',
      })),
    };
  }

  async downloadMaterialFile(materialId: string, res: any) {
    const material = await this.prisma.academicMaterial.findUnique({
      where: { id: materialId },
      include: { documentContent: true },
    });

    if (!material) {
      throw new Error('Academic material not found');
    }

    if (material.fileUrl) {
      let relPath = material.fileUrl.startsWith('/') ? material.fileUrl.substring(1) : material.fileUrl;
      const absolutePath = path.join(process.cwd(), relPath);

      if (fs.existsSync(absolutePath)) {
        const fileName = material.fileName || path.basename(absolutePath);
        return res.download(absolutePath, fileName);
      }
    }

    if (material.documentContent && material.documentContent.extractedText) {
      const safeTitle = (material.title || 'Academic_Material').replace(/[^a-z0-9]/gi, '_');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.txt"`);
      return res.send(material.documentContent.extractedText);
    }

    throw new Error(`File storage missing for ${material.title}`);
  }

  async getMaterialPreview(materialId: string, userId?: string) {
    const material = await this.prisma.academicMaterial.findUnique({
      where: { id: materialId },
      include: {
        course: { select: { title: true, code: true, academicYear: true } },
        lecturer: { select: { name: true, lecturerProfile: true } },
        documentContent: { select: { cleanedText: true, wordCount: true } },
        syllabi: {
          include: {
            objectives: true,
            outcomes: true,
            topics: { orderBy: { orderIndex: 'asc' } },
            readings: true,
          },
        },
      },
    });

    if (!material) throw new Error('Material not found');
    if (material.visibility !== 'AVAILABLE' || material.processingStatus !== 'READY') {
      throw new Error('You do not have permission to view or select this material.');
    }

    const syllabusData = material.syllabi && material.syllabi.length > 0 ? material.syllabi[0] : null;

    return {
      id: material.id,
      title: material.title,
      materialType: material.materialType,
      fileName: material.fileName,
      fileSize: material.fileSize,
      createdAt: material.createdAt,
      academicYear: material.course?.academicYear || '2026/2027',
      lecturerName: `${material.lecturer?.lecturerProfile?.title || 'Dr.'} ${material.lecturer?.name || 'Lecturer'}`,
      courseTitle: material.course ? `${material.course.code}: ${material.course.title}` : 'General Material',
      wordCount: material.documentContent?.wordCount || 0,
      previewSnippet: material.documentContent?.cleanedText ? material.documentContent.cleanedText.substring(0, 2000) : '',
      syllabusStructure: syllabusData
        ? {
            objectives: syllabusData.objectives.map((o) => o.text),
            outcomes: syllabusData.outcomes.map((o) => o.text),
            topics: syllabusData.topics.map((t) => ({ title: t.title, weekNumber: t.weekNumber, description: t.description })),
            readings: syllabusData.readings.map((r) => r.citation),
          }
        : null,
    };
  }

  async validateReferences(userId: string, materialIds: string[]) {
    if (!materialIds || materialIds.length === 0) return [];

    const materials = await this.prisma.academicMaterial.findMany({
      where: {
        id: { in: materialIds },
      },
    });

    if (materials.length !== materialIds.length) {
      throw new Error('One or more selected academic reference materials do not exist.');
    }

    for (const m of materials) {
      if (m.processingStatus !== 'READY') {
        throw new Error(`Material '${m.title}' is still processing or failed processing and cannot be used as a reference.`);
      }
      if (m.visibility !== 'AVAILABLE') {
        throw new Error(`Material '${m.title}' is private and unavailable for student course generation.`);
      }
    }

    return materials;
  }

  async retrieveGroundingChunks(materialIds: string[], topic: string) {
    if (!materialIds || materialIds.length === 0) return [];

    const chunks = await this.prisma.academicChunk.findMany({
      where: {
        materialId: { in: materialIds },
      },
      include: {
        material: { select: { id: true, title: true, materialType: true } },
      },
      take: 20,
    });

    const topicKeywords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const scoredChunks = chunks.map((chunk) => {
      const text = chunk.content.toLowerCase();
      let score = 0;
      topicKeywords.forEach((kw) => {
        if (text.includes(kw)) score += 1;
      });
      if (chunk.material.materialType === 'COURSE_SYLLABUS' || chunk.material.materialType === 'COURSE_OUTLINE') {
        score += 2;
      }
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.map((s) => s.chunk);
  }

  async getCourseReferences(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        academicCourse: { select: { title: true, code: true, level: true, semester: true } },
        references: {
          include: {
            academicMaterial: {
              select: {
                title: true,
                materialType: true,
                fileName: true,
                lecturer: { select: { name: true, lecturerProfile: true } },
              },
            },
          },
        },
        generationRecord: true,
      },
    });

    if (!course) throw new Error('Course not found');

    return {
      groundingMode: course.groundingMode,
      academicCourse: course.academicCourse,
      references: course.references,
      generationRecord: course.generationRecord,
    };
  }

  async fetchOpenAlexPapers(topic: string) {
    const apiKey = process.env.OPENALEX_API_KEY || '7aRpYl0NULfjYvalbsyrd5';
    const cleanTopic = topic.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(cleanTopic)}&per-page=5&sort=cited_by_count:desc&api_key=${apiKey}`;

    this.logger.log(`Querying OpenAlex scholarly database for: "${cleanTopic}"...`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(`OpenAlex API query returned status ${response.status}`);
        return [];
      }
      const data = await response.json();
      const results = (data.results || []).map((work: any) => ({
        id: work.id,
        title: work.display_name,
        year: work.publication_year,
        citations: work.cited_by_count,
        doi: work.doi || `https://openalex.org/${work.id}`,
        authors: (work.authorships || []).slice(0, 3).map((a: any) => a.author?.display_name).filter(Boolean).join(', '),
        concepts: (work.concepts || []).slice(0, 4).map((c: any) => c.display_name).filter(Boolean).join(', '),
        type: work.type || 'journal-article',
      }));

      this.logger.log(`OpenAlex returned ${results.length} peer-reviewed scholarly papers for "${cleanTopic}"`);
      return results;
    } catch (err: any) {
      this.logger.warn(`Failed to fetch OpenAlex scholarly papers: ${err.message}`);
      return [];
    }
  }

  async generateCourse(dto: {
    userId: string;
    topic: string;
    difficulty: string;
    chapters: number;
    includeYoutube: boolean;
    groundingMode?: string;
    visibility?: string;
    department?: string;
    academicCourseId?: string;
    academicMaterialIds?: string[];
    invitedEmails?: string[];
    recommendationUserId?: string;
    recommendationSourceId?: string;
  }): Promise<{ success: boolean; courseId?: string; course?: any; message?: string }> {
    this.logger.log(`Starting AI course generation for topic: "${dto.topic}" (groundingMode: ${dto.groundingMode || 'AI_ONLY'})`);

    try {
      // Server-Side Reference Access Validation
      let validatedMaterials = [];
      let retrievedChunks = [];
      const isInstitutionalMode = (dto.groundingMode === 'INSTITUTIONAL' || dto.groundingMode === 'HYBRID') && dto.academicMaterialIds && dto.academicMaterialIds.length > 0;

      if (isInstitutionalMode) {
        this.logger.log(`Validating ${dto.academicMaterialIds.length} reference materials for user ${dto.userId}...`);
        validatedMaterials = await this.validateReferences(dto.userId, dto.academicMaterialIds);
        retrievedChunks = await this.retrieveGroundingChunks(dto.academicMaterialIds, dto.topic);
      }

      // External OpenAlex Academic Database Query
      let openAlexPapers: any[] = [];
      const isExternalMode = dto.groundingMode === 'EXTERNAL' || dto.groundingMode === 'HYBRID' || dto.groundingMode === 'EXTERNAL_ACADEMIC';
      if (isExternalMode) {
        openAlexPapers = await this.fetchOpenAlexPapers(dto.topic);
      }

      // Ensure user exists in DB
      try {
        const userExists = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!userExists) {
          await this.prisma.user.create({
            data: {
              id: dto.userId,
              email: `${dto.userId}@placeholder.com`,
              name: dto.userId === 'system-bot' ? 'Daily Recommendation' : 'Student User',
            },
          });
        }
      } catch (e) {}

      // Fetch cognitiveState
      let cognitiveState = 'BEGINNER';
      try {
        const normalizedTopic = dto.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
        const topicState = await this.prisma.topicState.findUnique({
          where: { userId_topic: { userId: dto.userId, topic: normalizedTopic } },
        });
        if (topicState?.cognitiveState) {
          cognitiveState = topicState.cognitiveState;
        } else {
          const userRecord = await this.prisma.user.findUnique({ where: { id: dto.userId } });
          if (userRecord?.cognitiveState) cognitiveState = userRecord.cognitiveState;
        }
      } catch (e) {}

      let globalState = cognitiveState;
      try {
        const userRecord = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (userRecord?.cognitiveState) globalState = userRecord.cognitiveState;
      } catch (_) {}

      const adaptiveNote = cognitiveState === 'ADVANCED'
        ? 'The learner is ADVANCED. Go deep — include edge cases, internals, advanced patterns.'
        : cognitiveState === 'INTERMEDIATE'
        ? 'The learner is INTERMEDIATE. Balance theory and practice.'
        : 'The learner is a BEGINNER. Use simple language, build concepts from the ground up.';

      // Format institutional grounding context if available
      let institutionalPromptContext = '';
      if (isInstitutionalMode && retrievedChunks.length > 0) {
        const formattedChunksText = retrievedChunks.map((c, i) =>
          `[CHUNK ${i + 1}] Material: "${c.material.title}" (${c.material.materialType})\nSection: ${c.sectionTitle || 'General'}\nContent:\n${c.content}`
        ).join('\n\n---\n\n');

        institutionalPromptContext = `
ACADEMIC GROUNDING INSTRUCTION:
Use the supplied lecturer-approved institutional academic materials as the primary curriculum reference.
Follow these rules strictly:
1. Align the generated course structure, chapter outline, and core concepts with the learning objectives and weekly topics from the supplied materials.
2. Do not invent syllabus requirements that are not present in the supplied material.
3. If the supplied materials do not contain enough information for a requested sub-topic, explain it clearly without falsely claiming it came from the syllabus.
4. Adapt the requested chapter count (${dto.chapters}) to cover the core topics in the institutional reference materials.

SUPPLIED INSTITUTIONAL REFERENCE MATERIALS (${retrievedChunks.length} chunks):
${formattedChunksText.substring(0, 12000)}
`;
      }

      // Format OpenAlex External Literature Context
      let openAlexPromptContext = '';
      if (openAlexPapers.length > 0) {
        openAlexPromptContext = `
EXTERNAL SCHOLARLY LITERATURE GROUNDING (OPENALEX DATABASE):
Ground concepts, theories, and citations using the following top peer-reviewed academic publications from the OpenAlex research repository:
${openAlexPapers.map((paper, idx) => 
  `[Paper ${idx + 1}] "${paper.title}" (${paper.year})\nAuthors: ${paper.authors || 'Researchers'} | Citations: ${paper.citations} | DOI: ${paper.doi}\nKey Concepts: ${paper.concepts}`
).join('\n\n')}
`;
      }

      // 1. Generate Syllabus Outline & Cover Theme
      const outlinePrompt = `Act as an expert curriculum designer. The user wants to learn "${dto.topic}" at a "${dto.difficulty}" level.
    ADAPTIVE ENGINE NOTE: ${adaptiveNote}
    ${institutionalPromptContext}
    ${openAlexPromptContext}
    Create a syllabus with exactly ${dto.chapters} chapters that is appropriate for a ${cognitiveState} learner.
    CRITICAL: Output ONLY a valid raw JSON object starting with '{' and ending with '}'. Do NOT include markdown code blocks, bold titles (such as **Curriculum Outline**), commentary, or notes outside the JSON structure.
    Return strictly JSON in this format: 
    { 
      "courseTitle": "String", 
      "coverTheme": {
        "gradStart": "hsl(h, s%, l%)",
        "gradEnd": "hsl(h, s%, l%)",
        "accent": "#HEX",
        "accent2": "#HEX",
        "tag": "SHORT TAG",
        "icon": "SVG markup"
      },
      "chapters": [{ "title": "String", "searchQuery": "Detailed search query for web facts", "youtubeSearchQuery": "Highly specific query for video" }] 
    }`;
    
      let outlineText = '';
      try {
        const outlineCompletion = await this.callGroqWithRetry({
          messages: [{ role: 'user', content: outlinePrompt }],
          model: 'qwen/qwen3.6-27b',
          response_format: { type: 'json_object' }
        });
        outlineText = outlineCompletion.choices[0]?.message?.content || '{}';
      } catch (outlineErr: any) {
        this.logger.warn(`Groq outline call failed (${outlineErr.message}). Attempting Gemini 3.6 Flash fallback...`);
        try {
          const geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
          const geminiRes = await geminiModel.generateContent(outlinePrompt + "\nOutput strictly valid JSON.");
          outlineText = geminiRes.response.text() || '{}';
        } catch (gemErr: any) {
          this.logger.error(`Gemini outline fallback also failed: ${gemErr.message}`);
          throw outlineErr;
        }
      }
      
      let outlineData: any = null;
      try {
        outlineData = JSON.parse(this.cleanJsonString(outlineText));
      } catch (parseErr: any) {
        this.logger.warn(`Direct JSON parse failed for syllabus outline (${parseErr.message}). Trying regex extraction fallback...`);
        const jsonMatch = outlineText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            outlineData = JSON.parse(jsonMatch[0]);
          } catch (e2) {}
        }
      }

      if (!outlineData || !Array.isArray(outlineData.chapters) || outlineData.chapters.length === 0) {
        this.logger.warn(`Outline parsing produced empty or invalid structure. Creating robust fallback outline...`);
        const chapterCount = dto.chapters || 4;
        const generatedChapters = [];
        for (let i = 1; i <= chapterCount; i++) {
          generatedChapters.push({
            title: `Chapter ${i}: ${dto.topic} Core Concepts (Part ${i})`,
            searchQuery: `${dto.topic} chapter ${i} explanation`,
            youtubeSearchQuery: `${dto.topic} tutorial ${i}`
          });
        }
        outlineData = {
          courseTitle: dto.topic,
          coverTheme: { tag: dto.topic },
          chapters: generatedChapters
        };
      }

      // 2. Generate Cover
      const coverImage = await this.generateCourseCover(outlineData.courseTitle || dto.topic, outlineData.coverTheme);
      
      // 3. Ultra-Fast Parallel chapter generation (Combined Content & Learning Aids in Single Prompt)
      const chapterPromises = outlineData.chapters.map(async (chapter: any, index: number) => {
        let scrapedContext = "";
        try {
          if (process.env.TAVILY_API_KEY) {
            const tavilyResp = await axios.post('https://api.tavily.com/search', {
              api_key: process.env.TAVILY_API_KEY,
              query: `${dto.topic} ${chapter.searchQuery || chapter.title}`,
              search_depth: "basic",
              include_answer: true,
              max_results: 2
            }, { timeout: 1000 });
            scrapedContext = tavilyResp.data.results?.map((r: any) => r.content).join("\n\n") || tavilyResp.data.answer || "";
          }
        } catch (err: any) {}
        
        const combinedPrompt = `You are an elite academic professor and master curriculum writer crafting an exhaustive, textbook-grade course chapter.
Topic: ${dto.topic}.
Chapter Title: ${chapter.title}.
Target Difficulty: ${dto.difficulty}.
Learner Cognitive State: ${cognitiveState}. ${adaptiveNote}
${institutionalPromptContext ? `\nINSTITUTIONAL SYLLABUS REFERENCE DATA:\n${institutionalPromptContext.substring(0, 3000)}\n` : ''}
${openAlexPromptContext ? `\nOPENALEX ACADEMIC RESEARCH DATABASE LITERATURE:\n${openAlexPromptContext.substring(0, 3000)}\n` : ''}
${scrapedContext ? `\nWEB RESEARCH CONTEXT:\n${scrapedContext.substring(0, 2500)}\n` : ''}

COMPREHENSIVE DEPTH & COVERAGE REQUIREMENTS:
Write a highly detailed, expansive, multi-section textbook chapter (aim for maximum depth and thorough coverage). Do NOT summarize or write high-level overviews. Cover all underlying mechanics and practical applications thoroughly across the following structured sub-sections:
1. Executive Overview & Theoretical Foundations (Core background, key principles, historical evolution, and real-world significance).
2. Deep Conceptual Mechanics & System Architecture (Detailed breakdown of workflows, mathematical formulas, comparative analysis tables, and structural design patterns).
3. Production Code & Hands-On Technical Implementation (Comprehensive, fully functional syntax-highlighted code snippets e.g. \`\`\`python, \`\`\`javascript, \`\`\`sql with inline explanations).
4. Enterprise Edge Cases, Security & Performance Optimization (Common pitfalls, security vulnerabilities, performance bottlenecks, and industry best practices).

ACADEMIC INTEGRITY, APA CITATIONS & PRESENTATION INSTRUCTIONS:
1. APA 7TH EDITION IN-TEXT CITATIONS:
   - Ground theories, empirical findings, definitions, and framework explanations using in-text APA 7th edition citations (e.g., (Author & Coauthor, Year) or (Author et al., Year)).
   - Specifically cite literature from the OpenAlex research database context or institutional grounding materials provided above.

2. VISUAL FORMATTING & PRESENTATION ELEGANCE:
   - Structure the explanation with crisp Markdown section headers (##, ###).
   - Use emoji callout blockquotes for key takeaways, terminology, and pitfalls:
     > 💡 **Core Takeaway**: Essential concept summary.
     > 📌 **Key Terminology**: Precise definitions.
     > ⚠️ **Common Pitfall**: Typical student misconceptions and how to avoid them.
   - Format all code examples with explicit syntax highlighting (e.g. \`\`\`python, \`\`\`javascript, \`\`\`sql).
   - Use Markdown tables or bulleted lists for comparative concepts.

3. MANDATORY END-OF-CHAPTER REFERENCE & DOCUMENTATION SECTIONS:
   - At the end of the chapter content, include a section titled:
     ### References
     List all cited sources in full formal APA 7th Edition format:
     Author, A. A., & Author, B. B. (Year). *Title of publication*. Journal or Publisher Name. https://doi.org/10.xxxx/xxxx (or URL link).
   - Immediately following the References section, include a section titled:
     ### Further Reading & Official Documentation
     Provide 2-4 curated recommendations (official documentation links, benchmark research papers, or classic textbooks) for students who want to deepen their mastery.

Return strictly JSON matching this schema:
{
  "content": "Full, exhaustive, deeply detailed markdown chapter content incorporating in-text APA citations, sub-headings, callout boxes, code snippets, the ### References section, and the ### Further Reading & Official Documentation section.",
  "quizzes": [{ "question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "answerIndex": 0 }],
  "flashcards": [{ "front": "Concept", "back": "Definition" }],
  "summary": "Comprehensive summary text of the chapter",
  "tasks": [{ "title": "Practical Exercise", "description": "Problem prompt", "answer": "Step-by-step solution with explanations and syntax-highlighted code" }]
}`;
        
        let chapterResult: any = {};
        try {
          const completion = await this.callGroqWithRetry({
            messages: [{ role: 'user', content: combinedPrompt }],
            model: 'groq/compound-mini',
            max_tokens: 8192,
            response_format: { type: 'json_object' }
          });
          chapterResult = JSON.parse(this.cleanJsonString(completion.choices[0]?.message?.content || '{}'));
        } catch (e: any) {
          this.logger.warn(`Groq chapter generation failed for ${chapter.title} (${e.message}). Retrying with Gemini fallback...`);
          try {
            const geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
            const geminiRes = await geminiModel.generateContent(combinedPrompt + "\nOutput strictly valid JSON.");
            chapterResult = JSON.parse(this.cleanJsonString(geminiRes.response.text() || '{}'));
          } catch (gemErr) {
            chapterResult = {
              content: `## ${chapter.title}\n\nComprehensive exploration of ${chapter.title} for ${dto.topic}.`,
              summary: `Summary of ${chapter.title}`
            };
          }
        }
        
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
              },
              timeout: 1000
            });
            if (ytResp.data.items && ytResp.data.items.length > 0) {
              youtubeUrl = `https://www.youtube.com/embed/${ytResp.data.items[0].id.videoId}`;
            }
          } catch (err: any) {}
        }

        const learningAidsData: any[] = [];
        const quizzes = chapterResult.quizzes || chapterResult.quiz || [];
        if (Array.isArray(quizzes) && quizzes.length > 0) {
          learningAidsData.push({ type: 'QUIZ', payload: { quizzes } });
        }
        const flashcards = chapterResult.flashcards || chapterResult.flashcard || [];
        if (Array.isArray(flashcards) && flashcards.length > 0) {
          learningAidsData.push({ type: 'FLASHCARD', payload: { flashcards } });
        }
        const summary = typeof chapterResult.summary === 'string' ? chapterResult.summary : (chapterResult.summary?.text || '');
        if (summary) {
          learningAidsData.push({ type: 'SUMMARY', payload: { summary } });
        }
        const tasks = chapterResult.tasks || chapterResult.task || [];
        if (Array.isArray(tasks) && tasks.length > 0) {
          learningAidsData.push({ type: 'TASK', payload: { tasks } });
        }

        let moduleDifficultyWeight = globalState === 'ADVANCED' ? 3 : globalState === 'INTERMEDIATE' ? 2 : 1;

        return {
          title: chapter.title,
          content: chapterResult.content || `## ${chapter.title}\n\nDetailed explanation of ${chapter.title}.`,
          youtubeUrl: youtubeUrl,
          orderIndex: index,
          difficultyWeight: moduleDifficultyWeight,
          learningAids: { create: learningAidsData }
        };
      });

      const modulesData = await Promise.all(chapterPromises);
      
      // 4. Save Course to DB
      let normalizedDifficulty = dto.difficulty ? dto.difficulty.toUpperCase() : 'BEGINNER';
      if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normalizedDifficulty)) {
         normalizedDifficulty = 'BEGINNER';
      }

      let validAcademicCourseId: string | null = null;
      if (dto.academicCourseId && !dto.academicCourseId.startsWith('standalone-')) {
        const existingCourse = await this.prisma.academicCourse.findUnique({
          where: { id: dto.academicCourseId },
        });
        if (existingCourse) {
          validAcademicCourseId = existingCourse.id;
        }
      }

      const course = await this.prisma.course.create({
        data: {
          userId: dto.userId,
          title: outlineData.courseTitle || dto.topic,
          targetDifficulty: normalizedDifficulty,
          coverImage: coverImage,
          groundingMode: dto.groundingMode || (isInstitutionalMode ? 'INSTITUTIONAL' : isExternalMode ? 'EXTERNAL' : 'AI_ONLY'),
          visibility: (dto.visibility || 'PUBLIC').toUpperCase(),
          department: dto.department || null,
          academicCourseId: validAcademicCourseId,
          recommendationUserId: dto.recommendationUserId || null,
          recommendationSourceId: dto.recommendationSourceId || null,
          modules: {
            create: modulesData
          }
        },
        include: {
          modules: true
        }
      });

      // Save persistent institutional references
      if (validatedMaterials.length > 0) {
        await this.prisma.generatedCourseReference.createMany({
          data: validatedMaterials.map((m) => ({
            courseId: course.id,
            academicMaterialId: m.id,
            sourceType: 'INSTITUTIONAL',
            title: m.title,
            materialType: m.materialType,
            versionSnapshot: 1,
          })),
        });
      }

      // Save persistent OpenAlex external literature references
      if (openAlexPapers.length > 0) {
        await this.prisma.generatedCourseReference.createMany({
          data: openAlexPapers.map((p) => ({
            courseId: course.id,
            externalSourceId: p.doi || p.id,
            sourceType: 'OPENALEX',
            title: `${p.title} (${p.year}) - ${p.authors || 'OpenAlex Paper'} [${p.citations} Citations]`,
            materialType: 'PEER_REVIEWED_PAPER',
            versionSnapshot: 1,
          })),
        });
      }

      // Process invited student email addresses for private or personalized courses
      if (dto.invitedEmails && Array.isArray(dto.invitedEmails) && dto.invitedEmails.length > 0) {
        for (const rawEmail of dto.invitedEmails) {
          const cleanEmail = rawEmail.trim().toLowerCase();
          if (cleanEmail && cleanEmail.includes('@')) {
            const studentUser = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
            await this.prisma.courseEnrollment.upsert({
              where: { courseId_studentEmail: { courseId: course.id, studentEmail: cleanEmail } },
              update: { studentId: studentUser ? studentUser.id : undefined, status: 'ENROLLED' },
              create: {
                courseId: course.id,
                studentEmail: cleanEmail,
                studentId: studentUser ? studentUser.id : null,
                lecturerId: dto.userId,
                status: studentUser ? 'ENROLLED' : 'INVITED',
              },
            });
            if (studentUser) {
              await this.prisma.userCourseProgress.upsert({
                where: { userId_courseId: { userId: studentUser.id, courseId: course.id } },
                update: {},
                create: { userId: studentUser.id, courseId: course.id, isCompleted: false, totalTimeSpentSeconds: 0 },
              });
            }
          }
        }
      }

      // Save generation record
      await this.prisma.courseGenerationRecord.create({
        data: {
          courseId: course.id,
          groundingMode: dto.groundingMode || (isInstitutionalMode ? 'INSTITUTIONAL' : 'AI_ONLY'),
          modelProvider: 'Groq',
          modelName: 'groq/compound / groq/compound-mini',
          retrievedChunkCount: retrievedChunks.length,
        },
      });

      // Automatically enroll creator
      if (dto.userId !== 'system-bot') {
        await this.prisma.userCourseProgress.upsert({
          where: { userId_courseId: { userId: dto.userId, courseId: course.id } },
          update: {},
          create: {
            userId: dto.userId,
            courseId: course.id,
            isCompleted: false,
            totalTimeSpentSeconds: 0
          }
        });
      }
      
      return { success: true, courseId: course.id, course };
    } catch (error: any) {
      this.logger.error("Failed to generate course", error.stack);
      return { success: false, message: error.message || "Generating the course failed due to an unexpected server issue." };
    }
  }

  async getCourse(id: string, userId?: string) {
    let course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: { 
            learningAids: true,
            userProgress: userId ? { where: { userId } } : undefined
          }
        },
        userProgress: userId ? { where: { userId } } : undefined
      }
    });

    if (!course) return null;

    // Check if it's a shell course (e.g. recommended courses created with empty content)
    const isShell = course.modules.some(m => !m.content);
    if (isShell) {
      this.logger.log(`Lazy-generating contents for shell course "${course.title}" (${course.id})...`);
      await this.fillShellCourseContent(course);

      // Re-fetch the fully generated course details
      course = await this.prisma.course.findUnique({
        where: { id },
        include: {
          modules: {
            orderBy: { orderIndex: 'asc' },
            include: { 
              learningAids: true,
              userProgress: userId ? { where: { userId } } : undefined
            }
          },
          userProgress: userId ? { where: { userId } } : undefined
        }
      });
    }

    return course;
  }

  async updateProgress(dto: { userId: string, moduleId: string, status?: any, quizScore?: number, confidenceRating?: number, metadata?: any }) {
    const { userId, moduleId, status, quizScore, confidenceRating, metadata } = dto;

    // Ensure metadata is a valid object if provided, otherwise default to {} for Prisma Json field
    const prismaMetadata = metadata || {};

    if (quizScore !== undefined) {
      prismaMetadata.quizSubmittedAt = new Date().toISOString();
    }

    return this.prisma.userProgress.upsert({
      where: {
        userId_moduleId: { userId, moduleId }
      },
      update: {
        status: status,
        quizScore: quizScore,
        confidenceRating: confidenceRating,
        metadata: prismaMetadata,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      },
      create: {
        userId,
        moduleId,
        status: status || 'IN_PROGRESS',
        quizScore: quizScore,
        confidenceRating: confidenceRating,
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
        userProgress: {
          where: { userId }
        },
        _count: {
          select: { modules: true }
        }
      }
    });
  }
  async getAllCourses(userId?: string) {
    return await this.prisma.course.findMany({
      where: {
        userId: userId ? { not: userId } : undefined,
        recommendationUserId: null,
        recommendationSourceId: null,
        userProgress: userId ? {
          none: {
            userId: userId
          }
        } : undefined
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { modules: true }
        },
        user: {
          select: { id: true, name: true }
        },
        userProgress: userId ? { where: { userId } } : undefined
      }
    });
  }

  async getEnrolledCourses(userId: string) {
    return await this.prisma.course.findMany({
      where: {
        userProgress: {
          some: {
            userId: userId
          }
        },
        NOT: {
          userId: userId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          include: {
            userProgress: {
              where: { userId }
            }
          }
        },
        userProgress: {
          where: { userId }
        },
        _count: {
          select: { modules: true }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async enrollInCourse(courseId: string, userId: string) {
    const existing = await this.prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.userCourseProgress.create({
      data: {
        userId,
        courseId,
        isCompleted: false,
        totalTimeSpentSeconds: 0
      }
    });
  }

  async unenrollCourse(courseId: string, userId: string) {
    this.logger.log(`Unenrolling user: ${userId} from course: ${courseId}`);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { select: { id: true } } }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const moduleIds = course.modules.map(m => m.id);

    await this.prisma.userProgress.deleteMany({
      where: {
        userId,
        moduleId: { in: moduleIds }
      }
    });

    await this.prisma.userCourseProgress.deleteMany({
      where: {
        userId,
        courseId
      }
    });

    await this.prisma.ratingReview.deleteMany({
      where: {
        userId,
        courseId
      }
    });

    return { success: true };
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

    // Delete Course Progress and Ratings
    await this.prisma.userCourseProgress.deleteMany({
      where: { courseId: id }
    });
    await this.prisma.ratingReview.deleteMany({
      where: { courseId: id }
    });

    // 3. Delete Course
    return await this.prisma.course.delete({
      where: { id }
    });
  }

  async getCourseProgress(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            userProgress: { where: { userId } }
          }
        }
      }
    });

    if (!course) throw new Error('Course not found');

    const totalModules = course.modules.length;
    let completedModules = 0;
    let totalTimeSpent = 0;
    let totalQuizScore = 0;
    let modulesWithQuiz = 0;

    const moduleStatus = course.modules.map(mod => {
      const progress = mod.userProgress[0];
      const quizScore = progress?.quizScore;
      const tasksDone = progress?.metadata?.completedTasks ? 
        Object.values(progress.metadata.completedTasks).every((v: any) => v === true) : false;
      
      // Module complete = quizScore >= 3 (50% of 5) AND all tasks done
      const isModuleComplete = quizScore !== null && quizScore >= 3 && tasksDone;
      
      if (isModuleComplete) completedModules++;
      if (progress?.timeSpentSeconds) totalTimeSpent += progress.timeSpentSeconds;
      if (quizScore !== null && quizScore !== undefined) {
        totalQuizScore += (quizScore / 5) * 100; // Convert to percentage
        modulesWithQuiz++;
      }

      return {
        moduleId: mod.id,
        title: mod.title,
        isComplete: isModuleComplete,
        quizScore: quizScore,
        tasksDone: tasksDone,
        status: progress?.status || 'NOT_STARTED'
      };
    });

    const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    const averageQuizScore = modulesWithQuiz > 0 ? Math.round(totalQuizScore / modulesWithQuiz) : 0;

    return {
      progressPercentage,
      completedModules,
      totalModules,
      totalTimeSpentSeconds: totalTimeSpent,
      averageQuizScore,
      moduleStatus,
      isCourseComplete: completedModules === totalModules && totalModules > 0
    };
  }

  async completeCourse(courseId: string, userId: string) {
    // First validate completion criteria
    const progress = await this.getCourseProgress(courseId, userId);
    
    if (!progress.isCourseComplete) {
      throw new Error('Course completion criteria not met');
    }

    // Upsert UserCourseProgress
    const courseProgress = await this.prisma.userCourseProgress.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        totalTimeSpentSeconds: progress.totalTimeSpentSeconds,
        averageQuizScore: progress.averageQuizScore
      },
      create: {
        userId,
        courseId,
        isCompleted: true,
        completedAt: new Date(),
        totalTimeSpentSeconds: progress.totalTimeSpentSeconds,
        averageQuizScore: progress.averageQuizScore
      }
    });

    return courseProgress;
  }

  async addRating(dto: { userId: string, courseId: string, rating: number, review?: string }) {
    // Validate rating range
    if (dto.rating < 1 || dto.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Upsert rating
    await this.prisma.ratingReview.upsert({
      where: {
        userId_courseId: { userId: dto.userId, courseId: dto.courseId }
      },
      update: {
        rating: dto.rating,
        review: dto.review
      },
      create: {
        userId: dto.userId,
        courseId: dto.courseId,
        rating: dto.rating,
        review: dto.review
      }
    });

    // Recalculate average rating for the course
    const ratings = await this.prisma.ratingReview.findMany({
      where: { courseId: dto.courseId }
    });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 ? 
      ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;

    await this.prisma.course.update({
      where: { id: dto.courseId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings
      }
    });

    return { success: true, averageRating, totalRatings };
  }

  async getRatings(courseId: string) {
    return this.prisma.ratingReview.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSuggestions(userId: string, courseId: string): Promise<any[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: true }
    });

    if (!course) throw new Error('Course not found');

    // Find if we already have 3 continuation recommendations in the DB
    let recommendations = await this.prisma.course.findMany({
      where: { recommendationSourceId: courseId },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (recommendations.length < 3) {
      const needed = 3 - recommendations.length;
      this.logger.log(`Generating ${needed} new advanced continuation shell recommendations for course: "${course.title}"`);
      
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        
        // Define the target difficulty based on the current course
        let targetDifficulty = 'INTERMEDIATE';
        if (course.targetDifficulty === 'BEGINNER') {
          targetDifficulty = 'INTERMEDIATE';
        } else if (course.targetDifficulty === 'INTERMEDIATE' || course.targetDifficulty === 'ADVANCED') {
          targetDifficulty = 'ADVANCED';
        }

        const prompt = `You are a curriculum expert. The student has just completed the course "${course.title}" at a "${course.targetDifficulty}" level.
Suggest exactly ${needed} continuation or advanced courses to follow up on this topic.
For each course, design a syllabus of exactly 5 chapters.
Return your response ONLY as a JSON array of course objects:
[
  {
    "title": "String (e.g. Advanced Python: Concurrency & Threads)",
    "difficulty": "${targetDifficulty}",
    "tag": "String (1-2 words topic tag, uppercase)",
    "chapters": [
      { "title": "String (chapter title)" },
      { "title": "String (chapter title)" },
      { "title": "String (chapter title)" },
      { "title": "String (chapter title)" },
      { "title": "String (chapter title)" }
    ]
  }
]
Do not include markdown wrappers, explanations, or any text other than the raw JSON array.`;

        const result = await model.generateContent(prompt);
        const cleaned = result.response.text().trim().replace(/```json|```/g, '').trim();
        const suggestions = JSON.parse(cleaned);

        if (Array.isArray(suggestions)) {
          // Ensure user 'system-bot' exists to avoid foreign key constraints
          try {
            const botExists = await this.prisma.user.findUnique({ where: { id: 'system-bot' } });
            if (!botExists) {
              await this.prisma.user.create({
                data: {
                  id: 'system-bot',
                  email: 'system-bot@placeholder.com',
                  name: 'Daily Recommendation'
                }
              });
            }
          } catch (e) {
            this.logger.warn(`Could not verify or create system-bot user: ${e.message}`);
          }

          for (const sug of suggestions.slice(0, needed)) {
            const h = Math.floor(Math.random() * 360);
            const coverTheme = {
              gradStart: `hsl(${h}, 45%, 15%)`,
              gradEnd: `hsl(${h}, 45%, 8%)`,
              accent: `hsl(${h}, 85%, 60%)`,
              accent2: `hsl(${(h + 40) % 360}, 85%, 60%)`,
              tag: sug.tag || "CONTINUATION",
              icon: `<path d="M10 50 L140 50 M75 10 L75 110" stroke="#fff" stroke-width="4" />`
            };
            
            const coverImage = await this.generateCourseCover(sug.title, coverTheme);
            
            const newCourse = await this.prisma.course.create({
              data: {
                userId: 'system-bot',
                title: sug.title,
                targetDifficulty: sug.difficulty || targetDifficulty,
                coverImage,
                recommendationSourceId: courseId,
                modules: {
                  create: sug.chapters.map((ch: any, idx: number) => ({
                    title: ch.title,
                    orderIndex: idx,
                    difficultyWeight: idx + 1
                  }))
                }
              },
              include: {
                modules: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            });
            recommendations.push(newCourse);
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to generate outline recommendations: ${err.message}`);
      }
    }

    if (recommendations.length === 0) {
      this.logger.warn("Outline recommendations generation failed. Falling back to existing database courses.");
      const fallbackCourses = await this.prisma.course.findMany({
        where: { id: { not: courseId } },
        take: 3
      });
      return fallbackCourses;
    }

    return recommendations.slice(0, 3);
  }

  async getDailyRecommendationTopics(count: number, historyTitles: string[] = []): Promise<string[]> {
    const recentCourses = await this.prisma.course.findMany({
      where: { userId: 'system-bot' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true }
    });
    const recentTitles = recentCourses.map(c => c.title).join(', ');
    
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const historyStr = historyTitles.length > 0 ? historyTitles.join(', ') : 'None';
      const prompt = `Suggest a list of exactly ${count} highly engaging, distinct technical topics for daily featured learning courses (topics could cover computer science, frontend, backend, database, cloud, devops, mobile, or AI).
The user's active learning history includes courses on these topics/titles: [${historyStr}].
Your recommendations MUST be tailored, relevant, and directly build upon or complement the user's learning history (e.g. if they have react/frontend, suggest next.js/typescript/state-management; if they have python/analytics, suggest pandas/machine-learning/sql). If they have no history, suggest general modern engineering topics.
Avoid recommending the exact topics they have already learned: [${historyStr}].
Also avoid these recently recommended topics/titles: [${recentTitles}].
Return your response ONLY as a JSON string array of titles, e.g. ["Docker Volumes", "Kubernetes Ingress", "GraphQL Queries"]. Do not include markdown wrappers, explanation, or any other text.`;
      const result = await model.generateContent(prompt);
      const cleaned = result.response.text().trim().replace(/```json|```/g, '').trim();
      const topics = JSON.parse(cleaned);
      if (Array.isArray(topics) && topics.length > 0) {
        return topics.map(t => t.trim().replace(/['"`.?!]/g, ''));
      }
    } catch (err: any) {
      this.logger.warn(`Failed to suggest daily topics with Gemini: ${err.message}. Falling back to default.`);
    }
    
    const fallbacks = [
      "TypeScript Advanced Patterns",
      "Next.js App Router",
      "Docker Container Networking",
      "Kubernetes Essentials",
      "PostgreSQL Performance Tuning",
      "Redis Caching Strategies",
      "AWS Lambda Fundamentals",
      "GraphQL API Development"
    ];
    return fallbacks.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  async getDailyRecommendation(userId?: string): Promise<{ courses: any[], enrolledIds: string[] }> {
    const now = new Date();
    const startOfTodayGmt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    let dailyCourses = await this.prisma.course.findMany({
      where: {
        userId: 'system-bot',
        recommendationUserId: userId || null,
        createdAt: { gte: startOfTodayGmt }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            userProgress: userId ? { where: { userId } } : undefined
          }
        },
        userProgress: userId ? { where: { userId } } : undefined
      }
    });

    if (dailyCourses.length < 3) {
      const neededCount = 3 - dailyCourses.length;
      this.logger.log(`Found only ${dailyCourses.length} daily recommended courses. Generating ${neededCount} more...`);
      
      let historyTitles: string[] = [];
      if (userId) {
        try {
          const enrolled = await this.prisma.userCourseProgress.findMany({
            where: { userId },
            select: { course: { select: { title: true } } }
          });
          const enrolledTitles = enrolled.map(e => e.course?.title).filter(Boolean);
          
          const created = await this.prisma.course.findMany({
            where: { userId },
            select: { title: true }
          });
          const createdTitles = created.map(c => c.title).filter(Boolean);
          
          historyTitles = Array.from(new Set([...enrolledTitles, ...createdTitles]));
        } catch (e) {
          this.logger.warn(`Could not fetch user history for daily recommendation personalization: ${e.message}`);
        }
      }

      const topics = await this.getDailyRecommendationTopics(neededCount, historyTitles);
      
      for (const topic of topics) {
        const genResult = await this.generateCourse({
          userId: 'system-bot',
          topic,
          difficulty: 'INTERMEDIATE',
          chapters: 5,
          includeYoutube: true,
          recommendationUserId: userId || null
        });
        
        if (genResult.success && genResult.courseId) {
          const newCourse = await this.prisma.course.findUnique({
            where: { id: genResult.courseId },
            include: {
              modules: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  userProgress: userId ? { where: { userId } } : undefined
                }
              },
              userProgress: userId ? { where: { userId } } : undefined
            }
          });
          if (newCourse) {
            dailyCourses.push(newCourse);
          }
        } else {
          this.logger.error(`Failed to lazy-generate daily course for topic "${topic}": ${genResult.message}`);
        }
      }
    }

    const enrolledIds: string[] = [];
    if (userId && dailyCourses.length > 0) {
      const enrollments = await this.prisma.userCourseProgress.findMany({
        where: {
          userId,
          courseId: { in: dailyCourses.map(c => c.id) }
        },
        select: { courseId: true }
      });
      enrollments.forEach(e => enrolledIds.push(e.courseId));
    }

    return { courses: dailyCourses.slice(0, 3), enrolledIds };
  }

  async fillShellCourseContent(course: any) {
    this.logger.log(`Generating content for shell course: "${course.title}" (${course.id})`);
    
    const difficulty = course.targetDifficulty;
    const cognitiveState = difficulty;
    
    const adaptiveNote = cognitiveState === 'ADVANCED'
      ? 'The learner is ADVANCED. Go deep — include edge cases, internals, advanced patterns, and assume strong prior knowledge. Skip basic definitions.'
      : cognitiveState === 'INTERMEDIATE'
      ? 'The learner is INTERMEDIATE. Balance theory and practice. Include worked examples, mention common pitfalls, and assume basic familiarity with the domain.'
      : 'The learner is a BEGINNER. Use simple language, build concepts from the ground up, avoid jargon without explanation, and include plenty of analogies.';

    const chapterPromises = course.modules.map(async (module: any, index: number) => {
      this.logger.log(`Lazy-generating chapter: "${module.title}" for course "${course.title}"`);

      // A. Tavily Search & Scrape
      let scrapedContext = "";
      try {
        const tavilyResp = await axios.post('https://api.tavily.com/search', {
          api_key: process.env.TAVILY_API_KEY,
          query: `${course.title} ${module.title}`,
          search_depth: "basic",
          include_answer: true,
          include_raw_content: true,
          max_results: 3
        });
        scrapedContext = tavilyResp.data.results.map((r: any) => r.raw_content || r.content).join("\n\n") || tavilyResp.data.answer || "";
      } catch (err: any) {
        this.logger.error("Tavily search failed for shell course", err.message);
      }

      // B. Detailed Groq Synthesis
      const detailPrompt = `You are an elite academic professor and master curriculum writer crafting an exhaustive, textbook-grade course chapter.
Topic: ${course.title}.
Chapter Title: ${module.title}.
Target Difficulty: ${difficulty}.
Learner Cognitive State: ${cognitiveState}. ${adaptiveNote}
Use the following research content to enrich your explanation with facts and deep details:\n\n${scrapedContext.substring(0, 15000)}\n\n

COMPREHENSIVE DEPTH & COVERAGE REQUIREMENTS:
Write a highly detailed, expansive, multi-section textbook chapter (aim for maximum depth and thorough coverage). Do NOT summarize or write high-level overviews. Cover all underlying mechanics and practical applications thoroughly across structured sub-sections:
1. Executive Overview & Theoretical Foundations (Core background, key principles, historical evolution, and real-world significance).
2. Deep Conceptual Mechanics & System Architecture (Detailed breakdown of workflows, mathematical formulas, comparative analysis tables, and structural design patterns).
3. Production Code & Hands-On Technical Implementation (Comprehensive, fully functional syntax-highlighted code snippets e.g. \`\`\`python, \`\`\`javascript, \`\`\`sql with inline explanations).
4. Enterprise Edge Cases, Security & Performance Optimization (Common pitfalls, security vulnerabilities, performance bottlenecks, and industry best practices).

ACADEMIC INTEGRITY, APA CITATIONS & PRESENTATION INSTRUCTIONS:
1. APA 7TH EDITION IN-TEXT CITATIONS:
   - Ground theories, empirical findings, definitions, and framework explanations using in-text APA 7th edition citations (e.g., (Author & Coauthor, Year) or (Author et al., Year)).
2. VISUAL FORMATTING & PRESENTATION ELEGANCE:
   - Structure the explanation with crisp Markdown section headers (##, ###).
   - Use emoji callout blockquotes for key takeaways, terminology, and pitfalls:
     > 💡 **Core Takeaway**: Essential concept summary.
     > 📌 **Key Terminology**: Precise definitions.
     > ⚠️ **Common Pitfall**: Typical student misconceptions and how to avoid them.
   - Format all code examples with explicit syntax highlighting (e.g. \`\`\`python, \`\`\`javascript, \`\`\`sql).
3. MANDATORY END-OF-CHAPTER REFERENCE & DOCUMENTATION SECTIONS:
   - Include a '### References' section at the end of the content listing all cited sources in formal APA 7th Edition format.
   - Include a '### Further Reading & Official Documentation' section listing 2-4 curated documentation links or academic reading materials for deeper understanding.`;

      const detailCompletion = await this.callGroqWithRetry({
        messages: [{ role: 'user', content: detailPrompt }],
        model: 'groq/compound-mini',
        max_tokens: 8192,
      });
      const content = detailCompletion.choices[0]?.message?.content || '';

      // C. YouTube Integration
      let youtubeUrl = null;
      if (process.env.YOUTUBE_API_KEY) {
        try {
          const ytResp = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
              key: process.env.YOUTUBE_API_KEY,
              q: `${course.title} ${module.title} tutorial`,
              part: "snippet",
              type: "video",
              maxResults: 1
            }
          });
          if (ytResp.data.items && ytResp.data.items.length > 0) {
            youtubeUrl = `https://www.youtube.com/embed/${ytResp.data.items[0].id.videoId}`;
          }
        } catch (err: any) {
          this.logger.error("YouTube search failed for shell course", err.message);
        }
      }

      // D. Learning Aids Generation
      const quizQuestionCount = cognitiveState === 'ADVANCED' ? 12 : cognitiveState === 'INTERMEDIATE' ? 8 : 5;
      let learningAidsData = [];
      try {
        const learningAidsPrompt = `Based ONLY on the following chapter content, generate exactly:
- ${quizQuestionCount} multiple choice quiz questions (calibrated for a ${cognitiveState} learner)
- 10 flashcards
- 1 comprehensive, in-depth structured summary (covering key definitions, core concepts, and key takeaways in 3-4 detailed paragraphs)
- exactly 5 practical tasks (each must have a clear description and a beautifully formatted "answer" containing step-by-step solution steps, best practice suggestions, and clean syntax-highlighted code blocks where applicable in Markdown)

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
  "summary": "Detailed comprehensive summary covering the core concepts, key terms, and critical takeaways in depth.",
  "tasks": [
    { "title": "Task Name", "description": "What to do", "answer": "Detailed step-by-step solution, explanation, and code blocks formatted beautifully in Markdown" }
  ]
}`;
        const aidsCompletion = await this.callGroqWithRetry({
          messages: [{ role: 'user', content: learningAidsPrompt }],
          model: 'groq/compound-mini',
          response_format: { type: 'json_object' },
          max_tokens: 4096,
        });
        const aidsText = aidsCompletion.choices[0]?.message?.content || '{}';
        const aidsJson = JSON.parse(this.cleanJsonString(aidsText));

        const quizzes = aidsJson.quizzes || aidsJson.quiz || [];
        if (Array.isArray(quizzes) && quizzes.length > 0) {
          learningAidsData.push({ type: 'QUIZ', payload: { quizzes } });
        }

        const flashcards = aidsJson.flashcards || aidsJson.flashcard || [];
        if (Array.isArray(flashcards) && flashcards.length > 0) {
          learningAidsData.push({ type: 'FLASHCARD', payload: { flashcards } });
        }

        const summary = typeof aidsJson.summary === 'string' ? aidsJson.summary : (aidsJson.summary?.text || aidsJson.summary?.content || '');
        if (summary) {
          learningAidsData.push({ type: 'SUMMARY', payload: { summary } });
        }

        const tasks = aidsJson.tasks || aidsJson.task || [];
        if (Array.isArray(tasks) && tasks.length > 0) {
          learningAidsData.push({ type: 'TASK', payload: { tasks } });
        }
      } catch (err: any) {
        this.logger.error("Learning Aids generation failed for shell course", err.message);
      }

      await this.prisma.module.update({
        where: { id: module.id },
        data: {
          content,
          youtubeUrl,
          learningAids: {
            create: learningAidsData
          }
        }
      });
    });

    await Promise.all(chapterPromises);
    this.logger.log(`Fully generated content for shell course: "${course.title}"`);
  }
}

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

  private async callGroqWithRetry(params: any, retries = 4, delayMs = 3000): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.groq.chat.completions.create(params);
      } catch (err: any) {
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

  private generateCourseCover(topic: string, coverTheme?: any): string {
    try {
      this.logger.log(`Generating custom WOW-factor themed vector cover for: "${topic}"`);
      const svg = this.generateProceduralSVG(topic, coverTheme);
      const base64 = Buffer.from(svg).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    } catch (err) {
      this.logger.error(`Failed to generate course cover for "${topic}": ${err.message}`);
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#111"/></svg>`;
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

  async generateCourse(dto: { userId: string, topic: string, difficulty: string, chapters: number, includeYoutube: boolean }) {
    this.logger.log(`Starting AI course generation for topic: "${dto.topic}"`);
    this.logger.log(`Generation settings: difficulty=${dto.difficulty}, chapters=${dto.chapters}, youtube=${dto.includeYoutube}`);

    try {
      // Ensure user exists in the database to prevent foreign key errors (e.g. if database was wiped)
      try {
        const userExists = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!userExists) {
          this.logger.log(`User ${dto.userId} not found in database. Auto-creating user record.`);
          await this.prisma.user.create({
            data: {
              id: dto.userId,
              email: `${dto.userId}@placeholder.com`,
              name: 'Student User'
            }
          });
        }
      } catch (e) {
        this.logger.warn(`Could not verify or auto-create user ${dto.userId}: ${e.message}`);
      }

      // 0. Fetch per-topic cognitive state, fallback to global
      let cognitiveState = 'BEGINNER';
      try {
        const normalizedTopic = dto.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
        const topicState = await this.prisma.topicState.findUnique({
          where: { userId_topic: { userId: dto.userId, topic: normalizedTopic } }
        });
        if (topicState?.cognitiveState) {
          cognitiveState = topicState.cognitiveState;
        } else {
          const userRecord = await this.prisma.user.findUnique({ where: { id: dto.userId } });
          if (userRecord?.cognitiveState) cognitiveState = userRecord.cognitiveState;
        }
      } catch (e) {
        this.logger.warn(`Could not fetch cognitiveState for user ${dto.userId}, defaulting to BEGINNER`);
      }

      // Also fetch global state for the difficulty weight mapping
      let globalState = cognitiveState;
      try {
        const userRecord = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (userRecord?.cognitiveState) globalState = userRecord.cognitiveState;
      } catch (_) {}

      const adaptiveNote = cognitiveState === 'ADVANCED'
        ? 'The learner is ADVANCED. Go deep — include edge cases, internals, advanced patterns, and assume strong prior knowledge. Skip basic definitions.'
        : cognitiveState === 'INTERMEDIATE'
        ? 'The learner is INTERMEDIATE. Balance theory and practice. Include worked examples, mention common pitfalls, and assume basic familiarity with the domain.'
        : 'The learner is a BEGINNER. Use simple language, build concepts from the ground up, avoid jargon without explanation, and include plenty of analogies.';

      this.logger.log(`Adaptive engine: user cognitiveState=${cognitiveState} → applying adaptive prompt adjustments`);

      // 1. Generate Syllabus Outline & Cover Theme
      const outlinePrompt = `Act as an expert curriculum designer. The user wants to learn "${dto.topic}" at a "${dto.difficulty}" level.
    ADAPTIVE ENGINE NOTE: ${adaptiveNote}
    Create a syllabus with exactly ${dto.chapters} chapters that is appropriate for a ${cognitiveState} learner.
    Also, act as a professional graphic designer and design a premium card cover theme matching this course.
    Return strictly JSON in this format: 
    { 
      "courseTitle": "String", 
      "coverTheme": {
        "gradStart": "hsl(h, s%, l%)", // dark background gradient start (lightness 12-20%)
        "gradEnd": "hsl(h, s%, l%)",   // dark background gradient end (lightness 5-10%)
        "accent": "#HEX",              // vibrant accent color
        "accent2": "#HEX",             // matching secondary accent color
        "tag": "SHORT TAG",            // 1-3 words topic tag in uppercase
        "icon": "SVG markup"           // Beautiful, detailed raw SVG elements (like path, rect, circle, line, ellipse) that draw the icon inside a 150x120 canvas (with X from 10 to 140, and Y from 10 to 110). Do NOT wrap with parent <svg> or <g> tags.
      },
      "chapters": [{ "title": "String", "searchQuery": "Detailed search query for web facts", "youtubeSearchQuery": "Highly specific query to find a matching educational video for this SPECIFIC chapter title" }] 
    }`;
    
      const outlineCompletion = await this.callGroqWithRetry({
        messages: [{ role: 'user', content: outlinePrompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      const outlineText = outlineCompletion.choices[0]?.message?.content || '{}';
      const outlineData = JSON.parse(outlineText);

      // 2. Generate Course Cover (instantaneous sync call using the coverTheme from LLM)
      const coverImage = this.generateCourseCover(outlineData.courseTitle || dto.topic, outlineData.coverTheme);
      
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
        ADAPTIVE ENGINE NOTE: ${adaptiveNote}
        Use the following scraped web content to enrich your explanation with facts and deep details:\n\n${scrapedContext.substring(0, 15000)}\n\n
        Write a highly detailed, engaging, and comprehensive explanation for this chapter in Markdown format tailored to a ${cognitiveState} learner. Use clear headings, bullet points, and code snippets or examples if applicable. Ensure code snippets are correctly formatted with language identifiers (e.g. \`\`\`javascript).`;
        
        const detailCompletion = await this.callGroqWithRetry({
          messages: [{ role: 'user', content: detailPrompt }],
          model: 'llama-3.1-8b-instant',
          max_tokens: 4096,
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
        const quizQuestionCount = cognitiveState === 'ADVANCED' ? 12 : cognitiveState === 'INTERMEDIATE' ? 8 : 5;
        let learningAidsData = [];
        try {
          const learningAidsPrompt = `Based ONLY on the following chapter content, generate exactly:
- ${quizQuestionCount} multiple choice quiz questions (calibrated for a ${cognitiveState} learner: ${cognitiveState === 'ADVANCED' ? 'make questions challenging, test edge cases and nuanced understanding' : cognitiveState === 'INTERMEDIATE' ? 'mix conceptual and applied questions' : 'keep questions clear and foundational'})
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
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            max_tokens: 4096,
          });
          const aidsText = aidsCompletion.choices[0]?.message?.content || '{}';
          const aidsJson = JSON.parse(aidsText);
          
          // Robust JSON mapping
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
          this.logger.error("Learning Aids generation failed", err.message);
        }

        // Determine per-module difficulty based on topic state
        let moduleDifficultyWeight = globalState === 'ADVANCED' ? 3 : globalState === 'INTERMEDIATE' ? 2 : 1;
        try {
          const normalizedTopic = dto.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
          const topicState = await this.prisma.topicState.findUnique({
            where: { userId_topic: { userId: dto.userId, topic: normalizedTopic } }
          });
          if (topicState) {
            moduleDifficultyWeight = topicState.cognitiveState === 'ADVANCED' ? 3 : topicState.cognitiveState === 'INTERMEDIATE' ? 2 : 1;
          }
        } catch (_) {}

        modulesData.push({
          title: chapter.title,
          content: content,
          youtubeUrl: youtubeUrl,
          orderIndex: orderIndex,
          difficultyWeight: moduleDifficultyWeight,
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

      // Automatically enroll the creator of the course
      await this.prisma.userCourseProgress.create({
        data: {
          userId: dto.userId,
          courseId: course.id,
          isCompleted: false,
          totalTimeSpentSeconds: 0
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
    const course = await this.prisma.course.findUnique({
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
      where: userId ? {
        NOT: {
          userId: userId
        }
      } : undefined,
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

  async getSuggestions(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) throw new Error('Course not found');

    // 1. Fetch user progress to find already enrolled/started courses to exclude them
    const enrolledProgress = await this.prisma.userProgress.findMany({
      where: { userId },
      include: { module: { select: { courseId: true } } }
    });
    const enrolledCourseIds = enrolledProgress.map(ep => ep.module.courseId);
    const excludedCourseIds = Array.from(new Set([courseId, ...enrolledCourseIds]));

    // 2. Fetch all candidates that are not the current course or already enrolled
    const candidateCourses = await this.prisma.course.findMany({
      where: {
        id: { notIn: excludedCourseIds }
      },
      include: {
        _count: { select: { modules: true } }
      }
    });

    // 3. Fetch topic cognitive state or fallback to global cognitive state
    const topicKeyword = course.title.split(' ')[0].toLowerCase();
    const normalizedTopic = course.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let userCognitiveState = 'BEGINNER';
    try {
      const topicState = await this.prisma.topicState.findUnique({
        where: { userId_topic: { userId, topic: normalizedTopic } }
      });
      if (topicState) {
        userCognitiveState = topicState.cognitiveState;
      } else {
        const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
        if (userRecord?.cognitiveState) userCognitiveState = userRecord.cognitiveState;
      }
    } catch (_) {}

    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
    const globalState = userRecord?.cognitiveState || 'BEGINNER';

    // 4. Score candidates in memory for adaptive ranking
    const scoredCandidates = candidateCourses.map(cand => {
      let score = 0;
      const candTitle = cand.title.toLowerCase();
      const isSameTopic = candTitle.includes(topicKeyword);

      if (isSameTopic) {
        score += 100; // Same subject match
        if (cand.targetDifficulty === userCognitiveState) {
          score += 50; // Exact match for level
        } else if (
          (userCognitiveState === 'BEGINNER' && cand.targetDifficulty === 'INTERMEDIATE') ||
          (userCognitiveState === 'INTERMEDIATE' && cand.targetDifficulty === 'ADVANCED')
        ) {
          score += 30; // Progressive difficulty step
        }
      } else {
        if (cand.targetDifficulty === globalState) {
          score += 20; // Matches global cognitive state
        }
      }

      return { cand, score };
    });

    // Sort descending by score, then by createdAt desc
    scoredCandidates.sort((a, b) => b.score - a.score || b.cand.createdAt.getTime() - a.cand.createdAt.getTime());

    return scoredCandidates.slice(0, 5).map(sc => sc.cand);
  }
}

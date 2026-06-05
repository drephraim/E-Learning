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

  private async askLLMForTheme(topic: string): Promise<any> {
    const themePrompt = `You are a professional graphic designer designing a premium course cover card theme.
The course topic is: "${topic}".
Generate a cohesive modern styling theme for this topic. Output ONLY a valid JSON object matching this structure:
{
  "gradStart": "hsl(h, s%, l%)", // a dark background gradient start matching the topic (keep it dark, e.g. lightness 12-20%)
  "gradEnd": "hsl(h, s%, l%)",   // a dark background gradient end matching the topic (keep it dark, e.g. lightness 5-10%)
  "accent": "#HEX",              // a vibrant accent color
  "accent2": "#HEX",             // a matching secondary accent color
  "tag": "SHORT TAG",            // 1-3 words topic tag in uppercase (e.g. "ANCIENT ROME", "QUANTUM PHYSICS")
  "icon": "SVG markup"           // Beautiful, detailed raw SVG elements (like path, rect, circle, line, ellipse) that draw the icon inside a 150x120 canvas (with X from 10 to 140, and Y from 10 to 110). Do NOT wrap with parent <svg> or <g> tags.
}
Do not write any markdown codeblock headers or explanations. Output ONLY the raw JSON.`;

    try {
      this.logger.log(`Querying Groq for custom cover theme for topic: "${topic}"`);
      const completion = await this.callGroqWithRetry({
        messages: [{ role: 'user', content: themePrompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });
      const text = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(text);
      if (parsed.gradStart && parsed.gradEnd && parsed.accent && parsed.accent2 && parsed.tag && parsed.icon) {
        return parsed;
      }
    } catch (err) {
      this.logger.warn(`Groq cover theme generation failed: ${err.message}. Trying Gemini...`);
      try {
        if (process.env.GEMINI_API_KEY) {
          const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: themePrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          });
          const text = result.response.text();
          const parsed = JSON.parse(text);
          if (parsed.gradStart && parsed.gradEnd && parsed.accent && parsed.accent2 && parsed.tag && parsed.icon) {
            return parsed;
          }
        }
      } catch (geminiErr) {
        this.logger.error(`Gemini cover theme generation failed: ${geminiErr.message}`);
      }
    }
    return null;
  }

  private async generateCourseCover(topic: string): Promise<string> {
    try {
      this.logger.log(`Generating custom WOW-factor themed vector cover for: "${topic}"`);
      const customTheme = await this.askLLMForTheme(topic);
      const svg = this.generateProceduralSVG(topic, customTheme);
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
    
    // Default fallback theme (Creative/Other)
    let theme = customTheme || {
      gradStart: 'hsl(330, 50%, 15%)',
      gradEnd: 'hsl(340, 60%, 7%)',
      accent: '#FF5E62',
      accent2: '#FF9966',
      tag: 'ADAPTIVELEARN COURSE',
      icon: `
        <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
          <path d="M 25 85 Q 55 70 85 85 Q 115 70 145 85 L 145 35 Q 115 20 85 35 Q 55 20 25 35 Z" />
          <line x1="85" y1="35" x2="85" y2="85" stroke-dasharray="1 2" />
          <path d="M 85 18 L 85 8 M 80 13 L 90 13" stroke-width="4" />
        </g>
      `
    };

    if (customTheme) {
      // Ensure the custom icon is wrapped in the standard scale/translate group if it's raw elements
      if (theme.icon && !theme.icon.trim().startsWith('<g') && !theme.icon.trim().startsWith('<svg')) {
        theme.icon = `
          <g stroke="url(#accentGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            ${theme.icon}
          </g>
        `;
      }
    } else {

    if (t.includes('html') || t.includes('markup') || t.includes('web design')) {
      theme = {
        gradStart: 'hsl(12, 60%, 18%)',
        gradEnd: 'hsl(14, 75%, 7%)',
        accent: '#FF5722',
        accent2: '#FF9800',
        tag: 'HTML & MARKUP',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <rect x="10" y="15" width="130" height="95" rx="8" stroke-width="4" opacity="0.3" stroke="white" />
            <line x1="10" y1="40" x2="140" y2="40" stroke-width="3" opacity="0.3" stroke="white" />
            <path d="M 45 55 L 25 70 L 45 85" stroke-width="8" />
            <path d="M 65 45 L 85 95" stroke-width="8" />
            <path d="M 105 55 L 125 70 L 105 85" stroke-width="8" />
          </g>
        `
      };
    } else if (t.includes('css') || t.includes('style') || t.includes('tailwind') || t.includes('sass') || t.includes('less') || t.includes('bootstrap') || t.includes('flexbox') || t.includes('grid')) {
      theme = {
        gradStart: 'hsl(205, 70%, 16%)',
        gradEnd: 'hsl(210, 80%, 7%)',
        accent: '#2196F3',
        accent2: '#00BCD4',
        tag: 'CSS & DESIGN',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <rect x="15" y="15" width="120" height="90" rx="8" stroke-width="4" opacity="0.3" stroke="white" />
            <rect x="27" y="27" width="40" height="30" rx="3" stroke-width="3" opacity="0.8" />
            <rect x="77" y="27" width="46" height="66" rx="3" stroke-width="3" opacity="0.8" />
            <rect x="27" y="67" width="40" height="26" rx="3" stroke-width="3" opacity="0.8" />
            <path d="M 125 105 L 105 85 L 115 80 Z" fill="url(#accentGrad)" stroke="none" />
          </g>
        `
      };
    } else if (t.includes('react') || t.includes('next') || t.includes('vue') || t.includes('angular') || t.includes('svelte') || t.includes('jsx')) {
      theme = {
        gradStart: 'hsl(190, 70%, 14%)',
        gradEnd: 'hsl(200, 85%, 6%)',
        accent: '#00D8FF',
        accent2: '#00F5D4',
        tag: 'REACT FRAMEWORK',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <ellipse cx="75" cy="60" rx="65" ry="22" transform="rotate(30, 75, 60)" />
            <ellipse cx="75" cy="60" rx="65" ry="22" transform="rotate(90, 75, 60)" />
            <ellipse cx="75" cy="60" rx="65" ry="22" transform="rotate(150, 75, 60)" />
            <circle cx="75" cy="60" r="10" fill="url(#accentGrad)" stroke="none" />
          </g>
        `
      };
    } else if (t.includes('javascript') || t.includes('js') || t.includes('typescript') || t.includes('ts') || t.includes('node') || t.includes('npm') || t.includes('express')) {
      theme = {
        gradStart: 'hsl(40, 70%, 14%)',
        gradEnd: 'hsl(240, 15%, 7%)',
        accent: '#FFDF00',
        accent2: '#F0DB4F',
        tag: 'JAVASCRIPT ENGINE',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <rect x="15" y="15" width="120" height="90" rx="8" stroke-width="4" opacity="0.3" stroke="white" />
            <path d="M 30 45 L 45 55 L 30 65" stroke-width="8" />
            <line x1="55" y1="65" x2="75" y2="65" stroke-width="8" />
            <path d="M 95 45 L 105 45 L 105 75 C 105 82, 95 82, 90 78" stroke-width="7" />
            <path d="M 120 45 L 120 70 M 115 45 L 125 45" stroke-width="7" opacity="0.5" />
          </g>
        `
      };
    } else if (t.includes('python') || t.includes('django') || t.includes('flask') || t.includes('numpy') || t.includes('pandas') || t.includes('py')) {
      theme = {
        gradStart: 'hsl(207, 60%, 15%)',
        gradEnd: 'hsl(220, 70%, 6%)',
        accent: '#3776AB',
        accent2: '#FFD343',
        tag: 'PYTHON DEVELOPMENT',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <path d="M 75 15 L 115 15 C 130 15, 130 45, 115 45 L 75 45 C 60 45, 60 75, 75 75 L 115 75" />
            <path d="M 75 45 L 35 45 C 20 45, 20 75, 35 75 L 75 75 C 90 75, 90 105, 75 105 L 35 105" opacity="0.7" stroke="url(#accentGrad)" />
            <circle cx="105" cy="30" r="4" fill="url(#accentGrad)" stroke="none" />
            <circle cx="45" cy="90" r="4" fill="url(#accentGrad)" stroke="none" />
          </g>
        `
      };
    } else if (t.includes('sql') || t.includes('database') || t.includes('postgres') || t.includes('mysql') || t.includes('mongodb') || t.includes('sqlite') || t.includes('db') || t.includes('prisma') || t.includes('nosql') || t.includes('redis')) {
      theme = {
        gradStart: 'hsl(260, 50%, 15%)',
        gradEnd: 'hsl(270, 60%, 6%)',
        accent: '#BB86FC',
        accent2: '#03DAC6',
        tag: 'DATABASE SYSTEMS',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <path d="M 25 35 C 25 20, 115 20, 115 35 C 115 50, 25 50, 25 35 Z" />
            <path d="M 25 35 L 25 65 C 25 80, 115 80, 115 65 L 115 35" />
            <path d="M 25 65 L 25 95 C 25 110, 115 110, 115 95 L 115 65" />
            <line x1="45" y1="35" x2="55" y2="35" stroke-width="6" />
            <line x1="45" y1="65" x2="55" y2="65" stroke-width="6" />
            <line x1="45" y1="95" x2="55" y2="95" stroke-width="6" />
          </g>
        `
      };
    } else if (t.includes('ai') || t.includes('intelligence') || t.includes('machine learning') || t.includes('ml') || t.includes('deep learning') || t.includes('neural') || t.includes('gemini') || t.includes('gpt') || t.includes('openai') || t.includes('llm') || t.includes('nlp')) {
      theme = {
        gradStart: 'hsl(285, 60%, 14%)',
        gradEnd: 'hsl(230, 70%, 6%)',
        accent: '#FF2E93',
        accent2: '#8A2387',
        tag: 'INTELLIGENCE ENGINE',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <line x1="20" y1="60" x2="65" y2="25" />
            <line x1="20" y1="60" x2="65" y2="60" />
            <line x1="20" y1="60" x2="65" y2="95" />
            <line x1="65" y1="25" x2="120" y2="40" />
            <line x1="65" y1="60" x2="120" y2="40" />
            <line x1="65" y1="60" x2="120" y2="80" />
            <line x1="65" y1="95" x2="120" y2="80" />
            <circle cx="20" cy="60" r="10" fill="#1b1625" stroke-width="6" />
            <circle cx="65" cy="25" r="10" fill="#1b1625" stroke-width="6" />
            <circle cx="65" cy="60" r="10" fill="#1b1625" stroke-width="6" />
            <circle cx="65" cy="95" r="10" fill="#1b1625" stroke-width="6" />
            <circle cx="120" cy="40" r="10" fill="#1b1625" stroke-width="6" />
            <circle cx="120" cy="80" r="10" fill="#1b1625" stroke-width="6" />
          </g>
        `
      };
    } else if (t.includes('science') || t.includes('math') || t.includes('calculus') || t.includes('algebra') || t.includes('physics') || t.includes('biology') || t.includes('chemistry') || t.includes('lab')) {
      theme = {
        gradStart: 'hsl(160, 50%, 14%)',
        gradEnd: 'hsl(170, 60%, 6%)',
        accent: '#00F5D4',
        accent2: '#00B09B',
        tag: 'SCIENCE & MATH',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <path d="M 45 30 L 60 65 L 60 100 L 90 100 L 90 65 L 105 30 Z" />
            <line x1="53" y1="48" x2="97" y2="48" stroke-width="4" opacity="0.5" />
            <path d="M 50 85 L 100 85" stroke-dasharray="2 2" stroke-width="5" />
            <circle cx="68" cy="75" r="4" fill="url(#accentGrad)" stroke="none" />
            <circle cx="82" cy="80" r="3" fill="url(#accentGrad)" stroke="none" />
          </g>
        `
      };
    } else if (t.includes('business') || t.includes('finance') || t.includes('marketing') || t.includes('economics') || t.includes('money') || t.includes('startup') || t.includes('sales')) {
      theme = {
        gradStart: 'hsl(140, 40%, 14%)',
        gradEnd: 'hsl(150, 50%, 6%)',
        accent: '#FFD700',
        accent2: '#11998E',
        tag: 'BUSINESS & FINANCE',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <path d="M 25 95 L 125 95 M 25 95 L 25 25" stroke-width="4" opacity="0.5" />
            <rect x="35" y="65" width="18" height="30" rx="3" stroke-width="5" />
            <rect x="65" y="45" width="18" height="50" rx="3" stroke-width="5" />
            <rect x="95" y="30" width="18" height="65" rx="3" stroke-width="5" />
            <path d="M 30 55 L 60 35 L 90 20 L 120 15" stroke-width="6" />
            <path d="M 105 15 L 120 15 L 120 30" stroke-width="6" />
          </g>
        `
      };
    } else if (t.includes('code') || t.includes('coding') || t.includes('program') || t.includes('software') || t.includes('developer') || t.includes('computer') || t.includes('algorithm') || t.includes('git') || t.includes('docker') || t.includes('cloud') || t.includes('cyber')) {
      theme = {
        gradStart: 'hsl(215, 50%, 14%)',
        gradEnd: 'hsl(220, 70%, 5%)',
        accent: '#00FFCC',
        accent2: '#0099FF',
        tag: 'COMPUTER SCIENCE',
        icon: `
          <g stroke="url(#accentGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(520, 140) scale(1.7)">
            <rect x="15" y="20" width="110" height="80" rx="8" stroke-width="4" opacity="0.3" stroke="white" />
            <path d="M 35 50 L 50 60 L 35 70" stroke-width="8" />
            <line x1="60" y1="70" x2="85" y2="70" stroke-width="8" />
            <text x="95" y="45" fill="url(#accentGrad)" font-size="16" font-family="monospace" font-weight="bold" stroke="none">1</text>
            <text x="105" y="75" fill="url(#accentGrad)" font-size="16" font-family="monospace" font-weight="bold" stroke="none" opacity="0.6">0</text>
          </g>
        `
      };
    }
  }

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

      // 1. Generate Syllabus Outline
      const outlinePrompt = `Act as an expert curriculum designer. The user wants to learn "${dto.topic}" at a "${dto.difficulty}" level.
    ADAPTIVE ENGINE NOTE: ${adaptiveNote}
    Create a syllabus with exactly ${dto.chapters} chapters that is appropriate for a ${cognitiveState} learner.
    Return strictly JSON in this format: 
    { "courseTitle": "String", "chapters": [{ "title": "String", "searchQuery": "Detailed search query for web facts", "youtubeSearchQuery": "Highly specific query to find a matching educational video for this SPECIFIC chapter title" }] }`;
    
      const outlineCompletion = await this.callGroqWithRetry({
        messages: [{ role: 'user', content: outlinePrompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      const outlineText = outlineCompletion.choices[0]?.message?.content || '{}';
      const outlineData = JSON.parse(outlineText);

      // 2. Generate Course Cover (using the generated courseTitle for specific themed icons/colors)
      const coverImage = await this.generateCourseCover(outlineData.courseTitle || dto.topic);
      
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

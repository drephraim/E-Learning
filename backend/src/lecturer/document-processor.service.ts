import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ExtractedDocument {
  rawText: string;
  cleanedText: string;
  wordCount: number;
}

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  sectionTitle?: string;
  pageNumber?: number;
  tokenCount: number;
}

export interface ParsedSyllabusStructure {
  objectives: string[];
  outcomes: string[];
  topics: Array<{ title: string; description?: string; weekNumber?: number }>;
  readings: Array<{ citation: string; title?: string; author?: string; year?: string }>;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  async extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<ExtractedDocument> {
    this.logger.log(`Extracting text from file ${fileName} (${mimeType}, ${buffer.length} bytes)...`);

    let rawText = '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      if (mimeType === 'application/pdf' || ext === 'pdf') {
        // Strategy 1: Modern PDFParse class
        try {
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          const textRes = await parser.getText();
          rawText = textRes.text || '';
          await parser.destroy();
        } catch (pdfErr: any) {
          this.logger.warn(`Strategy 1 (PDFParse class) failed for ${fileName}: ${pdfErr.message}`);
        }

        // Strategy 2: Legacy pdf-parse function export fallback
        if (!rawText || !rawText.trim()) {
          try {
            const pdfLegacy = require('pdf-parse');
            if (typeof pdfLegacy === 'function') {
              const legacyRes = await pdfLegacy(buffer);
              if (legacyRes && legacyRes.text) {
                rawText = legacyRes.text;
              }
            }
          } catch (legacyErr: any) {
            this.logger.warn(`Strategy 2 (legacy pdf-parse) failed for ${fileName}: ${legacyErr.message}`);
          }
        }

        // Strategy 3: Binary string stream extraction (for un-indexed PDF streams)
        if (!rawText || !rawText.trim()) {
          try {
            const str = buffer.toString('binary');
            const textMatches = str.match(/\(([^\)]+)\)\s*Tj/g) || str.match(/BT[\s\S]*?ET/g);
            if (textMatches && textMatches.length > 0) {
              rawText = textMatches
                .map((m) => m.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\(([^\)]+)\)/, '$1'))
                .join(' ')
                .trim();
            }
          } catch (binErr: any) {
            this.logger.warn(`Strategy 3 (binary stream) failed for ${fileName}: ${binErr.message}`);
          }
        }

        // Strategy 4: Fallback for Scanned / Image PDFs without embedded text layers
        if (!rawText || !rawText.trim()) {
          this.logger.warn(`No embedded text layer found in PDF ${fileName}. Generating structured document placeholder...`);
          rawText = `[Academic Material Document: ${fileName}]\n\n` +
            `Course Material Reference: ${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}\n\n` +
            `Note: This PDF appears to be a scanned image document or contains raster graphics without an embedded vector text layer. ` +
            `The document record has been created and indexed for institutional course reference. ` +
            `You can edit or paste the full transcript using the 'Edit / Paste Document Text' tool.`;
        }

      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        ext === 'docx' || ext === 'doc'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || '';
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        mimeType === 'application/vnd.ms-powerpoint' ||
        ext === 'pptx' || ext === 'ppt'
      ) {
        try {
          const JSZip = require('jszip');
          const zip = await JSZip.loadAsync(buffer);
          const slideFiles: Array<{ relativePath: string; file: any; slideNum: number }> = [];

          zip.forEach((relativePath: string, file: any) => {
            if (relativePath.match(/^ppt\/slides\/slide[0-9]+\.xml$/i)) {
              const numMatch = relativePath.match(/slide([0-9]+)\.xml$/i);
              const slideNum = numMatch ? parseInt(numMatch[1], 10) : 999;
              slideFiles.push({ relativePath, file, slideNum });
            }
          });

          slideFiles.sort((a, b) => a.slideNum - b.slideNum);

          const slideTexts: string[] = [];
          for (const item of slideFiles) {
            const xmlText = await item.file.async('text');
            const shapes = xmlText.match(/<p:sp>[\s\S]*?<\/p:sp>/gs) || [];

            let slideTitle = '';
            const bodyLines: string[] = [];

            for (const spXml of shapes) {
              // Filter out slide number, footer, or date placeholder shapes
              const isHeaderFooterOrNum = spXml.includes('type="sldNum"') ||
                                         spXml.includes('type="ftr"') ||
                                         spXml.includes('type="dt"') ||
                                         spXml.includes('type="slidenum"');
              if (isHeaderFooterOrNum) continue;

              const paragraphs = spXml.match(/<a:p[^>]*>[\s\S]*?<\/a:p>/gs) || [];
              const shapeTextLines: string[] = [];

              for (const pXml of paragraphs) {
                const tMatches = pXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs) || [];
                const lineText = tMatches
                  .map((m: string) => 
                    m.replace(/<[^>]+>/g, '')
                     .replace(/&amp;/g, '&')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&quot;/g, '"')
                     .replace(/&#39;/g, "'")
                     .trim()
                  )
                  .filter((t: string) => t.length > 0)
                  .join(' ');

                if (lineText) {
                  shapeTextLines.push(lineText);
                }
              }

              if (shapeTextLines.length === 0) continue;

              const isTitleShape = spXml.includes('type="title"') || spXml.includes('type="ctrTitle"');

              if (isTitleShape && !slideTitle) {
                slideTitle = shapeTextLines.join(' ');
              } else {
                for (const line of shapeTextLines) {
                  if (/^\d{1,3}$/.test(line) && line === String(item.slideNum)) continue;
                  bodyLines.push(line);
                }
              }
            }

            if (!slideTitle && bodyLines.length > 0) {
              slideTitle = bodyLines.shift() || '';
            }

            const slideContent: string[] = [];
            slideContent.push(`## 📌 Slide ${item.slideNum}: ${slideTitle || 'Untitled Slide'}`);

            if (bodyLines.length > 0) {
              for (const bLine of bodyLines) {
                slideContent.push(`• ${bLine}`);
              }
            }

            slideTexts.push(slideContent.join('\n'));
          }

          rawText = slideTexts.join('\n\n---\n\n');

          if (!rawText || !rawText.trim()) {
            this.logger.warn(`No text found in slide XML for ${fileName}. Generating presentation deck placeholder...`);
            rawText = `[Presentation Deck: ${fileName}]\n\n` +
              `Presentation Topic: ${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}\n\n` +
              `Note: PowerPoint presentation deck indexed for institutional course reference. ` +
              `You can edit or paste detailed transcript notes using the 'Edit / Paste Document Text' tool.`;
          }
        } catch (pptxErr: any) {
          this.logger.warn(`JSZip PPTX extraction failed for ${fileName}: ${pptxErr.message}`);
          rawText = `[Presentation Deck: ${fileName}]\n\n` +
            `Presentation Topic: ${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}\n\n` +
            `Note: PowerPoint presentation deck indexed for institutional course reference.`;
        }
      } else if (mimeType.startsWith('text/') || ext === 'txt' || ext === 'md') {
        rawText = buffer.toString('utf-8');
      } else {
        throw new BadRequestException(`Unsupported file format '${ext}'. Allowed formats: PDF, DOCX, PPTX, TXT.`);
      }
    } catch (err: any) {
      this.logger.error(`Document text extraction failed for ${fileName}: ${err.message}`);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Failed to extract text from document '${fileName}': ${err.message}`);
    }

    const cleanedText = this.cleanText(rawText);
    const wordCount = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;

    return {
      rawText,
      cleanedText,
      wordCount,
    };
  }

  cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // remove non-printable control chars
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  createChunks(cleanedText: string, maxChunkLength = 800, overlap = 100): DocumentChunk[] {
    if (!cleanedText) return [];

    const paragraphs = cleanedText.split(/\n\n+/);
    const chunks: DocumentChunk[] = [];
    let currentChunkText = '';
    let currentSectionTitle: string | undefined = undefined;
    let chunkIndex = 0;

    const headingRegex = /^([#=]+\s*|[0-9]+\.\s+|[A-Z\s]{4,}:?\s*$)/;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      // Check if line looks like a heading
      const firstLine = trimmedPara.split('\n')[0].trim();
      if (headingRegex.test(firstLine) || (firstLine.length < 60 && firstLine === firstLine.toUpperCase())) {
        currentSectionTitle = firstLine.replace(/^[#=\s]+/, '').trim();
      }

      if (currentChunkText.length + trimmedPara.length > maxChunkLength && currentChunkText.length > 0) {
        chunks.push({
          content: currentChunkText.trim(),
          chunkIndex: chunkIndex++,
          sectionTitle: currentSectionTitle,
          tokenCount: Math.ceil(currentChunkText.trim().length / 4),
        });

        // Retain overlap from end of current chunk
        const words = currentChunkText.trim().split(/\s+/);
        const overlapWords = words.slice(-Math.min(words.length, Math.floor(overlap / 6))).join(' ');
        currentChunkText = overlapWords + '\n\n' + trimmedPara;
      } else {
        currentChunkText = currentChunkText ? `${currentChunkText}\n\n${trimmedPara}` : trimmedPara;
      }
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push({
        content: currentChunkText.trim(),
        chunkIndex: chunkIndex++,
        sectionTitle: currentSectionTitle,
        tokenCount: Math.ceil(currentChunkText.trim().length / 4),
      });
    }

    return chunks;
  }

  parseSyllabusStructure(cleanedText: string): ParsedSyllabusStructure {
    const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);
    const objectives: string[] = [];
    const outcomes: string[] = [];
    const topics: Array<{ title: string; description?: string; weekNumber?: number }> = [];
    const readings: Array<{ citation: string; title?: string; author?: string; year?: string }> = [];

    let currentSection: 'NONE' | 'OBJECTIVES' | 'OUTCOMES' | 'TOPICS' | 'READINGS' = 'NONE';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Detect Section Headers
      if (/course\s+objectives?|objectives?|aims?/i.test(lower) && lower.length < 50) {
        currentSection = 'OBJECTIVES';
        continue;
      }
      if (/learning\s+outcomes?|intended\s+outcomes?|competencies/i.test(lower) && lower.length < 50) {
        currentSection = 'OUTCOMES';
        continue;
      }
      if (/weekly\s+topics?|course\s+schedule|syllabus\s+outline|topics|course\s+content|schedule/i.test(lower) && lower.length < 50) {
        currentSection = 'TOPICS';
        continue;
      }
      if (/recommended\s+readings?|required\s+readings?|textbooks?|references/i.test(lower) && lower.length < 50) {
        currentSection = 'READINGS';
        continue;
      }

      // Process content by current section
      const itemText = line.replace(/^[•\-\*\d+\.\)]\s*/, '').trim();
      if (!itemText) continue;

      if (currentSection === 'OBJECTIVES') {
        if (itemText.length > 5) objectives.push(itemText);
      } else if (currentSection === 'OUTCOMES') {
        if (itemText.length > 5) outcomes.push(itemText);
      } else if (currentSection === 'TOPICS') {
        const weekMatch = line.match(/week\s*([0-9]+)/i);
        const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : undefined;
        topics.push({
          title: itemText,
          weekNumber: weekNum,
          description: lines[i + 1] && !/week\s*[0-9]+/i.test(lines[i + 1]) ? lines[i + 1] : undefined,
        });
      } else if (currentSection === 'READINGS') {
        if (itemText.length > 5) {
          readings.push({
            citation: itemText,
            title: itemText,
          });
        }
      }
    }

    return {
      objectives,
      outcomes,
      topics,
      readings,
    };
  }
}

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function generateProceduralSVG(topic, customTheme) {
  const t = topic.toLowerCase();
  
  const hash = crypto.createHash('md5').update(topic).digest('hex');
  const h = parseInt(hash.substring(0, 2), 16) % 360;
  const s = 45 + (parseInt(hash.substring(2, 4), 16) % 15); // 45-60%
  const l1 = 11 + (parseInt(hash.substring(4, 6), 16) % 5);  // 11-15%
  const l2 = 5 + (parseInt(hash.substring(6, 8), 16) % 4);   // 5-8%
  
  const h2 = (h + 40 + (parseInt(hash.substring(8, 10), 16) % 50)) % 360;
  const accent1 = `accent1: hsl(${h}, 85%, 60%)`; // Placeholder variables not strictly needed since we put HSL in template below:
  const accentColor1 = `hsl(${h}, 85%, 60%)`;
  const accentColor2 = `hsl(${h2}, 85%, 60%)`;

  // Default fallback gradients/colors (Creative/Other)
  let theme = {
    gradStart: customTheme?.gradStart || `hsl(${h}, ${s}%, ${l1}%)`,
    gradEnd: customTheme?.gradEnd || `hsl(${h}, ${s}%, ${l2}%)`,
    accent: customTheme?.accent || accentColor1,
    accent2: customTheme?.accent2 || accentColor2,
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
  const wrapTitleText = (text) => {
    const words = text.split(/\s+/);
    const lines = [];
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

  const escapeXml = (unsafe) => {
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
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

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function main() {
  console.log('Fetching all courses to regenerate covers...');
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses to process.`);

  let successCount = 0;
  for (const course of courses) {
    try {
      const coverImage = generateProceduralSVG(course.title);
      await prisma.course.update({
        where: { id: course.id },
        data: { coverImage }
      });
      console.log(`Updated cover for course: "${course.title}" (${course.id})`);
      successCount++;
    } catch (err) {
      console.error(`Failed to update cover for course: "${course.title}" (${course.id}): ${err.message}`);
    }
  }

  console.log(`Successfully updated ${successCount}/${courses.length} course thumbnails.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

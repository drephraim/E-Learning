import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';

const LANG_CONFIG = {
  javascript: { label: 'JavaScript', mode: 'js' },
  html: { label: 'HTML', mode: 'html' },
  css: { label: 'CSS', mode: 'css' },
  python: { label: 'Python', mode: 'python', note: 'Python runs in a simulated environment (limited)' },
  php: { label: 'PHP', mode: 'php', note: 'PHP runs in a simulated environment (limited)' },
  ini: { label: 'INI Config', mode: 'ini', note: 'Configuration (simulated)' },
};

export default function CodeRunner({ code = '', language = 'javascript' }) {
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);
  const pyRef = useRef(null);

  const langConfig = LANG_CONFIG[language] || LANG_CONFIG.javascript;

  // Reset output when code or language changes
  useEffect(() => {
    setOutput(null);
    setError(null);
  }, [code, language]);

  const runCode = () => {
    setError(null);
    setOutput(null);

    if (langConfig.mode === 'html') {
      runHtml();
    } else if (langConfig.mode === 'css') {
      runCss();
    } else if (langConfig.mode === 'python') {
      runPython();
    } else if (langConfig.mode === 'php') {
      runPhp();
    } else if (langConfig.mode === 'ini') {
      runIni();
    } else {
      runJavaScript();
    }
  };

  const runJavaScript = () => {
    try {
      const logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
        error: (...args) => logs.push('Error: ' + args.map(a => String(a)).join(' ')),
        warn: (...args) => logs.push('Warning: ' + args.map(a => String(a)).join(' ')),
      };

      const mockOpcache = new Proxy({}, {
        get: (target, prop) => {
          if (prop === 'memory_consumption') return 256;
          return () => {};
        },
        set: () => true
      });

      // Sandboxed execution using Function constructor
      const fn = new Function('console', 'opcache', '"use strict"; ' + code);
      fn(customConsole, mockOpcache);

      setOutput(logs.length > 0 ? logs.join('\n') : '(no output)');
    } catch (err) {
      setError(err.message);
    }
  };

  const runHtml = () => {
    setOutput({ type: 'html', content: code });
  };

  const runCss = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <style>${code}</style>
</head>
<body>
  <div style="padding:20px; font-family:sans-serif; color:#e2e8f0;">
    <h3 style="margin-bottom:12px;">CSS Preview</h3>
    <div class="preview-box">This box shows your CSS styles.</div>
    <button class="preview-btn">Preview Button</button>
    <p class="preview-text">Preview text with your styles.</p>
  </div>
</body>
</html>`;
    setOutput({ type: 'html', content: html });
  };

  const runPython = () => {
    // Simple Python-like simulation for basic constructs
    try {
      const logs = [];
      let pyCode = code;

      // Handle print() statements
      pyCode = pyCode.replace(/print\s*\(([^)]*)\)/g, (match, content) => {
        const val = content.trim();
        logs.push(val.replace(/^["']|["']$/g, ''));
        return '';
      });

      // Handle basic variable assignment
      pyCode = pyCode.replace(/(\w+)\s*=\s*([^\n]+)/g, (match, varName, value) => {
        return `window.__py_${varName} = ${value};`;
      });

      // Handle for loops (basic range)
      pyCode = pyCode.replace(/for\s+(\w+)\s+in\s+range\((\d+)\):/g, (match, varName, count) => {
        return `for(let ${varName}=0; ${varName}<${count}; ${varName}++) {`;
      });

      // Close for loop blocks
      let braceCount = 0;
      const lines = pyCode.split('\n');
      const jsLines = lines.map(line => {
        if (line.trim().startsWith('for') || line.trim().startsWith('if') || line.trim().startsWith('while')) {
          braceCount++;
          return line;
        }
        if (line.trim() === '' || line.trim().startsWith('#')) return line;
        if (braceCount > 0 && !line.startsWith('  ') && !line.startsWith('\t')) {
          return '}'.repeat(braceCount) + '\n' + line;
        }
        return line;
      });

      const fn = new Function('console', '"use strict"; ' + jsLines.join('\n'));
      fn({
        log: (...args) => logs.push(args.map(a => String(a)).join(' ')),
      });

      setOutput(logs.length > 0 ? logs.join('\n') : '(no output)');
    } catch (err) {
      setError('Python simulation: ' + err.message);
    }
  };

  const runPhp = () => {
    try {
      const logs = [];
      let phpCode = code.trim();

      // Remove PHP tags
      phpCode = phpCode.replace(/^<\?php/i, '').replace(/\?>$/i, '').trim();

      // Mock PHP environment variables and functions
      const mockEnv = {
        opcache: new Proxy({
          enable: 1,
          enable_cli: 1,
          memory_consumption: 256,
          max_accelerated_files: 50000,
          validate_timestamps: 0,
          interned_strings_buffer: 8
        }, {
          get: (target, prop) => {
            return target[prop] !== undefined ? target[prop] : 256;
          },
          set: (target, prop, val) => {
            target[prop] = val;
            return true;
          }
        }),
        opcache_get_status: () => ({
          opcache_enabled: true,
          cache_full: false,
          restart_pending: false,
          restart_in_progress: false,
          memory_usage: {
            used_memory: 18451000,
            free_memory: 231450000,
            wasted_memory: 0,
            current_wasted_percentage: 0
          },
          opcache_statistics: {
            num_cached_keys: 124,
            num_cached_scripts: 84,
            max_cached_keys: 16229,
            hits: 1452,
            misses: 48,
            opcache_hit_rate: 96.8
          }
        }),
        opcache_invalidate: () => true,
        opcache_compile_file: () => true,
        opcache_reset: () => true,
        opcache_is_script_cached: () => true,
        ini_get: (name) => {
          if (name === 'opcache.memory_consumption') return '256';
          return '1';
        },
        ini_set: () => true,
      };

      // Simple translator of PHP to JS
      let jsCode = phpCode;

      // Translate PHP concatenation . into JS +
      jsCode = jsCode.replace(/(['"]\s*)\.(\s*\$?\w+)/g, '$1+ $2');
      jsCode = jsCode.replace(/(\$?\w+\s*)\.(\s*['"])/g, '$1 +$2');
      jsCode = jsCode.replace(/(['"]\s*)\.(\s*['"])/g, '$1 + $2');
      jsCode = jsCode.replace(/(\$?\w+\s*)\.(\s*\$?\w+)/g, '$1 + $2');

      // Replace echo statements: echo expr;
      jsCode = jsCode.replace(/echo\s+([^;]+);/g, (match, expr) => {
        let cleanExpr = expr.replace(/\$(\w+)/g, '$1');
        return `console.log(${cleanExpr});`;
      });

      // Remove $ prefix from all variables to make them valid JS identifiers
      jsCode = jsCode.replace(/\$(\w+)/g, '$1');

      // Prepare execution arguments
      const paramNames = Object.keys(mockEnv).concat(['console']);
      const paramVals = Object.values(mockEnv).concat([{
        log: (...args) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
        error: (...args) => logs.push('Error: ' + args.map(a => String(a)).join(' ')),
        warn: (...args) => logs.push('Warning: ' + args.map(a => String(a)).join(' ')),
      }]);

      const fn = new Function(...paramNames, jsCode);
      fn(...paramVals);

      setOutput(logs.length > 0 ? logs.join('\n') : '(no output)');
    } catch (err) {
      setError('PHP simulation: ' + err.message);
    }
  };

  const runIni = () => {
    try {
      const lines = code.split('\n');
      const settings = [];
      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) {
          continue;
        }
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim();
          settings.push(`${key}: ${value}`);
        }
      }
      setOutput(settings.length > 0 
        ? `INI Configuration parsed successfully:\n\n${settings.join('\n')}`
        : 'Configuration loaded (no active settings found).'
      );
    } catch (err) {
      setError('INI parsing error: ' + err.message);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--bg-elevated)',
      marginTop: 12,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: 'var(--orange)',
          }}>{langConfig.label}</span>
          {langConfig.note && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{langConfig.note}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={copyCode}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 4,
              background: copied ? 'rgba(74,232,160,0.1)' : 'transparent',
              border: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={runCode}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 12px', borderRadius: 4,
              background: 'var(--orange)', color: 'var(--bg)',
              border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
            }}
          >
            <Play size={12} /> Run
          </button>
        </div>
      </div>

      {/* Code display */}
      <div style={{
        padding: 16,
        background: 'var(--bg-card)',
        fontFamily: '"Fira Code", Consolas, monospace',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        whiteSpace: 'pre',
        overflowX: 'auto',
        color: 'var(--text)',
      }}>{code}</div>

      {/* Output */}
      {output && output.type === 'html' && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{
            padding: '6px 12px', background: 'var(--bg-card)',
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--orange)',
            borderBottom: '1px solid var(--border)',
          }}>Preview</div>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            srcDoc={output.content}
            style={{ width: '100%', height: 200, border: 'none', background: 'white' }}
            title="Code Preview"
          />
        </div>
      )}

      {output && output.type !== 'html' && (
        <div style={{
          padding: 12,
          borderTop: '1px solid var(--border)',
          fontFamily: '"Fira Code", Consolas, monospace',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
          color: 'var(--text)',
          background: 'var(--bg-card)',
          maxHeight: 200,
          overflowY: 'auto',
        }}>{output}</div>
      )}

      {error && (
        <div style={{
          padding: 12,
          borderTop: '1px solid rgba(239,68,68,0.2)',
          fontSize: '0.8rem',
          color: '#f87171',
          background: 'rgba(239,68,68,0.05)',
        }}>Error: {error}</div>
      )}
    </div>
  );
}

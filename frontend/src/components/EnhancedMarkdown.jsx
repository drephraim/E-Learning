import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeRunner from '../CodeRunner';

/**
 * Preprocesses raw markdown string to fix squished table rows (e.g. "||" or "| |")
 * produced by AI models or database strings into valid multi-line GFM Markdown Tables.
 */
export function preprocessMarkdown(content) {
  if (!content) return '';
  let text = String(content);

  // 0. Convert literal "\\n" strings to actual newline characters
  text = text.replace(/\\n/g, '\n');

  // 1. Convert squished double pipes (||) or "| |" into newlines: "||" -> "|\n| "
  text = text.replace(/\|\s*\|\s*/g, '|\n| ');

  // 2. Fix table headers merged onto one line with separator line:
  // e.g. "| Col 1 | Col 2 | | --- | --- |" -> "\n| Col 1 | Col 2 |\n| --- | --- |\n"
  text = text.replace(/([^\n])\s*(\|(?:[\s-]*:?---+:?[\s-]*\|)+)/g, '$1\n$2');
  text = text.replace(/(\|(?:[\s-]*:?---+:?[\s-]*\|)+)\s*([^\n])/g, '$1\n$2');

  // 3. Ensure table rows starting with pipe have newlines before them if glued to plain text
  text = text.replace(/([^\n])\s*(\|[^\n|]+\|[^\n]*\|)/g, (match, p1, p2) => {
    if (p2.includes('|')) return `${p1}\n${p2}`;
    return match;
  });

  // 4. Ensure headings (##, ###) have clean double newlines before them
  text = text.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');

  return text;
}

export default function EnhancedMarkdown({ content, style = {} }) {
  const cleanedText = preprocessMarkdown(content);

  return (
    <div className="enhanced-markdown-container" style={{ lineHeight: 1.8, color: '#e2e8f0', ...style }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table({ node, children, ...props }) {
            return (
              <div 
                className="custom-table-wrapper"
                style={{ 
                  overflowX: 'auto', 
                  margin: '1.75rem 0', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(56, 189, 248, 0.25)', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', 
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <table 
                  style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    textAlign: 'left', 
                    fontSize: '0.94rem',
                    color: '#f1f5f9'
                  }} 
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, children, ...props }) {
            return (
              <thead 
                style={{ 
                  background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))', 
                  color: '#38bdf8', 
                  fontWeight: 700, 
                  letterSpacing: '0.03em',
                  borderBottom: '2px solid rgba(56, 189, 248, 0.3)' 
                }} 
                {...props}
              >
                {children}
              </thead>
            );
          },
          th({ node, children, ...props }) {
            return (
              <th 
                style={{ 
                  padding: '14px 18px', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 700
                }} 
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ node, children, ...props }) {
            return (
              <td 
                style={{ 
                  padding: '12px 18px', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
                  color: '#e2e8f0',
                  lineHeight: 1.6
                }} 
                {...props}
              >
                {children}
              </td>
            );
          },
          tr({ node, children, ...props }) {
            return (
              <tr 
                style={{ 
                  transition: 'background 0.2s ease',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                }} 
                {...props}
              >
                {children}
              </tr>
            );
          },
          blockquote({ node, children, ...props }) {
            return (
              <blockquote 
                style={{ 
                  margin: '1.5rem 0', 
                  padding: '1rem 1.4rem', 
                  borderRadius: '10px', 
                  borderLeft: '4px solid #38bdf8', 
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.09), rgba(99, 102, 241, 0.05))', 
                  color: '#f8fafc',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                  fontSize: '0.98rem'
                }} 
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (lang || codeString.includes('\n'))) {
              return <CodeRunner code={codeString} language={lang || 'javascript'} />;
            }
            return (
              <code 
                className={className} 
                style={{ 
                  background: 'rgba(51, 65, 85, 0.6)', 
                  color: '#38bdf8',
                  padding: '2px 7px', 
                  borderRadius: 6, 
                  fontSize: '0.88em', 
                  fontFamily: '"Fira Code", Consolas, Monaco, monospace',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }} 
                {...props}
              >
                {children}
              </code>
            );
          },
          h1({ node, children, ...props }) {
            return (
              <h1 
                style={{ 
                  fontSize: '1.6rem', 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  marginTop: '2rem',
                  marginBottom: '1rem'
                }} 
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            return (
              <h2 
                style={{ 
                  fontSize: '1.35rem', 
                  fontWeight: 700, 
                  color: '#f8fafc', 
                  borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                  paddingBottom: '6px',
                  marginTop: '1.75rem',
                  marginBottom: '0.85rem'
                }} 
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            return (
              <h3 
                style={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 700, 
                  color: '#38bdf8', 
                  marginTop: '1.5rem',
                  marginBottom: '0.65rem'
                }} 
                {...props}
              >
                {children}
              </h3>
            );
          },
          ul({ node, children, ...props }) {
            return (
              <ul style={{ paddingLeft: '22px', margin: '0.85rem 0', color: '#e2e8f0' }} {...props}>
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol style={{ paddingLeft: '22px', margin: '0.85rem 0', color: '#e2e8f0' }} {...props}>
                {children}
              </ol>
            );
          },
          li({ node, children, ...props }) {
            return (
              <li style={{ marginBottom: '6px', lineHeight: 1.7 }} {...props}>
                {children}
              </li>
            );
          }
        }}
      >
        {cleanedText}
      </ReactMarkdown>
    </div>
  );
}

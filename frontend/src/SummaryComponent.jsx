import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeRunner from './CodeRunner';

export default function SummaryComponent({ summary }) {
  if (!summary) return null;

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 style={{ marginBottom: 20, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>Chapter Summary</h2>
      <div
        className="markdown-content"
        style={{
          padding: 24,
          background: 'var(--bg-card)',
          borderLeft: '3px solid var(--orange)',
          borderRadius: '0 10px 10px 0',
          lineHeight: 1.7,
          fontSize: '0.95rem',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>💡</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline && lang) {
                    return <CodeRunner code={codeString} language={lang} />;
                  }
                  return <code className={className} style={{
                    background: 'var(--bg-elevated)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.9em',
                    fontFamily: '"Fira Code", Consolas, monospace',
                  }} {...props}>{children}</code>;
                }
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

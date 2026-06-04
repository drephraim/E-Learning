import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeRunner from './CodeRunner';

const TaskItem = ({ task, idx, isDone, onToggle }) => {
  const [revealed, setRevealed] = useState(false);
  const hasAnswer = task.answer && task.answer.trim().length > 0;

  const renderAnswer = (text) => {
    if (!text || typeof text !== 'string') return null;
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && lang) {
              return <CodeRunner code={codeString} language={lang} />;
            }
            return (
              <code
                className={className}
                style={{
                  background: 'var(--bg-elevated)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: '0.9em',
                  fontFamily: '"Fira Code", Consolas, monospace'
                }}
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div
      style={{
        padding: 20,
        background: isDone ? 'rgba(74,232,160,0.05)' : 'var(--bg-card)',
        border: isDone ? '1px solid rgba(74,232,160,0.2)' : '1px solid var(--border)',
        borderRadius: 10,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        transition: 'all 0.15s ease',
      }}
    >
      <div
        onClick={() => onToggle(idx)}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: isDone ? 'none' : '2px solid var(--text-muted)',
          background: isDone ? 'var(--green)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
          cursor: 'pointer',
        }}
      >
        {isDone && <Check size={13} color="var(--bg)" strokeWidth={3} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 8,
          color: isDone ? 'var(--green)' : 'var(--text)',
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.7 : 1,
        }}>
          {task.title}
        </h3>

        <p style={{
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          fontSize: '0.9rem',
          marginBottom: hasAnswer ? 12 : 0,
        }}>{task.description}</p>

        {hasAnswer && (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: revealed ? 'var(--bg-elevated)' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {revealed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {revealed ? 'Hide Solution' : 'View Solution'}
            </button>

            {revealed && (
              <div style={{
                marginTop: 12,
                padding: 16,
                background: 'var(--bg-elevated)',
                borderLeft: '3px solid var(--orange)',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--text)',
              }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: 'var(--orange)',
                  marginBottom: 8,
                }}>Solution</div>
                <div style={{ overflowX: 'auto' }}>
                  {renderAnswer(task.answer)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function TaskComponent({ tasks, userProgress, onSave }) {
  const [completed, setCompleted] = useState(userProgress?.metadata?.completedTasks || {});

  useEffect(() => {
    if (userProgress?.metadata?.completedTasks) {
      setCompleted(userProgress.metadata.completedTasks);
    }
  }, [userProgress]);

  if (!tasks || tasks.length === 0) return null;

  const toggleTask = (idx) => {
    const newCompleted = { ...completed, [idx]: !completed[idx] };
    setCompleted(newCompleted);

    if (onSave) {
      const allDone = tasks.length > 0 && tasks.every((_, i) => newCompleted[i]);
      onSave({
        metadata: { ...userProgress?.metadata, completedTasks: newCompleted },
        status: allDone ? 'COMPLETED' : 'IN_PROGRESS'
      });
    }
  };

  const doneCount = Object.keys(completed).filter(k => completed[k]).length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>Practical Tasks</h2>
        <span style={{
          color: progress === 100 ? 'var(--green)' : 'var(--orange)',
          fontWeight: 700,
          fontSize: '0.9rem',
        }}>{progress}%</span>
      </div>

      <div style={{
        width: '100%',
        height: 4,
        background: 'var(--bg-elevated)',
        borderRadius: 99,
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: progress === 100 ? 'var(--green)' : 'var(--orange)',
          borderRadius: 99,
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tasks.map((task, idx) => (
          <TaskItem
            key={idx}
            idx={idx}
            task={task}
            isDone={!!completed[idx]}
            onToggle={toggleTask}
          />
        ))}
      </div>
    </div>
  );
}

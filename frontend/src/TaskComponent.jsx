import React, { useState, useEffect } from 'react';

const TaskItem = ({ task, idx, isDone, onToggle }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div 
      style={{ 
        padding: 24, 
        background: isDone ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.03)', 
        border: isDone ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--card-border)', 
        borderRadius: 16, 
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        transition: 'all 0.2s',
      }}
    >
      <div 
        onClick={() => onToggle(idx)}
        style={{ 
          width: 24, height: 24, borderRadius: 6, 
          border: isDone ? 'none' : '2px solid var(--text-secondary)',
          background: isDone ? '#22c55e' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 4, cursor: 'pointer'
        }}
      >
        {isDone && <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 8, color: isDone ? '#4ade80' : 'white', textDecoration: isDone ? 'line-through' : 'none' }}>
          {task.title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: task.answer ? 16 : 0 }}>{task.description}</p>
        
        {task.answer && (
          <div style={{ marginTop: 12 }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--card-border)', 
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {revealed ? 'Hide Answer' : 'Reveal Answer'}
            </button>
            
            {revealed && (
              <div style={{ 
                marginTop: 12, 
                padding: 16, 
                background: 'rgba(139, 92, 246, 0.05)', 
                borderLeft: '4px solid var(--accent-primary)',
                borderRadius: '0 8px 8px 0',
                color: '#e2e8f0',
                fontSize: '0.95rem',
                lineHeight: 1.6
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 8 }}>Suggested Solution</div>
                {task.answer}
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

  const progress = Math.round((Object.keys(completed).filter(k => completed[k]).length / tasks.length) * 100);

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Practical Tasks</h2>
        <span style={{ color: progress === 100 ? '#4ade80' : 'var(--accent-primary)', fontWeight: 700 }}>{progress}% Completed</span>
      </div>

      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, marginBottom: 32, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#4ade80' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tasks.map((task, idx) => (
          <TaskItem 
            key={idx} 
            idx={idx} 
            task={task} 
            isDone={completed[idx]} 
            onToggle={toggleTask} 
          />
        ))}
      </div>
    </div>
  );
}

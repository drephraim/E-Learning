import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react';

const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Guessing', icon: ThumbsDown, color: '#ef4444' },
  { value: 2, label: 'Uncertain', icon: ThumbsDown, color: '#f59e0b' },
  { value: 3, label: 'Okay', icon: Meh, color: '#e8884a' },
  { value: 4, label: 'Confident', icon: ThumbsUp, color: '#4ade80' },
  { value: 5, label: 'Nailed it', icon: ThumbsUp, color: '#22c55e' },
];

export default function QuizComponent({ quizzes, userProgress, onSave }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(!!userProgress?.quizScore || false);
  const [confidence, setConfidence] = useState(userProgress?.confidenceRating || null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userProgress?.quizScore !== undefined) {
      setShowResults(true);
      setConfidence(userProgress.confidenceRating || null);
    }
  }, [userProgress]);

  const handleSubmit = () => {
    const score = Object.keys(answers).reduce((acc, idx) => {
      return acc + (answers[idx] === quizzes[idx].answerIndex ? 1 : 0);
    }, 0);
    setShowResults(true);
    if (onSave && !saved) {
      onSave({ quizScore: score, confidenceRating: confidence, status: 'IN_PROGRESS' });
      setSaved(true);
    }
  };

  if (!quizzes || quizzes.length === 0) return null;

  const handleSelect = (idx, optionIdx) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [idx]: optionIdx }));
    setSaved(false);
  };

  const score = Object.keys(answers).reduce((acc, idx) => {
    return acc + (answers[idx] === quizzes[idx].answerIndex ? 1 : 0);
  }, 0);

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>Knowledge Check</h2>
      {quizzes.map((q, idx) => (
        <div key={idx} style={{ marginBottom: 32, padding: 24, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 24, lineHeight: 1.5 }}>{idx + 1}. {q.question}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.options.map((opt, oIdx) => {
              const isSelected = answers[idx] === oIdx;
              const isCorrect = q.answerIndex === oIdx;
              let border = '1px solid var(--border)';
              let bg = 'var(--bg-elevated)';
              if (showResults) {
                if (isCorrect) {
                  border = '1px solid #22c55e';
                  bg = 'rgba(34,197,94,0.08)';
                } else if (isSelected && !isCorrect) {
                  border = '1px solid #ef4444';
                  bg = 'rgba(239,68,68,0.08)';
                }
              } else if (isSelected) {
                border = '1px solid var(--orange)';
                bg = 'rgba(232,136,74,0.08)';
              }
              return (
                <div
                  key={oIdx}
                  onClick={() => handleSelect(idx, oIdx)}
                  style={{
                    padding: '14px 18px', borderRadius: 8, cursor: showResults ? 'default' : 'pointer',
                    border, background: bg, transition: 'all 0.15s', fontWeight: 500, fontSize: '0.95rem'
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!showResults ? (
        <div>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12 }}>How confident do you feel about this?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CONFIDENCE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = confidence === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setConfidence(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8,
                      background: isActive ? 'var(--bg-elevated)' : 'var(--bg-card)',
                      border: isActive ? `1px solid ${opt.color}` : '1px solid var(--border)',
                      color: isActive ? opt.color : 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={14} /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < quizzes.length}
            style={{
              padding: '12px 24px', background: 'var(--orange)', color: 'var(--bg)',
              border: 'none', borderRadius: 8, cursor: Object.keys(answers).length < quizzes.length ? 'not-allowed' : 'pointer',
              fontWeight: 700, opacity: Object.keys(answers).length < quizzes.length ? 0.5 : 1, fontSize: '0.95rem'
            }}
          >
            Submit Answers
          </button>
        </div>
      ) : (
        <div style={{ padding: 20, background: 'rgba(74,232,160,0.08)', border: '1px solid rgba(74,232,160,0.2)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--green)' }}>You scored {score} out of {quizzes.length}!</span>
          <button onClick={() => { setAnswers({}); setShowResults(false); setConfidence(null); setSaved(false); }} style={{ padding: '10px 20px', background: 'transparent', border: '2px solid var(--green)', color: 'var(--green)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Retry Quiz</button>
        </div>
      )}
    </div>
  );
}

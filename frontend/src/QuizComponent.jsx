import React, { useState, useEffect } from 'react';

export default function QuizComponent({ quizzes, userProgress, onSave }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(!!userProgress?.quizScore || false);

  useEffect(() => {
    if (userProgress?.quizScore !== undefined) {
      setShowResults(true);
    }
  }, [userProgress]);

  const handleSubmit = () => {
    const score = Object.keys(answers).reduce((acc, idx) => {
      return acc + (answers[idx] === quizzes[idx].answerIndex ? 1 : 0);
    }, 0);
    setShowResults(true);
    if (onSave) {
      onSave({ quizScore: score, status: 'IN_PROGRESS' });
    }
  };

  if (!quizzes || quizzes.length === 0) return null;

  const handleSelect = (idx, optionIdx) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [idx]: optionIdx }));
  };

  const score = Object.keys(answers).reduce((acc, idx) => {
    return acc + (answers[idx] === quizzes[idx].answerIndex ? 1 : 0);
  }, 0);

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>Knowledge Check</h2>
      {quizzes.map((q, idx) => (
        <div key={idx} style={{ marginBottom: 32, padding: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid var(--card-border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 24, lineHeight: 1.5 }}>{idx + 1}. {q.question}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             {q.options.map((opt, oIdx) => {
               const isSelected = answers[idx] === oIdx;
               const isCorrect = q.answerIndex === oIdx;
               let border = '1px solid var(--card-border)';
               let bg = 'rgba(15,23,42,0.4)';
               if (showResults) {
                 if (isCorrect) {
                   border = '1px solid #22c55e';
                   bg = 'rgba(34, 197, 94, 0.1)';
                 } else if (isSelected && !isCorrect) {
                   border = '1px solid #ef4444';
                   bg = 'rgba(239, 68, 68, 0.1)';
                 }
               } else if (isSelected) {
                 border = '1px solid var(--accent-primary)';
                 bg = 'rgba(139, 92, 246, 0.15)';
               }
               return (
                 <div 
                   key={oIdx}
                   onClick={() => handleSelect(idx, oIdx)}
                   style={{
                     padding: '16px 20px', borderRadius: 12, cursor: showResults ? 'default' : 'pointer',
                     border, background: bg, transition: 'all 0.2s', fontWeight: 500
                   }}
                 >
                   {opt}
                 </div>
               )
             })}
          </div>
        </div>
      ))}
      {!showResults ? (
        <button 
           onClick={handleSubmit}
           disabled={Object.keys(answers).length < quizzes.length}
           style={{ padding: '14px 28px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white', border: 'none', borderRadius: 12, cursor: Object.keys(answers).length < quizzes.length ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: Object.keys(answers).length < quizzes.length ? 0.5 : 1, fontSize: '1.05rem', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}
        >
          Submit Answers
        </button>
      ) : (
        <div style={{ padding: 24, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}>You scored {score} out of {quizzes.length}!</span>
          <button onClick={() => { setAnswers({}); setShowResults(false); }} style={{ padding: '10px 20px', background: 'transparent', border: '2px solid #22c55e', color: '#4ade80', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>Retry Quiz</button>
        </div>
      )}
    </div>
  );
}

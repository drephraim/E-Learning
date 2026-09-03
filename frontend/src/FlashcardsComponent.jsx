import React, { useState } from 'react';

export default function FlashcardsComponent({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) return null;

  const card = flashcards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(flashcards.length - 1, prev + 1));
    }, 150);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }, 150);
  };

  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: 20, width: '100%', maxWidth: 680, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Flashcards</h2>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 6 }}>
          Card {currentIndex + 1} of {flashcards.length}
        </span>
      </div>

      <div 
        style={{ perspective: 1000, width: '100%', maxWidth: 680, height: 320, cursor: 'pointer', marginBottom: 24 }}
        onClick={() => setFlipped(!flipped)}
      >
        <div style={{
          position: 'relative', width: '100%', height: '100%', transition: 'transform 0.5s ease', transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}>
          {/* Front */}
          <div style={{
             position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
             background: 'var(--bg-card)',
             border: '1px solid var(--border)', borderRadius: 12,
             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32,
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{ fontSize: '1.35rem', textAlign: 'center', color: 'var(--text)', fontWeight: 700, lineHeight: 1.5 }}>{card.front}</h2>
            <div style={{ position: 'absolute', bottom: 20, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Click card to flip</div>
          </div>
          {/* Back */}
          <div style={{
             position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
             background: 'var(--bg-elevated)',
             border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12,
             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32,
             transform: 'rotateY(180deg)',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}>
            <p style={{ fontSize: '1.1rem', textAlign: 'center', color: '#f8fafc', lineHeight: 1.6, fontWeight: 500 }}>{card.back}</p>
            <div style={{ position: 'absolute', bottom: 20, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Click card to flip back</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button 
           onClick={handlePrev} disabled={currentIndex === 0}
           style={{
             padding: '10px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
             color: 'var(--text)', borderRadius: 8, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
             opacity: currentIndex === 0 ? 0.35 : 1, fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s ease'
           }}
        >
          &larr; Previous
        </button>
        <button 
           onClick={handleNext} disabled={currentIndex === flashcards.length - 1}
           style={{
             padding: '10px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
             color: 'var(--text)', borderRadius: 8, cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer',
             opacity: currentIndex === flashcards.length - 1 ? 0.35 : 1, fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s ease'
           }}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}

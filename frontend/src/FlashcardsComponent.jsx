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
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: 24, width: '100%', maxWidth: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Flashcards</h2>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: 99 }}>{currentIndex + 1} / {flashcards.length}</span>
      </div>

      <div 
        style={{ perspective: 1200, width: '100%', maxWidth: 700, height: 400, cursor: 'pointer', marginBottom: 40 }}
        onClick={() => setFlipped(!flipped)}
      >
        <div style={{
          position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}>
          {/* Front */}
          <div style={{
             position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
             background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,1))',
             border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32,
             display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
             boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '2.5rem', textAlign: 'center', color: 'white', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{card.front}</h2>
            <div style={{ position: 'absolute', bottom: 24, fontSize: '0.9rem', color: 'var(--text-secondary)', opacity: 0.6 }}>Click to reveal</div>
          </div>
          {/* Back */}
          <div style={{
             position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
             background: 'linear-gradient(145deg, rgba(139,92,246,0.15), rgba(30,41,59,0.95))',
             border: '1px solid var(--accent-primary)', borderRadius: 32,
             display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
             transform: 'rotateY(180deg)',
             boxShadow: '0 25px 50px -12px rgba(139,92,246,0.2)'
          }}>
            <p style={{ fontSize: '1.4rem', textAlign: 'center', color: '#f8fafc', lineHeight: 1.6 }}>{card.back}</p>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <button 
           onClick={handlePrev} disabled={currentIndex === 0}
           style={{ padding: '14px 28px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', borderRadius: 12, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.3 : 1, fontWeight: 600, fontSize: '1.05rem', transition: 'all 0.2s' }}
        >
          &larr; Previous
        </button>
        <button 
           onClick={handleNext} disabled={currentIndex === flashcards.length - 1}
           style={{ padding: '14px 28px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', borderRadius: 12, cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex === flashcards.length - 1 ? 0.3 : 1, fontWeight: 600, fontSize: '1.05rem', transition: 'all 0.2s' }}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}

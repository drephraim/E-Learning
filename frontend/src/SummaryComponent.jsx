import React from 'react';

export default function SummaryComponent({ summary }) {
  if (!summary) return null;

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>Chapter Summary</h2>
      <div style={{
        padding: 32, 
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.05))', 
        borderLeft: '4px solid #38bdf8', 
        borderRadius: '0 16px 16px 0',
        lineHeight: 1.8,
        fontSize: '1.1rem',
        color: '#e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <span style={{ fontSize: '2rem' }}>💡</span>
          <div>{summary}</div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import CourseModal from './CourseModal';

const DashboardMockup = () => (
  <div style={{
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    borderRadius: '16px',
    padding: '24px',
    fontFamily: 'Inter, sans-serif',
    width: '100%',
    minHeight: '340px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Glow orbs */}
    <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', background:'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'160px', height:'160px', background:'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />

    {/* Top bar */}
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,#8b5cf6,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>⚡</div>
        <span style={{ color:'#f8fafc', fontWeight:'700', fontSize:'0.95rem' }}>AdaptAI Dashboard</span>
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }} />)}
      </div>
    </div>

    {/* Stat row */}
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'20px' }}>
      {[
        { label:'Courses', value:'12', icon:'📚', color:'rgba(139,92,246,0.15)', border:'rgba(139,92,246,0.3)' },
        { label:'Progress', value:'78%', icon:'📈', color:'rgba(59,130,246,0.15)', border:'rgba(59,130,246,0.3)' },
        { label:'Streak', value:'14d', icon:'🔥', color:'rgba(245,158,11,0.15)', border:'rgba(245,158,11,0.3)' },
      ].map(s => (
        <div key={s.label} style={{ background:s.color, border:`1px solid ${s.border}`, borderRadius:'12px', padding:'14px', textAlign:'center' }}>
          <div style={{ fontSize:'1.4rem', marginBottom:'4px' }}>{s.icon}</div>
          <div style={{ color:'#f8fafc', fontWeight:'700', fontSize:'1.1rem' }}>{s.value}</div>
          <div style={{ color:'#94a3b8', fontSize:'0.7rem', marginTop:'2px' }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Course list */}
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      {[
        { title:'Machine Learning Fundamentals', progress:85, tag:'Advanced', color:'#8b5cf6' },
        { title:'React & Modern Frontend', progress:62, tag:'Intermediate', color:'#3b82f6' },
        { title:'Data Structures & Algorithms', progress:40, tag:'Beginner', color:'#22c55e' },
      ].map(c => (
        <div key={c.title} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:`linear-gradient(135deg, ${c.color}55, ${c.color}22)`, border:`1px solid ${c.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>🎯</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#f8fafc', fontSize:'0.8rem', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
              <div style={{ flex:1, height:'4px', background:'rgba(255,255,255,0.1)', borderRadius:'999px', overflow:'hidden' }}>
                <div style={{ width:`${c.progress}%`, height:'100%', background:`linear-gradient(90deg, ${c.color}, ${c.color}aa)`, borderRadius:'999px', transition:'width 0.6s ease' }} />
              </div>
              <span style={{ color:'#94a3b8', fontSize:'0.65rem', flexShrink:0 }}>{c.progress}%</span>
            </div>
          </div>
          <span style={{ background:`${c.color}22`, color:c.color, border:`1px solid ${c.color}44`, borderRadius:'999px', padding:'2px 8px', fontSize:'0.65rem', fontWeight:'600', flexShrink:0 }}>{c.tag}</span>
        </div>
      ))}
    </div>
  </div>
);

const AuthPromptModal = ({ onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
    onClick={onClose}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
        position: 'relative',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px',
          cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>

      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', margin: '0 auto 24px',
        boxShadow: '0 8px 24px rgba(139,92,246,0.4)',
      }}>🔒</div>

      <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>
        Sign In to Generate
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.6' }}>
        Create a free account or sign in to start building your personalized AI-powered course.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link
          to="/auth"
          style={{
            display: 'block', padding: '14px 28px', borderRadius: '9999px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            color: 'white', fontWeight: '700', fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
            transition: 'transform 0.2s',
          }}
        >
          Sign In / Create Account
        </Link>
        <button
          onClick={onClose}
          style={{
            padding: '14px 28px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#94a3b8', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>

      <p style={{ marginTop: '24px', color: '#475569', fontSize: '0.8rem' }}>
        Free forever · No credit card required
      </p>
    </div>
  </div>
);

const Landing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleGenerateCourse = () => {
    if (auth.currentUser) {
      setIsModalOpen(true);
    } else {
      setShowAuthPrompt(true);
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <CourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="logo">
            Adapt<span className="text-gradient">AI</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#about" className="nav-link">About</a>
          </div>
          <Link to="/auth" className="btn btn-secondary">Sign In</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="container hero-content text-center">
          <div className="hero-badge">v1.0 is Live 🚀 Experience Next-Gen Learning</div>
          <h1 className="hero-title">
            Learn Your Way.<br />
            Let AI Build Your <span className="text-gradient">Perfect Course.</span>
          </h1>
          <p className="hero-subtitle">
            An adaptive learning ecosystem that creates personalized roadmaps, integrates video tutorials, and adjusts to your real-time cognitive performance.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={handleGenerateCourse}>Generate a Course</button>
            <button className="btn btn-secondary" onClick={scrollToFeatures}>Explore Features</button>
          </div>
          
          <div className="hero-image">
            <DashboardMockup />
          </div>
        </div>
      </header>

      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title text-center">Why Choose Us?</h2>
          <p className="section-subtitle text-center">
            Stop endlessly searching for scattered tutorials. Let artificial intelligence build your personalized learning journey from scratch.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3 className="feature-title">Personalized Generation</h3>
              <p className="feature-desc">
                Select your topic, difficulty, and duration. Our Gemini-powered LLM instantly curates a structured curriculum just for you.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3 className="feature-title">Adaptive Engine</h3>
              <p className="feature-desc">
                Take assessments that measure your knowledge. The platform upgrades or downgrades content difficulty dynamically to match your pace.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3 className="feature-title">Curated Video Sync</h3>
              <p className="feature-desc">
                Engage with embedded, highly-relevant external tutorials pulled directly from YouTube to compliment your reading material.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3 className="feature-title">AI Learning Aids</h3>
              <p className="feature-desc">
                Reinforce retention with automated flashcards, chapter summaries, and targeted quizzes generated specifically for your current module.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section" style={{ background: 'var(--bg-color)', position: 'relative' }}>
        <div className="container">
          <h2 className="section-title text-center">How It Works</h2>
          <p className="section-subtitle text-center">
            Four simple steps to transform the way you learn forever.
          </p>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Input Preferences</h3>
                <p>Enter a subject, select your current baseline knowledge level, and choose how long you want the course to be.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Generates Curriculum</h3>
                <p>The system builds a comprehensive roadmap consisting of structured modules, curated videos, and contextual reading materials within seconds.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Learn & Engage</h3>
                <p>Dive into the material and challenge yourself with AI-generated flashcards, summaries, and mini-tasks.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Adaptive Optimization</h3>
                <p>Take module quizzes. The Adaptive Engine analyzes your performance and dynamically tweaks the difficulty of upcoming modules.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-logo">Adapt<span className="text-gradient">AI</span></div>
          <div className="footer-links">
            <a href="#">About Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
          <p>© 2026 AdaptAI Learning Platform. All rights reserved.</p>
          <p style={{ marginTop: '12px', fontSize: '0.85rem' }}>Designed for University of Energy and Natural Resources (Group 5B)</p>
        </div>
      </footer>
    </>
  );
};

export default Landing;

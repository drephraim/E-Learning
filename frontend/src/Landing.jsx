import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import { BookOpen, BarChart2, Flame, Target, Cog, PlayCircle, FileText, Zap, ChevronRight, Lock, ArrowRight } from 'lucide-react';
import CourseModal from './CourseModal';

const DashboardMockup = () => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '20px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid var(--border)',
  }}>
    {/* Top bar */}
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap size={16} color="#0c0e12" />
        </div>
        <span style={{ color:'var(--text)', fontWeight:'700', fontSize:'0.9rem' }}>Your Dashboard</span>
      </div>
      <div style={{ display:'flex', gap:'6px' }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width:'8px', height:'8px', borderRadius:'50%', background:c }} />)}
      </div>
    </div>

    {/* Stat cards - slightly uneven for human feel */}
    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 0.9fr', gap:'10px', marginBottom:'16px' }}>
      {[
        { label:'Courses', value:'12', icon: BookOpen, color:'var(--orange)', bg:'rgba(232,136,74,0.1)' },
        { label:'Avg. Score', value:'78%', icon: BarChart2, color:'var(--blue)', bg:'rgba(74,156,232,0.1)' },
        { label:'Streak', value:'14d', icon: Flame, color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
      ].map(s => (
        <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}22`, borderRadius:'10px', padding:'12px', textAlign:'center' }}>
          <s.icon size={16} color={s.color} style={{ marginBottom:'4px' }} />
          <div style={{ color:'var(--text)', fontWeight:'700', fontSize:'1rem' }}>{s.value}</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.7rem', marginTop:'2px' }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Course list */}
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {[
        { title:'Machine Learning Fundamentals', progress:85, color:'var(--orange)' },
        { title:'React & Modern Frontend', progress:62, color:'var(--blue)' },
        { title:'Data Structures & Algorithms', progress:40, color:'var(--green)' },
      ].map(c => (
        <div key={c.title} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:`${c.color}18`, border:`1px solid ${c.color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Target size={14} color={c.color} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'var(--text)', fontSize:'0.82rem', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'5px' }}>
              <div style={{ flex:1, height:'3px', background:'var(--border)', borderRadius:'999px', overflow:'hidden' }}>
                <div style={{ width:`${c.progress}%`, height:'100%', background:c.color, borderRadius:'999px' }} />
              </div>
              <span style={{ color:'var(--text-muted)', fontSize:'0.65rem', flexShrink:0 }}>{c.progress}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AuthPromptModal = ({ onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
    onClick={onClose}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        padding: '40px 36px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '14px', right: '14px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: '8px', width: '30px', height: '30px',
          cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>

      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'var(--orange)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}><Lock size={24} color="#0c0e12" /></div>

      <h2 style={{ color: 'var(--text)', fontSize: '1.35rem', fontWeight: '700', marginBottom: '10px' }}>
        Sign in to continue
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6' }}>
        You'll need an account to generate and save your personalized courses.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link
          to="/auth"
          style={{
            display: 'flex', alignItems:'center', justifyContent:'center', gap:'8px',
            padding: '13px 24px', borderRadius: '10px',
            background: 'var(--orange)', color: '#0c0e12',
            fontWeight: '700', fontSize: '0.92rem',
          }}
        >
          Sign In / Create Account <ArrowRight size={16} />
        </Link>
        <button
          onClick={onClose}
          style={{
            padding: '13px 24px', borderRadius: '10px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.92rem', cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>

      <p style={{ marginTop: '20px', color: 'var(--border)', fontSize: '0.78rem' }}>
        Free forever · No credit card needed
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

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <CourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}

      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="logo">
            Adaptive<span>Learn</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#about" className="nav-link">About</a>
          </div>
          <Link to="/auth" className="btn btn-ghost">Sign In</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Learn your way.<br />
              Let AI build your <em>perfect</em> course.
            </h1>
            <p className="hero-subtitle">
              Tell us what you want to learn, and we'll put together a course that fits how you actually learn — not how a textbook thinks you should.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={handleGenerateCourse}>
                Generate a Course <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary" onClick={() => scrollTo('features')}>
                See how it works
              </button>
            </div>

            <div className="hero-visual">
              <div className="dash">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <span className="section-label"><Cog size={14} /> Features</span>
          <h2 className="section-title">Everything you need to actually learn</h2>
          <p className="section-desc">
            Most learning platforms throw videos at you and hope something sticks. We take a different approach.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap orange"><BookOpen size={20} /></div>
              <h3>Personalized courses</h3>
              <p>Pick a topic, set your level, and our AI builds a curriculum that's actually suited to where you're starting from.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap blue"><BarChart2 size={20} /></div>
              <h3>Adapts as you go</h3>
              <p>Struggling with a concept? The system dials things back. Flying through? It'll ramp up the challenge automatically.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap blue"><PlayCircle size={20} /></div>
              <h3>Curated videos</h3>
              <p>We pull in relevant YouTube tutorials that actually explain things well — no more digging through search results.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap green"><FileText size={20} /></div>
              <h3>Built-in study tools</h3>
              <p>Flashcards, summaries, and quizzes generated for each module so you can test yourself as you learn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="section-label"><Zap size={14} /> Process</span>
          <h2 className="section-title">How it works</h2>
          <p className="section-desc" style={{ marginBottom: '48px' }}>
            Four steps from "I want to learn X" to actually understanding it.
          </p>

          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Tell us what you want to learn</h3>
                <p>Enter a subject, your current level, and how long you want the course to run. Takes about 30 seconds.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>AI builds your curriculum</h3>
                <p>We generate a structured course with modules, video recommendations, and reading materials tailored to you.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Learn and practice</h3>
                <p>Work through modules at your own pace. Use the built-in flashcards and quizzes to reinforce what you're learning.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>We adjust as you go</h3>
                <p>Based on quiz results, we tweak upcoming modules — easier if you're stuck, harder if you're breezing through.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-inner">
            <div className="footer-left">
              <div className="footer-logo">Adaptive<span>Learn</span></div>
              <p>© 2026 AdaptiveLearn. All rights reserved.</p>
              <p className="footer-note">Built for University of Energy and Natural Resources (Group 5B)</p>
            </div>
            <div className="footer-right">
              <a href="#">About</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Landing;

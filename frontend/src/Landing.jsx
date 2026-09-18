import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { 
  BookOpen, 
  BarChart2, 
  Flame, 
  Target, 
  Cog, 
  PlayCircle, 
  FileText, 
  Zap, 
  ChevronRight, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Building2,
  Layers,
  Users,
  CheckCircle2,
  Sparkles,
  Cpu,
  FileCheck,
  Activity,
  Award,
  TrendingUp,
  Library,
  UploadCloud
} from 'lucide-react';
import CourseModal from './CourseModal';

const StudentDashboardMockup = () => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '20px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid var(--border)',
  }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <GraduationCap size={16} color="#818cf8" />
        </div>
        <div>
          <div style={{ color:'var(--text)', fontWeight:'700', fontSize:'0.88rem' }}>Student Portal</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>Adaptive Cognitive Pathway</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: '20px' }}>
        <Sparkles size={12} color="#34d399" />
        <span style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>Cognitive State: INTERMEDIATE</span>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'16px' }}>
      {[
        { label:'Enrolled Courses', value:'6 Active', icon: BookOpen, color:'#818cf8', bg:'rgba(99, 102, 241, 0.1)' },
        { label:'EMA Performance', value:'82.4%', icon: TrendingUp, color:'#34d399', bg:'rgba(52, 211, 153, 0.1)' },
        { label:'Completed Modules', value:'24 Modules', icon: Award, color:'#f59e0b', bg:'rgba(245, 158, 11, 0.1)' },
      ].map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}22`, borderRadius:'10px', padding:'12px', textAlign:'center' }}>
            <Icon size={16} color={s.color} style={{ marginBottom:'4px' }} />
            <div style={{ color:'var(--text)', fontWeight:'700', fontSize:'0.95rem' }}>{s.value}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.68rem', marginTop:'2px' }}>{s.label}</div>
          </div>
        );
      })}
    </div>

    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {[
        { title:'CS 401: Machine Learning & Neural Networks', progress:88, tag:'Grounded in UG Syllabus', color:'#818cf8' },
        { title:'IT 302: Database Management Systems', progress:64, tag:'Level 300 Core', color:'#34d399' },
        { title:'CS 204: Data Structures & Algorithms', progress:42, tag:'Level 200 Core', color:'#f59e0b' },
      ].map(c => (
        <div key={c.title} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:`${c.color}18`, border:`1px solid ${c.color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Target size={14} color={c.color} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color:'var(--text)', fontSize:'0.82rem', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{c.tag}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
              <div style={{ flex:1, height:'4px', background:'var(--border)', borderRadius:'999px', overflow:'hidden' }}>
                <div style={{ width:`${c.progress}%`, height:'100%', background:c.color, borderRadius:'999px' }} />
              </div>
              <span style={{ color:'var(--text-muted)', fontSize:'0.68rem', flexShrink:0, fontWeight: 600 }}>{c.progress}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FacultyDashboardMockup = () => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: '14px',
    padding: '20px',
    fontFamily: 'Inter, sans-serif',
    border: '1px solid var(--border)',
  }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Building2 size={16} color="#34d399" />
        </div>
        <div>
          <div style={{ color:'var(--text)', fontWeight:'700', fontSize:'0.88rem' }}>Faculty & Lecturer Portal</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>Department of Computer Science</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 10px', borderRadius: '20px' }}>
        <ShieldCheck size={12} color="#818cf8" />
        <span style={{ color: '#818cf8', fontSize: '0.72rem', fontWeight: 700 }}>VERIFIED FACULTY</span>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'16px' }}>
      {[
        { label:'Uploaded Materials', value:'18 Documents', icon: Library, color:'#34d399', bg:'rgba(52, 211, 153, 0.1)' },
        { label:'Enrolled Students', value:'142 Active', icon: Users, color:'#818cf8', bg:'rgba(99, 102, 241, 0.1)' },
        { label:'Published Courses', value:'4 Approved', icon: FileCheck, color:'#f59e0b', bg:'rgba(245, 158, 11, 0.1)' },
      ].map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}22`, borderRadius:'10px', padding:'12px', textAlign:'center' }}>
            <Icon size={16} color={s.color} style={{ marginBottom:'4px' }} />
            <div style={{ color:'var(--text)', fontWeight:'700', fontSize:'0.95rem' }}>{s.value}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.68rem', marginTop:'2px' }}>{s.label}</div>
          </div>
        );
      })}
    </div>

    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {[
        { title:'Syllabus - CS 401 Machine Learning (2026)', type:'COURSE_SYLLABUS', status:'READY & INDEXED', color:'#34d399' },
        { title:'Lecture Notes - Module 3 Neural Networks', type:'LECTURE_NOTES', status:'GROUNDED IN RAG', color:'#818cf8' },
        { title:'Lab Manual - Practical Deep Learning', type:'LAB_MANUAL', status:'AVAILABLE TO STUDENTS', color:'#f59e0b' },
      ].map(c => (
        <div key={c.title} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
            <FileText size={16} color={c.color} />
            <div style={{ minWidth:0 }}>
              <div style={{ color:'var(--text)', fontSize:'0.82rem', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.68rem' }}>Type: {c.type}</div>
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}30`, padding: '3px 8px', borderRadius: '6px', flexShrink: 0 }}>
            {c.status}
          </span>
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
        background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}><Lock size={24} color="#818cf8" /></div>

      <h2 style={{ color: 'var(--text)', fontSize: '1.35rem', fontWeight: '700', marginBottom: '10px' }}>
        Sign In Required
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6' }}>
        Please sign in with your Student or Lecturer account to access adaptive courses and institutional materials.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link
          to="/auth"
          style={{
            display: 'flex', alignItems:'center', justifyContent:'center', gap:'8px',
            padding: '13px 24px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
            fontWeight: '700', fontSize: '0.92rem',
          }}
        >
          Sign In / Register <ArrowRight size={16} />
        </Link>
        <button
          onClick={onClose}
          style={{
            padding: '13px 24px', borderRadius: '10px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.92rem', cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        Official Educational Platform • University of Energy and Natural Resources
      </p>
    </div>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'lecturer'

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
      {isModalOpen && <CourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}

      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Adaptive<span style={{ color: '#818cf8' }}>Learn</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Portals & Features</a>
            <a href="#architecture" className="nav-link">System Pipeline</a>
            <a href="#about" className="nav-link">About Project</a>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/auth" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>Sign In</Link>
            <button className="btn btn-primary" onClick={handleGenerateCourse} style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
              Explore Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="hero">
        <div className="container">
          <div className="hero-content" style={{ maxWidth: '820px' }}>
            <div className="hero-tag">
              <ShieldCheck size={14} color="#818cf8" />
              <span>INSTITUTIONAL ADAPTIVE LEARNING PLATFORM</span>
            </div>

            <h1 className="hero-title">
              Intelligent Learning Pathways Grounded in <em style={{ color: '#818cf8' }}>Verified Academic Standards.</em>
            </h1>
            <p className="hero-subtitle" style={{ maxWidth: '640px' }}>
              AdaptiveLearn pairs student mastery tracking with faculty course materials—delivering personalized study plans, multi-modal learning aids, and institutional quality control.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={handleGenerateCourse} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
                Student Access <ArrowRight size={16} />
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/auth')}
                style={{ borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
              >
                <Building2 size={16} /> Faculty / Lecturer Portal
              </button>
            </div>

            {/* Interactive Preview Mockup Container */}
            <div className="hero-visual">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('student')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: activeTab === 'student' ? '#818cf8' : 'var(--border)',
                    background: activeTab === 'student' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                    color: activeTab === 'student' ? '#818cf8' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <GraduationCap size={14} /> Student Dashboard Preview
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('lecturer')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: activeTab === 'lecturer' ? '#34d399' : 'var(--border)',
                    background: activeTab === 'lecturer' ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-card)',
                    color: activeTab === 'lecturer' ? '#34d399' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Building2 size={14} /> Faculty & Lecturer Portal Preview
                </button>
              </div>

              <div className="dash">
                {activeTab === 'student' ? <StudentDashboardMockup /> : <FacultyDashboardMockup />}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* System Capabilities Bar */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '24px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { title: '3 Cognitive Mastery Tiers', desc: 'Beginner, Intermediate & Advanced EMA engine', icon: Activity, color: '#818cf8' },
              { title: '4 Learning Aid Types', desc: 'Quizzes, Flashcards, Summaries & Tasks', icon: Layers, color: '#34d399' },
              { title: '100% Institutional Grounding', desc: 'Syllabus & lecture document RAG pipeline', icon: Library, color: '#f59e0b' },
              { title: 'Role Security & Isolation', desc: 'Dedicated Student & Faculty authentication', icon: ShieldCheck, color: '#6366f1' },
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.title} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${m.color}15`, border: `1px solid ${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={m.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>{m.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dual Portal Feature Grid */}
      <section id="features" className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <span className="section-label" style={{ color: '#818cf8' }}><Cpu size={14} /> PORTAL ARCHITECTURE</span>
            <h2 className="section-title">Built for Modern University Education</h2>
            <p className="section-desc">
              A integrated platform supporting both self-paced student mastery and authoritative faculty curriculum oversight.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Student Features Card */}
            <div className="feature-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={22} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>Student Experience</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Personalized, adaptive learning pathways</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                {[
                  { title: 'EMA Cognitive Mastery Engine', desc: 'Recalibrates difficulty (Beginner, Intermediate, Advanced) using Exponential Moving Average based on quiz scores and confidence ratings.', icon: TrendingUp },
                  { title: '4 Interactive Learning Aids', desc: 'Each module includes auto-generated practice quizzes, flashcard decks, chapter summaries, and practical tasks.', icon: Layers },
                  { title: 'Visual Learning Pulse & Analytics', desc: 'Track time spent, quiz averages, topic mastery breakdown, and historical progression curves.', icon: BarChart2 },
                  { title: 'Institutional Course Selection', desc: 'Browse and enroll in courses aligned directly with university department syllabi.', icon: BookOpen },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: '12px' }}>
                    <CheckCircle2 size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '2px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lecturer Features Card */}
            <div className="feature-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} color="#34d399" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>Faculty & Lecturer Portal</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Curriculum ingestion & quality assurance</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                {[
                  { title: 'Academic Material Ingestion', desc: 'Upload PDF, DOCX, and PPTX syllabi, lecture slides, lab manuals, and research papers tagged with INSTITUTIONAL metadata.', icon: UploadCloud },
                  { title: 'Institutional RAG Grounding', desc: 'Course generation is strictly grounded in uploaded department materials for academic authority and accuracy.', icon: Library },
                  { title: 'Module Validation & Editing', desc: 'Review, edit text content, adjust YouTube tutorial links, and approve generated modules before publishing.', icon: FileCheck },
                  { title: 'Student Enrolment & Oversight', desc: 'Invite students by email, manage course visibility (Public/Private), and track class-wide completion metrics.', icon: Users },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: '12px' }}>
                    <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '2px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture Pipeline */}
      <section id="architecture" className="section" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <span className="section-label" style={{ color: '#34d399' }}><Zap size={14} /> SYSTEM PIPELINE</span>
            <h2 className="section-title">End-to-End Academic Pipeline</h2>
            <p className="section-desc">
              Four structured phases ensuring institutional authority, curriculum accuracy, and continuous student progress evaluation.
            </p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-num" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>1</div>
              <div className="step-body">
                <h3>1. Curriculum Ingestion & Upload</h3>
                <p>Faculty members upload official course syllabi, lecture notes, lab guides, and reading materials into the institutional database.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>2</div>
              <div className="step-body">
                <h3>2. Document Processing & Indexing</h3>
                <p>Text extraction pipelines clean, structure, and chunk academic documents into indexed vector stores tagged with source metadata.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>3</div>
              <div className="step-body">
                <h3>3. Adaptive Pathway & Study Aid Generation</h3>
                <p>Structured course modules are synthesized with curated video tutorials, quizzes, flashcards, summaries, and practical tasks.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-num" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>4</div>
              <div className="step-body">
                <h3>4. Continuous Mastery Evaluation (EMA)</h3>
                <p>As students complete quizzes and tasks, Exponential Moving Average algorithms continuously tune cognitive state tiers and difficulty weights.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section id="about" className="section" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Building2 size={28} color="#818cf8" />
          </div>
          <h2 className="section-title" style={{ fontSize: '2.4rem', fontWeight: 800 }}>
            Elevating Higher Education Through Adaptive Data & Quality Assurance
          </h2>
          <p className="section-desc" style={{ margin: '0 auto 32px', maxWidth: '580px' }}>
            Developed for University of Energy and Natural Resources (Group 5B). Designed for students and faculty seeking verified curriculum grounding and intelligent learning paths.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
              Access Student Portal <ArrowRight size={18} />
            </Link>
            <Link to="/auth" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}>
              Access Faculty Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-inner">
            <div className="footer-left">
              <div className="footer-logo">Adaptive<span style={{ color: '#818cf8' }}>Learn</span></div>
              <p>© 2026 AdaptiveLearn. All rights reserved.</p>
              <p className="footer-note">University of Energy and Natural Resources • Department of Computer Science & IT (Group 5B)</p>
            </div>
            <div className="footer-right">
              <a href="#features">Portals</a>
              <a href="#architecture">Architecture</a>
              <a href="#about">About Project</a>
              <Link to="/auth">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Landing;

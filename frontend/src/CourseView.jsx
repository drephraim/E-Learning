import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import QuizComponent from './QuizComponent';
import FlashcardsComponent from './FlashcardsComponent';
import SummaryComponent from './SummaryComponent';
import TaskComponent from './TaskComponent';

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('lesson');
  const contentRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setCurrentTab('lesson');
  }, [activeModuleIndex]);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    const fetchUrl = userId 
      ? `http://localhost:3000/courses/${id}?userId=${userId}`
      : `http://localhost:3000/courses/${id}`;

    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        setCourse(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch course", err);
        setLoading(false);
      });
  }, [id, userId]);

  const saveProgress = async (moduleId, update) => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:3000/courses/progress/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...update })
      });
      // Optionally sync the local state to avoid full reload
      const progressData = await res.json();
      setCourse(prev => {
        const newModules = prev.modules.map(m => {
          if (m.id === moduleId) {
            return { ...m, userProgress: [progressData] };
          }
          return m;
        });
        return { ...prev, modules: newModules };
      });
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'white'}}>
        <h2>Loading Curriculum...</h2>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{padding: 40, color: 'white'}}>Course not found! <Link to="/dashboard">Go back</Link></div>
    );
  }

  if (!course.modules || course.modules.length === 0) {
    return (
      <div style={{padding: 40, color: 'white'}}>This course has no modules yet. <Link to="/dashboard">Go back</Link></div>
    );
  }

  const activeModule = course.modules[activeModuleIndex];
  const quizAid = activeModule?.learningAids?.find(a => a.type === 'QUIZ');
  const flashcardAid = activeModule?.learningAids?.find(a => a.type === 'FLASHCARD');
  const summaryAid = activeModule?.learningAids?.find(a => a.type === 'SUMMARY');
  const taskAid = activeModule?.learningAids?.find(a => a.type === 'TASK');

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'Inter' }}>
      
      {/* Course Sidebar */}
      <div style={{ width: '320px', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.4)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16, display: 'inline-block' }}>
            &larr; Back to Dashboard
          </Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{course.title}</h2>
          <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', borderRadius: 99, fontWeight: 600, display: 'inline-block', marginTop: 12 }}>
            {course.targetDifficulty}
          </span>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Course Modules</h3>
          {course.modules.map((mod, idx) => (
            <div 
              key={mod.id} 
              onClick={() => setActiveModuleIndex(idx)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '8px',
                background: idx === activeModuleIndex ? 'var(--card-bg)' : 'transparent',
                border: idx === activeModuleIndex ? '1px solid var(--accent-primary)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 4 }}>Chapter {idx + 1}</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mod.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', position: 'relative' }}>
        
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>{activeModule.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Chapter {activeModuleIndex + 1} of {course.modules.length}</p>

          <div style={{ display: 'flex', gap: 24, marginBottom: 40, borderBottom: '1px solid var(--card-border)', paddingBottom: 0 }}>
             <button 
               onClick={() => setCurrentTab('lesson')}
               style={{ background: 'transparent', border: 'none', color: currentTab === 'lesson' ? 'white' : 'var(--text-secondary)', fontWeight: currentTab === 'lesson' ? 700 : 500, fontSize: '1.05rem', cursor: 'pointer', borderBottom: currentTab === 'lesson' ? '3px solid var(--accent-primary)' : '3px solid transparent', paddingBottom: 12, marginBottom: -1, transition: 'all 0.2s' }}
             >
               Lesson
             </button>
             {quizAid && (
               <button 
                 onClick={() => setCurrentTab('quiz')}
                 style={{ background: 'transparent', border: 'none', color: currentTab === 'quiz' ? 'white' : 'var(--text-secondary)', fontWeight: currentTab === 'quiz' ? 700 : 500, fontSize: '1.05rem', cursor: 'pointer', borderBottom: currentTab === 'quiz' ? '3px solid var(--accent-primary)' : '3px solid transparent', paddingBottom: 12, marginBottom: -1, transition: 'all 0.2s' }}
               >
                 Quiz
               </button>
             )}
             {flashcardAid && (
               <button 
                 onClick={() => setCurrentTab('flashcards')}
                 style={{ background: 'transparent', border: 'none', color: currentTab === 'flashcards' ? 'white' : 'var(--text-secondary)', fontWeight: currentTab === 'flashcards' ? 700 : 500, fontSize: '1.05rem', cursor: 'pointer', borderBottom: currentTab === 'flashcards' ? '3px solid var(--accent-primary)' : '3px solid transparent', paddingBottom: 12, marginBottom: -1, transition: 'all 0.2s' }}
               >
                 Flashcards
               </button>
             )}
             {summaryAid && (
               <button 
                 onClick={() => setCurrentTab('summary')}
                 style={{ background: 'transparent', border: 'none', color: currentTab === 'summary' ? 'white' : 'var(--text-secondary)', fontWeight: currentTab === 'summary' ? 700 : 500, fontSize: '1.05rem', cursor: 'pointer', borderBottom: currentTab === 'summary' ? '3px solid var(--accent-primary)' : '3px solid transparent', paddingBottom: 12, marginBottom: -1, transition: 'all 0.2s' }}
               >
                 Summary
               </button>
             )}
             {taskAid && (
               <button 
                 onClick={() => setCurrentTab('tasks')}
                 style={{ background: 'transparent', border: 'none', color: currentTab === 'tasks' ? 'white' : 'var(--text-secondary)', fontWeight: currentTab === 'tasks' ? 700 : 500, fontSize: '1.05rem', cursor: 'pointer', borderBottom: currentTab === 'tasks' ? '3px solid var(--accent-primary)' : '3px solid transparent', paddingBottom: 12, marginBottom: -1, transition: 'all 0.2s' }}
               >
                 Tasks
               </button>
             )}
          </div>

          {currentTab === 'lesson' && (
            <>
              {activeModule.youtubeUrl && (
                <div style={{ marginBottom: '40px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', aspectRatio: '16/9' }}>
                   <iframe 
                     width="100%" 
                     height="100%" 
                     src={activeModule.youtubeUrl} 
                     title="YouTube video player" 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen>
                   </iframe>
                </div>
              )}

              <div 
                className="markdown-content"
                style={{ 
                   lineHeight: 1.8, 
                   fontSize: '1.05rem', 
                   color: '#e2e8f0'
                }}
              >
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      const lang = match ? match[1] : '';
                      const codeString = String(children).replace(/\n$/, '');
                      
                      if (!inline && lang) {
                        return (
                          <div className="code-card" style={{ 
                            margin: '24px 0', 
                            borderRadius: '16px', 
                            overflow: 'hidden', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(15, 23, 42, 0.6)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                          }}>
                            <div style={{ 
                              padding: '10px 20px', 
                              background: 'rgba(255,255,255,0.05)', 
                              borderBottom: '1px solid rgba(255,255,255,0.1)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent-primary)' }}>{lang}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(codeString)}
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  color: 'var(--text-secondary)', 
                                  fontSize: '0.75rem', 
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Copy
                              </button>
                            </div>
                            <pre style={{ padding: '24px', overflowX: 'auto', margin: 0 }}>
                              <code className={className} style={{ fontFamily: '"Fira Code", monospace', fontSize: '0.95rem' }} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                      return <code className={className} {...props}>{children}</code>;
                    }
                  }}
                >
                  {activeModule.content}
                </ReactMarkdown>
              </div>
            </>
          )}

          {currentTab === 'quiz' && quizAid && (
             <QuizComponent 
               quizzes={quizAid.payload.quizzes} 
               userProgress={activeModule.userProgress?.[0]}
               onSave={(update) => saveProgress(activeModule.id, update)}
             />
          )}

          {currentTab === 'flashcards' && flashcardAid && (
             <FlashcardsComponent flashcards={flashcardAid.payload.flashcards} />
          )}

          {currentTab === 'summary' && summaryAid && (
             <SummaryComponent summary={summaryAid.payload.summary} />
          )}

          {currentTab === 'tasks' && taskAid && (
             <TaskComponent 
               tasks={taskAid.payload.tasks} 
               userProgress={activeModule.userProgress?.[0]}
               onSave={(update) => saveProgress(activeModule.id, update)}
             />
          )}
          
          <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: 32 }}>
             <button 
               onClick={() => setActiveModuleIndex( Math.max(0, activeModuleIndex - 1) )}
               style={{ padding: '12px 24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'white', borderRadius: 8, cursor: activeModuleIndex === 0 ? 'not-allowed' : 'pointer', opacity: activeModuleIndex === 0 ? 0.5 : 1 }}
               disabled={activeModuleIndex === 0}
             >
               &larr; Previous Chapter
             </button>
             <button 
               onClick={() => setActiveModuleIndex( Math.min(course.modules.length - 1, activeModuleIndex + 1) )}
               style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', color: 'white', borderRadius: 8, cursor: activeModuleIndex === course.modules.length - 1 ? 'not-allowed' : 'pointer', opacity: activeModuleIndex === course.modules.length - 1 ? 0.5 : 1, fontWeight: 600 }}
               disabled={activeModuleIndex === course.modules.length - 1}
             >
               Next Chapter &rarr;
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}

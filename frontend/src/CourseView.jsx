import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import QuizComponent from './QuizComponent';
import FlashcardsComponent from './FlashcardsComponent';
import SummaryComponent from './SummaryComponent';
import TaskComponent from './TaskComponent';
import CodeRunner from './CodeRunner';
import Confetti from 'react-confetti';
import jsPDF from 'jspdf';
import ReactStars from 'react-stars';
import { auth } from './firebase';
import { API_BASE_URL } from './config';

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('lesson');
  const [levelUpMessage, setLevelUpMessage] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const contentRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUser?.uid;

  const isOwner = course ? course.userId === userId : false;
  const isEnrolled = course ? (isOwner || (course.userProgress && course.userProgress.length > 0)) : false;

  const handleEnroll = () => {
    if (!userId) {
      alert("Please wait for authentication to resolve.");
      return;
    }
    fetch(`${API_BASE_URL}/courses/${id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
      .then(res => res.json())
      .then(data => {
        setCourse(prev => ({
          ...prev,
          userProgress: [data]
        }));
      })
      .catch(err => {
        console.error("Enrollment failed", err);
        alert("Failed to enroll in the course.");
      });
  };

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
      ? `${API_BASE_URL}/courses/${id}?userId=${userId}`
      : `${API_BASE_URL}/courses/${id}`;

    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        setCourse(data);
        setLoading(false);
        // Check if course is already completed
        if (data.userProgress && data.userProgress.length > 0) {
          setIsCompleted(data.userProgress[0].isCompleted);
        }
      })
      .catch(err => {
        console.error("Failed to fetch course", err);
        setLoading(false);
      });
  }, [id, userId]);

  // Fetch course progress
  useEffect(() => {
    if (!id || !userId) return;
    fetch(`${API_BASE_URL}/courses/${id}/progress?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setCourseProgress(data);
        if (data.isCourseComplete && !isCompleted) {
          // Check if already marked complete in backend
          fetch(`${API_BASE_URL}/courses/${id}?userId=${userId}`)
            .then(res => res.json())
            .then(courseData => {
              if (courseData.userProgress && courseData.userProgress[0]?.isCompleted) {
                setIsCompleted(true);
              }
            });
        }
      })
      .catch(err => console.error("Failed to fetch progress", err));
  }, [id, userId, course]);

  // Fetch suggestions when course is completed
  useEffect(() => {
    if (isCompleted && userId) {
      fetch(`${API_BASE_URL}/courses/suggestions?userId=${userId}&courseId=${id}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => console.error("Failed to fetch suggestions", err));
    }
  }, [isCompleted, userId, id]);

  const saveProgress = async (moduleId, update) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/courses/progress/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...update })
      });
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

      // Adaptive engine: recalculate cognitive state whenever a quiz score is saved
      if (update.quizScore !== undefined) {
        try {
          const adaptRes = await fetch(`${API_BASE_URL}/users/${userId}/adapt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleId,
              confidenceRating: update.confidenceRating,
            })
          });
          if (adaptRes.ok) {
            const data = await adaptRes.json();
            setLevelUpMessage(data);
            setTimeout(() => setLevelUpMessage(null), 5000);
          }
        } catch (err) {
          // Non-critical — swallow silently
        }
      }
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const handleCompleteCourse = async () => {
    if (!userId || !courseProgress?.isCourseComplete) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (res.ok) {
        setIsCompleted(true);
        setShowCompletionModal(true);
      }
    } catch (err) {
      console.error("Failed to complete course", err);
    }
  };

  const generateCertificate = () => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    
    // Border
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(3);
    doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.getHeight() - 20);
    
    // Title
    doc.setFontSize(40);
    doc.setTextColor(255, 255, 255);
    doc.text('Certificate of Completion', pageWidth / 2, 60, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(148, 163, 184);
    doc.text('This is to certify that', pageWidth / 2, 90, { align: 'center' });
    
    // User name
    doc.setFontSize(32);
    doc.setTextColor(139, 92, 246);
    const userName = auth.currentUser?.displayName || auth.currentUser?.email || 'Student';
    doc.text(userName, pageWidth / 2, 130, { align: 'center' });
    
    // Course
    doc.setFontSize(16);
    doc.setTextColor(148, 163, 184);
    doc.text('has successfully completed the course', pageWidth / 2, 160, { align: 'center' });
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(course?.title || 'Course', pageWidth / 2, 190, { align: 'center' });
    
    // Date
    doc.setFontSize(14);
    doc.setTextColor(148, 163, 184);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Completed on ${date}`, pageWidth / 2, 230, { align: 'center' });
    
    // Download
    doc.save(`certificate-${course?.title?.replace(/\s+/g, '-')}.pdf`);
  };

  const submitRating = async () => {
    if (!userId || rating === 0) return;
    
    try {
      await fetch(`${API_BASE_URL}/courses/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rating, review })
      });
      alert('Thank you for your review!');
    } catch (err) {
      console.error("Failed to submit rating", err);
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

      {/* Confetti for completion */}
      {isCompleted && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 24, padding: 40,
            maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>🎉 Course Completed!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Congratulations on completing "{course?.title}"!
            </p>

            {/* Stats */}
            {courseProgress && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Modules Completed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{courseProgress.completedModules}/{courseProgress.totalModules}</div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Quiz Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{courseProgress.averageQuizScore}%</div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Spent</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {Math.floor(courseProgress.totalTimeSpentSeconds / 3600)}h {Math.floor((courseProgress.totalTimeSpentSeconds % 3600) / 60)}m
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completion</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>100%</div>
                </div>
              </div>
            )}

            {/* Certificate Button */}
            <button onClick={generateCertificate} style={{
              width: '100%', padding: 16, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none', borderRadius: 12, color: 'white', fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer', marginBottom: 24
            }}>
              Download Certificate (PDF)
            </button>

            {/* Rating */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Rate this course:</div>
              <ReactStars count={5} value={rating} onChange={setRating} size={32} color2={'#fbbf24'} />
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write a review (optional)"
                style={{
                  width: '100%', marginTop: 12, padding: 12, borderRadius: 8,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'white', minHeight: 80, resize: 'vertical'
                }}
              />
              <button onClick={submitRating} style={{
                marginTop: 12, padding: '10px 24px', background: 'var(--accent-primary)',
                border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer'
              }}>
                Submit Review
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Suggested Next Courses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {suggestions.map(s => (
                    <Link key={s.id} to={`/course/${s.id}`} style={{
                      padding: 16, background: 'var(--bg-elevated)', borderRadius: 12,
                      textDecoration: 'none', color: 'white', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.targetDifficulty}</div>
                      </div>
                      <span style={{ fontSize: '1.5rem' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowCompletionModal(false)} style={{
              width: '100%', padding: 12, background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Adaptive level-up toast */}
      {levelUpMessage && typeof levelUpMessage === 'object' && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
          padding: '16px 24px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: 16, maxWidth: 380,
        }}>
          <span style={{ fontSize: '1.6rem' }}>
            {levelUpMessage.cognitiveState === 'ADVANCED' ? '🚀' : levelUpMessage.cognitiveState === 'INTERMEDIATE' ? '⚡' : '📘'}
          </span>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Adaptive Engine</div>
            <div>Level: <span style={{ textTransform: 'capitalize', color: 'var(--orange)' }}>{levelUpMessage.cognitiveState.charAt(0) + levelUpMessage.cognitiveState.slice(1).toLowerCase()}</span></div>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.7, marginTop: 2 }}>
              Avg: {levelUpMessage.avgScore}% across {levelUpMessage.quizCount} quiz{levelUpMessage.quizCount !== 1 ? 'zes' : ''}
              {levelUpMessage.changed && <span> · Level changed from <span style={{ textTransform: 'capitalize' }}>{levelUpMessage.prevState?.toLowerCase()}</span></span>}
            </div>
          </div>
        </div>
      )}

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
          {course.modules.map((mod, idx) => {
            const moduleStatus = courseProgress?.moduleStatus?.find(m => m.moduleId === mod.id);
            const isComplete = moduleStatus?.isComplete;
            return (
              <div 
                key={mod.id} 
                onClick={() => isEnrolled && setActiveModuleIndex(idx)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: isEnrolled ? 'pointer' : 'not-allowed',
                  marginBottom: '8px',
                  background: idx === activeModuleIndex && isEnrolled ? 'var(--card-bg)' : 'transparent',
                  border: idx === activeModuleIndex && isEnrolled ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  opacity: isEnrolled ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 4 }}>
                  {isComplete ? '✓ ' : ''}Chapter {idx + 1}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{mod.title}</span>
                  {!isEnrolled && <span style={{ fontSize: '0.85rem' }}>🔒</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', position: 'relative' }}>
        
        {/* Progress Bar */}
        {courseProgress && isEnrolled && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Course Progress</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{courseProgress.progressPercentage}%</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${courseProgress.progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: 99,
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        )}

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {!isEnrolled ? (
            /* Course Overview Page */
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
                border: '1px solid var(--card-border)',
                borderRadius: 24,
                padding: '40px',
                marginBottom: 32,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                  borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
                  opacity: 0.15, pointerEvents: 'none'
                }} />
                
                <span style={{
                  fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(139, 92, 246, 0.2)',
                  color: '#c084fc', borderRadius: 99, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1, display: 'inline-block', marginBottom: 16
                }}>
                  {course.targetDifficulty} Level
                </span>
                
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{course.title}</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Unlock this adaptive curriculum to learn step-by-step. This course features {course.modules.length} lessons with interactive quizzes, flashcards, summaries, and practical tasks customized for you.
                </p>
              </div>

              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  📖 Course Syllabus ({course.modules.length} Chapters)
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {course.modules.map((mod, idx) => (
                    <div 
                      key={mod.id} 
                      style={{
                        padding: '20px 24px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 20,
                        transition: 'all 0.2s',
                        opacity: 0.85
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: 'white', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600 }}>{mod.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Click enroll to unlock lesson content, quizzes, and tasks for this chapter.
                        </p>
                      </div>
                      <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>🔒</span>
                    </div>
                  ))}
                </div>
              </div>

              {course.ratings && course.ratings.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>Student Reviews</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {course.ratings.map(r => (
                      <div key={r.id} style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <ReactStars count={5} value={r.rating} edit={false} size={16} color2={'#fbbf24'} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        {r.review && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>"{r.review}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                textAlign: 'center',
                padding: '40px 0',
                borderTop: '1px solid var(--card-border)',
                marginTop: 40
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Ready to start your learning journey?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>Enroll now to immediately unlock all chapters and exercises.</p>
                <button
                  onClick={handleEnroll}
                  style={{
                    padding: '16px 48px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Enroll in Course
                </button>
              </div>
            </div>
          ) : (
            /* Enrolled Full Course Page */
            <>
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
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : '';
                          const codeString = String(children).replace(/\n$/, '');

                          if (!inline && lang) {
                            return <CodeRunner code={codeString} language={lang} />;
                          }
                          return <code className={className} style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontSize: '0.9em', fontFamily: '"Fira Code", Consolas, monospace' }} {...props}>{children}</code>;
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

                 {/* Complete Course Button */}
                 {!isCompleted && activeModuleIndex === course.modules.length - 1 && (
                   <button 
                     onClick={handleCompleteCourse}
                     disabled={!courseProgress?.isCourseComplete}
                     style={{ 
                       padding: '12px 24px', 
                       background: courseProgress?.isCourseComplete ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-elevated)', 
                       border: courseProgress?.isCourseComplete ? 'none' : '1px solid var(--border)', 
                       color: courseProgress?.isCourseComplete ? 'white' : 'var(--text-muted)', 
                       borderRadius: 8, 
                       cursor: courseProgress?.isCourseComplete ? 'pointer' : 'not-allowed', 
                       fontWeight: 600, 
                       fontSize: '1rem',
                       transition: 'all 0.2s'
                     }}
                     title={courseProgress?.isCourseComplete ? "Complete Course" : "To complete the course, you must score at least 3/5 on all quizzes and finish all tasks."}
                   >
                     ✓ Complete Course
                   </button>
                 )}

                 {isCompleted && (
                   <button 
                     onClick={() => setShowCompletionModal(true)}
                     style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                   >
                     🎉 View Completion
                   </button>
                 )}

                 <button 
                   onClick={() => setActiveModuleIndex( Math.min(course.modules.length - 1, activeModuleIndex + 1) )}
                   style={{ padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', color: 'white', borderRadius: 8, cursor: activeModuleIndex === course.modules.length - 1 ? 'not-allowed' : 'pointer', opacity: activeModuleIndex === course.modules.length - 1 ? 0.5 : 1, fontWeight: 600 }}
                   disabled={activeModuleIndex === course.modules.length - 1}
                 >
                   Next Chapter &rarr;
                 </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

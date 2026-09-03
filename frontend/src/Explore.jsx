import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from './firebase';
import Sidebar from './Sidebar';
import './Dashboard.css';
import { BookOpen, Play, Trash2, GraduationCap, Download, FileText, Sparkles, Folder, CheckCircle2, Star } from 'lucide-react';
import { API_BASE_URL } from './config';
import InstitutionalCourseHubModal from './InstitutionalCourseHubModal';

const CourseCard = ({ course, onDelete }) => {
  const rawImage = course.coverImage && !course.coverImage.includes('unsplash.com') ? course.coverImage : '';
  const coverSrc = rawImage
    ? (rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : `${API_BASE_URL}${rawImage}`)
    : '';

  const isCompleted = course.userProgress && course.userProgress.length > 0 && course.userProgress[0].isCompleted;

  return (
    <div className="course-card" onClick={() => window.location.href=`/course/${course.id}`} style={{cursor: 'pointer'}}>
      <div className="course-img-wrapper">
        {coverSrc ? (
          <img src={coverSrc} alt={course.title} className="course-img" />
        ) : (
          <div className="course-img course-img-placeholder">
            <BookOpen size={32} color="var(--text-muted)" />
          </div>
        )}
        {isCompleted && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(16, 185, 129, 0.9)', color: 'white',
            padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
          }}>
            <CheckCircle2 size={12} color="white" /> Completed
          </div>
        )}
        <button className="play-button"><Play size={14} /></button>
        {course.isOwner && (
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(course.id, course.title);
            }}
            title="Delete Course"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="course-content">
        <div className="course-tags">
          <span className="course-tag purple">{course.targetDifficulty || 'BEGINNER'}</span>
          {course.averageRating > 0 && (
            <span className="course-tag orange" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Star size={11} fill="#f59e0b" color="#f59e0b" /> {course.averageRating}
            </span>
          )}
          {isCompleted && (
            <span className="course-tag green">Completed</span>
          )}
        </div>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-meta">
          <BookOpen size={14} /> {course.user?.name || 'User'}
        </p>
      </div>
    </div>
  );
};

export default function Explore() {
  const [courses, setCourses] = useState([]);
  const [institutionalCourses, setInstitutionalCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const location = useLocation();

  // Institutional Course Hub Modal state
  const [selectedInstCourseId, setSelectedInstCourseId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUser?.uid;

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const url = userId ? `${API_BASE_URL}/courses/all?userId=${userId}` : `${API_BASE_URL}/courses/all`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }

      // Fetch Institutional Courses with materials
      const instUrl = userId ? `${API_BASE_URL}/courses/institutional-courses?userId=${userId}` : `${API_BASE_URL}/courses/institutional-courses`;
      const instRes = await fetch(instUrl);
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstitutionalCourses(Array.isArray(instData) ? instData : []);
      }
    } catch (err) {
      console.error("Could not fetch explore data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [location.pathname, userId]);

  const handleDeleteCourse = (courseId, title) => {
    if (!auth.currentUser) return;
    if (!window.confirm(`Delete "${title}"? This removes all progress too.`)) return;

    setDeleting(true);
    fetch(`${API_BASE_URL}/courses/${courseId}?userId=${auth.currentUser.uid}`, { method: 'DELETE' })
      .then(() => {
        setCourses(prev => prev.filter(c => c.id !== courseId));
      })
      .catch(err => {
        console.error("Delete failed", err);
        alert("Failed to delete course.");
      })
      .finally(() => setDeleting(false));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <header className="section-header" style={{ marginBottom: '28px' }}>
            <h1 className="section-title">Explore Courses & Academic Notes</h1>
            <p className="banner-desc" style={{marginBottom:0}}>
              Browse personalized AI courses and institutional department reference materials available for direct download.
            </p>
          </header>

          {/* Section 1: Institutional Courses & Materials Downloads */}
          {institutionalCourses.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={20} color="#818cf8" /> Institutional Department Courses & Files ({institutionalCourses.length})
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} color="#34d399" /> Downloadable Notes & Syllabi
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {institutionalCourses.map((c) => (
                  <div
                    key={c.id}
                    className="course-card"
                    style={{ padding: 18, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, cursor: 'pointer' }}
                    onClick={() => setSelectedInstCourseId(c.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                      }}>
                        {c.code || 'INSTITUTIONAL'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {c.level || 'Level 400'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>
                      {c.title}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 14 }}>
                      Lecturer: {c.lecturerName || 'Faculty'} • {c.materials?.length || c.materialCount || 0} Downloadable Materials
                    </div>

                    <button
                      className="btn-upload-material"
                      style={{ width: '100%', padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInstCourseId(c.id);
                      }}
                    >
                      <Folder size={15} /> Access Course Hub & Downloads
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: AI Personalized Courses */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={20} color="#c084fc" /> Interactive Personalized AI Courses
            </h2>

            {loading ? (
              <div className="loading-screen" style={{padding: '60px 0'}}>Loading courses...</div>
            ) : courses.length > 0 ? (
              <div className="course-row-wrapper">
                <div className="course-row" style={{ flexWrap: 'wrap' }}>
                  {courses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={{
                        ...course,
                        isOwner: auth.currentUser && course.userId === auth.currentUser.uid
                      }}
                      onDelete={handleDeleteCourse}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="empty-icon"><BookOpen size={24} /></div>
                <h3 className="empty-title">No courses yet</h3>
                <p className="empty-desc">Be the first to create a course!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Institutional Course Hub Modal */}
      {selectedInstCourseId && (
        <InstitutionalCourseHubModal
          isOpen={!!selectedInstCourseId}
          onClose={() => setSelectedInstCourseId(null)}
          courseId={selectedInstCourseId}
        />
      )}
    </div>
  );
}

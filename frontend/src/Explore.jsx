import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from './firebase';
import Sidebar from './Sidebar';
import './Dashboard.css';
import { BookOpen, Play, Trash2, Star } from 'lucide-react';
import { API_BASE_URL } from './config';

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
            ✓ Completed
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
          <span className="course-tag purple">{course.targetDifficulty}</span>
          {course.averageRating > 0 && (
            <span className="course-tag orange">★ {course.averageRating}</span>
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
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUser?.uid;

  const fetchCourses = () => {
    setLoading(true);
    const url = userId ? `${API_BASE_URL}/courses/all?userId=${userId}` : `${API_BASE_URL}/courses/all`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Could not fetch courses", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
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
            <h1 className="section-title">Explore</h1>
            <p className="banner-desc" style={{marginBottom:0}}>See what others are learning.</p>
          </header>

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
      </main>
    </div>
  );
}

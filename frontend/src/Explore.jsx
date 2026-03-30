import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Dashboard.css'; // Reuse dashboard styles for consistency

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

const CourseCard = ({ course }) => {
  const rawImage = course.coverImage && !course.coverImage.includes('unsplash.com') ? course.coverImage : '';
  const coverSrc = rawImage
    ? (rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : `http://localhost:3000${rawImage}`)
    : '';
  
  return (
    <div className="course-card" onClick={() => window.location.href=`/course/${course.id}`} style={{cursor: 'pointer'}}>
      <div className="course-img-wrapper">
        {coverSrc ? (
          <img src={coverSrc} alt={course.title} className="course-img" />
        ) : (
          <div className="course-img course-img-placeholder" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', color: 'rgba(255,255,255,0.3)'
          }}>📚</div>
        )}
        <button className="play-button"><PlayIcon /></button>
      </div>
      <div className="course-content">
        <div className="course-tags">
          <span className="course-tag purple">{course.targetDifficulty}</span>
        </div>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-meta">
          <BookIcon width={14} height={14} /> Created by User
        </p>
      </div>
    </div>
  );
};

export default function Explore() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/courses/all') 
      .then(res => res.json())
      .then(data => {
        // If data is an array, set it. Otherwise if it's a specific object structure, adjust.
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Could not fetch courses", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <header className="section-header" style={{ marginBottom: '32px' }}>
            <h1 className="section-title" style={{ fontSize: '2rem' }}>Explore Courses</h1>
            <p className="banner-desc">Discover what others are learning on AdaptAI.</p>
          </header>

          {loading ? (
             <div className="loading-state">Loading courses...</div>
          ) : courses.length > 0 ? (
            <div className="course-row" style={{ flexWrap: 'wrap', gap: '24px' }}>
              {courses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          ) : (
            <div className="empty-state-card">
               <BookIcon />
               <h3 className="empty-title">No courses found</h3>
               <p className="empty-desc">Be the first to create an amazing course!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

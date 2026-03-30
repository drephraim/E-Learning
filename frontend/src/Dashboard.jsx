import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseModal from './CourseModal';
import { auth } from './firebase';
import Sidebar from './Sidebar';
import './Dashboard.css';

// --- SVGs for Icons ---
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3L10.5 8.5L16 10L10.5 11.5L9 17L7.5 11.5L2 10L7.5 8.5L9 3Z"></path>
    <path d="M18 16L18.5 18.5L21 19L18.5 19.5L18 22L17.5 19.5L15 19L17.5 18.5L18 16Z"></path>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const CompassIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
);

const RibbonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const TrendingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

// --- Sub-components ---

const WelcomeBanner = ({ onOpenModal }) => (
  <div className="welcome-banner">
    <div className="banner-content">
      <span className="greeting">AdaptAI Platform</span>
      <h1 className="banner-title">Welcome back! 👋</h1>
      <p className="banner-desc">Ready to continue your learning journey? Create a new AI-powered course tailored specifically to you.</p>
      <button className="btn banner-btn" onClick={onOpenModal}>
        <SparklesIcon /> Generate New Course
      </button>
    </div>
  </div>
);

const StatsGrid = ({ createdCount }) => (
  <div className="stats-grid">
    <div className="stat-card">
      <div className="stat-icon-wrapper blue"><BookIcon /></div>
      <div className="stat-value">0</div>
      <div className="stat-label">Enrolled Courses</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper green"><RibbonIcon /></div>
      <div className="stat-value">0</div>
      <div className="stat-label">Completed</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper purple"><ClockIcon /></div>
      <div className="stat-value">0h</div>
      <div className="stat-label">Learning Time</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper orange"><TrendingIcon /></div>
      <div className="stat-value">{createdCount}</div>
      <div className="stat-label">Courses Created</div>
    </div>
  </div>
);

const EmptyStateCard = ({ message, actions }) => (
  <div className="empty-state-card">
    <div className="empty-icon"><BookIcon /></div>
    <h3 className="empty-title">{message}</h3>
    <p className="empty-desc">Start your learning journey by creating or exploring courses</p>
    <div className="empty-actions">
      {actions.map((action, i) => (
        <button key={i} onClick={action.onClick} className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}>
          {action.icon && <span className="btn-icon">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  </div>
);

const CourseCard = ({ course, onDelete }) => {
  const rawImage = course.coverImage && !course.coverImage.includes('unsplash.com') ? course.coverImage : '';
  const coverSrc = rawImage
    ? (rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : `http://localhost:3000${rawImage}`)
    : '';
  
  const completedModules = course.modules?.filter(m => m.userProgress?.[0]?.status === 'COMPLETED').length || 0;
  const totalModules = course._count?.modules || course.modules?.length || 1;
  const progressPercent = Math.round((completedModules / totalModules) * 100);

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
        <div className="course-progress-overlay">
           <div className="progress-bar-mini">
              <div className="progress-fill-mini" style={{ width: `${progressPercent}%` }}></div>
           </div>
        </div>
        <button 
          className="delete-button" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(course.id, course.title);
          }}
          title="Delete Course"
        >
          <TrashIcon />
        </button>
        <button className="play-button"><PlayIcon /></button>
      </div>
      <div className="course-content">
        <div className="course-tags">
          <span className="course-tag purple">{course.targetDifficulty}</span>
          {progressPercent > 0 && (
            <span className="course-tag green" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              {progressPercent}% Complete
            </span>
          )}
        </div>
        <h3 className="course-title">{course.title}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="course-meta">
            <BookIcon width={14} height={14} /> {totalModules} chapters
          </p>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, courses, action, emptyMsg, onOpenModal, onDeleteCourse }) => (
  <div className="dashboard-section">
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {action && <a href="#" className="section-action">{action} &rsaquo;</a>}
    </div>
    {courses && courses.length > 0 ? (
      <div className="course-row-wrapper">
        <div className="course-row">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} onDelete={onDeleteCourse} />
          ))}
        </div>
      </div>
    ) : (
      <EmptyStateCard 
        message={emptyMsg} 
        actions={[
          { label: "Create Course", primary: true, icon: <PlusIcon />, onClick: onOpenModal }
        ]} 
      />
    )}
  </div>
);

// --- Main Dashboard ---

export default function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdCourses, setCreatedCourses] = useState([]);
  
  const handleOpenModal = () => setIsModalOpen(true);

  const fetchCourses = () => {
    if (auth.currentUser) {
      fetch(`http://localhost:3000/courses/user/${auth.currentUser.uid}`)
        .then(res => res.json())
        .then(data => {
          setCreatedCourses(data);
        })
        .catch(err => console.error("Could not fetch user courses", err));
    }
  };

  const handleDeleteCourse = (courseId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This will remove all progress data as well.`)) {
      fetch(`http://localhost:3000/courses/${courseId}?userId=${auth.currentUser.uid}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(data => {
        // Optimistically remove from state
        setCreatedCourses(prev => prev.filter(c => c.id !== courseId));
      })
      .catch(err => {
        console.error("Delete failed", err);
        alert("Failed to delete course. Please try again.");
      });
    }
  };

  useEffect(() => {
    fetchCourses();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchCourses();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-layout">
      <CourseModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        // Refresh courses when modal closes in case a new one was created
        fetchCourses();
      }} />
      <Sidebar onOpenModal={handleOpenModal} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <WelcomeBanner onOpenModal={handleOpenModal} />
          <StatsGrid createdCount={createdCourses.length} />
          
          <Section 
            title="My Created Courses" 
            courses={createdCourses} 
            emptyMsg="You haven't generated any courses yet." 
            onOpenModal={handleOpenModal} 
            onDeleteCourse={handleDeleteCourse}
          />
          
        </div>
      </main>
    </div>
  );
}

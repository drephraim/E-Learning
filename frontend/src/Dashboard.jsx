import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseModal from './CourseModal';
import { auth } from './firebase';
import Sidebar from './Sidebar';
import './Dashboard.css';
import { Sparkles, BookOpen, Award, Clock, TrendingUp, Play, Trash2, Plus } from 'lucide-react';
import { API_BASE_URL } from './config';

// --- Sub-components ---

const WelcomeBanner = ({ onOpenModal }) => (
  <div className="welcome-banner">
    <div className="banner-content">
      <span className="greeting">AdaptiveLearn Platform</span>
      <h1 className="banner-title">Welcome back</h1>
      <p className="banner-desc">Pick up where you left off, or start something new.</p>
      <button className="banner-btn" onClick={onOpenModal}>
        <Sparkles size={16} /> Generate New Course
      </button>
    </div>
  </div>
);

const StatsGrid = ({ enrolledCount, completedCount, timeSpentHours, createdCount }) => (
  <div className="stats-grid">
    <div className="stat-card">
      <div className="stat-icon-wrapper blue"><BookOpen size={20} /></div>
      <div className="stat-value">{enrolledCount}</div>
      <div className="stat-label">Enrolled</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper green"><Award size={20} /></div>
      <div className="stat-value">{completedCount}</div>
      <div className="stat-label">Completed</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper purple"><Clock size={20} /></div>
      <div className="stat-value">{timeSpentHours}h</div>
      <div className="stat-label">Time Spent</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper orange"><TrendingUp size={20} /></div>
      <div className="stat-value">{createdCount}</div>
      <div className="stat-label">Courses Created</div>
    </div>
  </div>
);

const EmptyStateCard = ({ message, actions }) => (
  <div className="empty-state-card">
    <div className="empty-icon"><BookOpen size={24} /></div>
    <h3 className="empty-title">{message}</h3>
    <p className="empty-desc">Start your learning journey by creating or exploring courses</p>
    <div className="empty-actions">
      {actions.map((action, i) => (
        <button key={i} onClick={action.onClick} className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}>
          {action.icon} {action.label}
        </button>
      ))}
    </div>
  </div>
);

const CourseCard = ({ course, onDelete }) => {
  const rawImage = course.coverImage && !course.coverImage.includes('unsplash.com') ? course.coverImage : '';
  const coverSrc = rawImage
    ? (rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : `${API_BASE_URL}${rawImage}`)
    : '';

  // Check if course is completed from userProgress
  const isCompleted = course.userProgress && course.userProgress.length > 0 && course.userProgress[0].isCompleted;

  // Calculate progress from modules
  const completedModules = course.modules?.filter(m => m.userProgress?.[0]?.status === 'COMPLETED').length || 0;
  const totalModules = course._count?.modules || course.modules?.length || 1;
  const progressPercent = isCompleted ? 100 : Math.round((completedModules / totalModules) * 100);

  return (
    <div className="course-card" onClick={() => window.location.href=`/course/${course.id}`}>
      <div className="course-img-wrapper">
        {coverSrc ? (
          <img src={coverSrc} alt={course.title} className="course-img" />
        ) : (
          <div className="course-img course-img-placeholder">
            <BookOpen size={32} color="var(--text-muted)" />
          </div>
        )}
        <div className="course-progress-overlay">
           <div className="progress-bar-mini">
              <div className="progress-fill-mini" style={{ width: `${progressPercent}%` }}></div>
           </div>
        </div>
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
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            const isOwner = course.userId === auth.currentUser?.uid;
            onDelete(course.id, course.title, isOwner);
          }}
          title={course.userId === auth.currentUser?.uid ? "Delete Course" : "Unenroll"}
        >
          <Trash2 size={14} />
        </button>
        <button className="play-button"><Play size={14} /></button>
      </div>
      <div className="course-content">
        <div className="course-tags">
          <span className="course-tag purple">{course.targetDifficulty}</span>
          {isCompleted ? (
            <span className="course-tag green">Completed</span>
          ) : progressPercent > 0 ? (
            <span className="course-tag green">{progressPercent}%</span>
          ) : null}
          {course.averageRating > 0 && (
            <span className="course-tag orange">★ {course.averageRating}</span>
          )}
        </div>
        <h3 className="course-title">{course.title}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="course-meta">
            <BookOpen size={14} /> {totalModules} chapters
          </p>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, courses, emptyMsg, actionLabel = "Create Course", onActionClick, onDeleteCourse }) => (
  <div className="dashboard-section">
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
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
          { label: actionLabel, primary: true, icon: <Plus size={16} />, onClick: onActionClick }
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
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({ enrolledCount: 0, completedCount: 0, timeSpentHours: 0 });

  const handleOpenModal = () => setIsModalOpen(true);

  const fetchCourses = () => {
    if (auth.currentUser) {
      fetch(`${API_BASE_URL}/courses/user/${auth.currentUser.uid}`)
        .then(res => res.json())
        .then(data => setCreatedCourses(Array.isArray(data) ? data : []))
        .catch(err => console.error("Could not fetch user courses", err));

      fetch(`${API_BASE_URL}/courses/enrolled/${auth.currentUser.uid}`)
        .then(res => res.json())
        .then(data => setEnrolledCourses(Array.isArray(data) ? data : []))
        .catch(err => console.error("Could not fetch enrolled courses", err));
    }
  };

  const fetchStats = () => {
    if (auth.currentUser) {
      fetch(`${API_BASE_URL}/users/${auth.currentUser.uid}/stats`)
        .then(res => res.json())
        .then(data => {
          setStats({
            enrolledCount: data.enrolledCount || 0,
            completedCount: data.completedCount || 0,
            timeSpentHours: data.timeSpentHours || 0
          });
        })
        .catch(err => console.error("Could not fetch user stats", err));
    }
  };

  const handleDeleteCourse = (courseId, title, isOwner) => {
    if (!auth.currentUser) return;

    if (isOwner) {
      if (window.confirm(`Delete "${title}"? This removes all progress too.`)) {
        fetch(`${API_BASE_URL}/courses/${courseId}?userId=${auth.currentUser.uid}`, { method: 'DELETE' })
          .then(() => {
            setCreatedCourses(prev => prev.filter(c => c.id !== courseId));
            fetchStats();
          })
          .catch(err => { console.error("Delete failed", err); alert("Failed to delete course."); });
      }
    } else {
      if (window.confirm(`Unenroll from "${title}"? This removes all your progress.`)) {
        fetch(`${API_BASE_URL}/courses/${courseId}/unenroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.currentUser.uid })
        })
          .then(res => res.json())
          .then(() => {
            setEnrolledCourses(prev => prev.filter(c => c.id !== courseId));
            fetchStats();
          })
          .catch(err => { console.error("Unenroll failed", err); alert("Failed to unenroll from course."); });
      }
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStats();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchCourses();
        fetchStats();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-layout">
      <CourseModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchCourses(); fetchStats(); }} />
      <Sidebar onOpenModal={handleOpenModal} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <WelcomeBanner onOpenModal={handleOpenModal} />
          <StatsGrid 
            enrolledCount={stats.enrolledCount}
            completedCount={stats.completedCount}
            timeSpentHours={stats.timeSpentHours}
            createdCount={createdCourses.length} 
          />
          <Section
            title="Enrolled Courses"
            courses={enrolledCourses}
            emptyMsg="You haven't enrolled in any courses yet."
            actionLabel="Explore Courses"
            onActionClick={() => navigate('/explore')}
            onDeleteCourse={handleDeleteCourse}
          />
          <Section
            title="My Courses"
            courses={createdCourses}
            emptyMsg="You haven't created any courses yet."
            actionLabel="Create Course"
            onActionClick={handleOpenModal}
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
      </main>
    </div>
  );
}

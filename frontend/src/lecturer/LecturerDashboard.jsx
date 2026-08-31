import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import UploadMaterialModal from './UploadMaterialModal';
import CreateCourseModal from './CreateCourseModal';
import { 
  FileText, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Plus, 
  UploadCloud, 
  Clock, 
  Building2, 
  Sparkles,
  ChevronRight,
  Globe,
  Lock,
  FileCheck
} from 'lucide-react';

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [statsData, setStatsData] = useState({
    title: 'Dr.',
    name: '',
    department: 'Computer Science',
    stats: {
      materials: 0,
      syllabi: 0,
      courses: 0,
      published: 0,
    },
    recentMaterials: [],
  });
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const fetchStats = async () => {
    if (!currentUser && !dbUser) return;
    const userId = currentUser?.uid || dbUser?.id;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/stats/${userId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch lecturer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser, dbUser]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const titlePrefix = dbUser?.lecturerProfile?.title || statsData.title || 'Dr.';
  let nameStr = '';
  if (dbUser?.firstName || dbUser?.lastName) {
    nameStr = `${dbUser?.firstName || ''} ${dbUser?.lastName || ''}`.trim();
  } else if (dbUser?.name) {
    nameStr = dbUser.name;
  } else if (statsData?.name) {
    nameStr = statsData.name;
  }
  nameStr = nameStr.replace(/undefined/gi, '').replace(/null/gi, '').trim();
  if (!nameStr) nameStr = 'Lecturer';

  const displayName = nameStr.toLowerCase().startsWith('dr') ? nameStr : `${titlePrefix} ${nameStr}`;

  return (
    <div className="lecturer-content">
      {/* Header Greeting Banner */}
      <div>
        <div className="lecturer-header-badge">
          <Sparkles size={12} /> Institutional Portal • Phase 2
        </div>

        <div className="lecturer-title-row">
          <div>
            <h1 className="lecturer-greeting">{getTimeGreeting()}, {displayName}</h1>
            <p className="lecturer-subtitle">
              <Building2 size={14} style={{ display: 'inline', marginRight: 4, color: '#818cf8' }} />
              {dbUser?.institution || statsData.institution || 'Department of Computer Science & IT'} • {dbUser?.lecturerProfile?.department || statsData.department}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="form-input"
              onClick={() => setIsCourseModalOpen(true)}
              style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Plus size={16} /> Create Course
            </button>

            <button 
              className="btn-upload-material"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <UploadCloud size={18} /> Upload Academic Material
            </button>
          </div>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="lecturer-stats-grid">
        <div className="lecturer-stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/lecturer/materials')}>
          <div className="stat-icon-wrapper indigo">
            <FileText size={22} />
          </div>
          <div className="stat-label">Academic Materials</div>
          <div className="stat-value-container">
            <span className="stat-number">{statsData.stats?.materials || 0}</span>
            <span className="stat-unit">Uploaded</span>
          </div>
        </div>

        <div className="lecturer-stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/lecturer/syllabi')}>
          <div className="stat-icon-wrapper emerald">
            <BookOpen size={22} />
          </div>
          <div className="stat-label">Course Syllabi</div>
          <div className="stat-value-container">
            <span className="stat-number">{statsData.stats?.syllabi || 0}</span>
            <span className="stat-unit">Extracted</span>
          </div>
        </div>

        <div className="lecturer-stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/lecturer/courses')}>
          <div className="stat-icon-wrapper purple">
            <GraduationCap size={22} />
          </div>
          <div className="stat-label">Academic Courses</div>
          <div className="stat-value-container">
            <span className="stat-number">{statsData.stats?.courses || 0}</span>
            <span className="stat-unit">Active</span>
          </div>
        </div>

        <div className="lecturer-stat-card">
          <div className="stat-icon-wrapper amber">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-label">Student Accessible</div>
          <div className="stat-value-container">
            <span className="stat-number">{statsData.stats?.published || 0}</span>
            <span className="stat-unit">Available</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main-grid">
        {/* Left Column: Recent Uploaded Materials */}
        <div className="lecturer-section">
          <div className="section-header">
            <h2 className="section-title">Recent Academic Materials</h2>
            <button className="section-action-link" onClick={() => navigate('/lecturer/materials')}>
              View All
            </button>
          </div>

          {statsData.recentMaterials && statsData.recentMaterials.length > 0 ? (
            <div className="materials-list">
              {statsData.recentMaterials.map((material) => (
                <div 
                  key={material.id} 
                  className="material-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/lecturer/materials/detail/${material.id}`)}
                >
                  <div className="material-info">
                    <FileText size={18} className="material-icon" />
                    <div>
                      <div className="material-title">{material.title}</div>
                      <div className="material-meta">
                        {material.course ? `${material.course.code}: ${material.course.title}` : 'General Material'} • {material.fileName}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-badge">{material.materialType.replace('_', ' ')}</span>
                    <ChevronRight size={16} style={{ color: '#818cf8' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-container">
              <div className="empty-state-icon">
                <FileText size={24} />
              </div>
              <h3 className="empty-state-title">No Academic Materials Uploaded</h3>
              <p className="empty-state-text">
                Upload your course outlines, lecture notes, or research papers to build your department's searchable institutional knowledge base.
              </p>
              <button 
                className="btn-upload-material"
                style={{ margin: '0 auto' }}
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Plus size={16} /> Upload First Material
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & System Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="lecturer-section">
            <h3 className="section-title" style={{ marginBottom: 14 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="form-input"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <GraduationCap size={18} style={{ color: '#818cf8' }} /> Create Academic Course
                </span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="form-input"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <UploadCloud size={18} style={{ color: '#34d399' }} /> Upload Lecture Notes
                </span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => navigate('/lecturer/syllabi')}
                className="form-input"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <BookOpen size={18} style={{ color: '#c084fc' }} /> Inspect Course Syllabi
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* System Guidance Card */}
          <div className="lecturer-section" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h4 style={{ color: '#818cf8', margin: '0 0 8px 0', fontSize: '0.95rem' }}>ℹ️ Academic Knowledge Base Notice</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
              Uploaded materials are automatically processed, cleaned, and split into structured chunks tagged with source category <strong>INSTITUTIONAL</strong>. These materials serve as authoritative grounding for AI course generation in future phases.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadMaterialModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchStats}
      />

      <CreateCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
};

export default LecturerDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import CreateCourseModal from './CreateCourseModal';
import EditCourseContentModal from './EditCourseContentModal';
import { 
  GraduationCap, 
  Plus, 
  BookOpen, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  Search,
  Building2,
  Edit3,
  Eye,
  Globe,
  Lock,
  Layers
} from 'lucide-react';

const LecturerCourses = () => {
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [academicCourses, setAcademicCourses] = useState([]);
  const [generatedCourses, setGeneratedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generated'); // 'generated' | 'academic'
  const [searchTerm, setSearchTerm] = useState('');

  // Editing Course Modal Target
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);

  const fetchCourses = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/courses/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAcademicCourses(data);
        } else {
          setAcademicCourses(data.academicCourses || []);
          setGeneratedCourses(data.generatedCourses || []);
        }
      }
    } catch (err) {
      console.error('Error fetching lecturer courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentUser, dbUser]);

  const filteredGenerated = generatedCourses.filter((c) => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAcademic = academicCourses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="lecturer-content">
      <div>
        <div className="lecturer-header-badge">
          <Sparkles size={12} /> Course Management
        </div>

        <div className="lecturer-title-row">
          <div>
            <h1 className="lecturer-greeting">Lecturer Courses</h1>
            <p className="lecturer-subtitle">
              Manage your synthesized AI courses and department academic offerings. Edit chapter content & video lessons live.
            </p>
          </div>

          <button 
            className="btn-upload-material"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} /> Create Course
          </button>
        </div>
      </div>

      {/* Main Tabs Selector */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('generated')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'generated' ? '2px solid #818cf8' : '2px solid transparent',
            color: activeTab === 'generated' ? 'white' : '#94a3b8',
            padding: '10px 18px 14px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Sparkles size={16} color="#818cf8" /> Personalized AI Courses ({generatedCourses.length})
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'academic' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === 'academic' ? 'white' : '#94a3b8',
            padding: '10px 18px 14px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <GraduationCap size={16} color="#34d399" /> Institutional Courses ({academicCourses.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="lecturer-section" style={{ padding: '14px 20px', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search course title, department, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* TAB 1: Generated AI Courses (Editable Modules & Video Lessons) */}
      {activeTab === 'generated' && (
        <>
          {filteredGenerated.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {filteredGenerated.map((course) => (
                <div
                  key={course.id}
                  className="lecturer-stat-card"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: course.visibility === 'PUBLIC' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: course.visibility === 'PUBLIC' ? '#34d399' : '#fbbf24',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {course.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
                        {course.visibility || 'PUBLIC'}
                      </span>

                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                      }}>
                        {course.targetDifficulty || 'INTERMEDIATE'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: 6, lineHeight: 1.3 }}>
                      {course.title}
                    </h3>

                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 14 }}>
                      Department: {course.department || 'Computer Science'} • {course.modules?.length || 0} Modules
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 10,
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      style={{
                        flex: 1,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: 'var(--bg-elevated, #1c1f2e)',
                        border: '1px solid var(--border, #2a2d3a)',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Eye size={14} color="#818cf8" /> Student View
                    </button>

                    <button
                      onClick={() => {
                        setEditingTarget(course);
                        setIsEditModalOpen(true);
                      }}
                      className="btn-upload-material"
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        padding: '8px 12px',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit3 size={14} /> Review & Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lecturer-section">
              <div className="empty-state-container">
                <div className="empty-state-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <Sparkles size={28} />
                </div>
                <h3 className="empty-state-title">No Personalized Courses Found</h3>
                <p className="empty-state-text">
                  Synthesize a personalized course from uploaded lecture notes to manage and edit module content and video lessons.
                </p>
                <button 
                  className="btn-upload-material"
                  style={{ margin: '0 auto' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={16} /> Create Course
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Institutional Academic Courses */}
      {activeTab === 'academic' && (
        <>
          {filteredAcademic.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredAcademic.map((course) => (
                <div
                  key={course.id}
                  className="lecturer-stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/lecturer/courses/detail/${course.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                    }}>
                      {course.code}
                    </span>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: course.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: course.status === 'PUBLISHED' ? '#34d399' : '#fbbf24',
                    }}>
                      {course.status || 'PUBLISHED'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 8, lineHeight: 1.3 }}>
                    {course.title}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 16 }}>
                    {course.programme} • {course.level} • {course.semester}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.8rem',
                    color: '#64748b',
                  }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={14} style={{ color: '#818cf8' }} /> {course._count?.materials || 0} Materials
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={14} style={{ color: '#34d399' }} /> {course._count?.syllabi || 0} Syllabus
                      </span>
                    </div>
                    <ChevronRight size={16} style={{ color: '#818cf8' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lecturer-section">
              <div className="empty-state-container">
                <div className="empty-state-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  <GraduationCap size={28} />
                </div>
                <h3 className="empty-state-title">No Academic Courses Created</h3>
                <p className="empty-state-text">
                  Create your academic courses to organize department syllabi, lecture notes, and reference materials.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCourses}
      />

      {/* Live Content & Video Reviewer / Editor Modal */}
      {editingTarget && (
        <EditCourseContentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTarget(null);
          }}
          courseId={editingTarget.id}
          courseTitle={editingTarget.title}
          onSaved={fetchCourses}
        />
      )}
    </div>
  );
};

export default LecturerCourses;

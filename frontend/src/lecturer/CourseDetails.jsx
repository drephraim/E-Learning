import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import UploadMaterialModal from './UploadMaterialModal';
import EditCourseContentModal from './EditCourseContentModal';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Building2, 
  User, 
  FileCheck,
  Trash2,
  Lock,
  Globe,
  Edit3,
  Eye,
  Sparkles,
  Layers,
  Video
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Created Courses State & Content Editor Target
  const [createdCourses, setCreatedCourses] = useState([]);
  const [isEditContentModalOpen, setIsEditContentModalOpen] = useState(false);
  const [editingCourseTarget, setEditingCourseTarget] = useState(null);

  const fetchCourseDetail = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/courses/detail/${id}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      }
    } catch (err) {
      console.error('Error fetching course detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatedCourses = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/courses/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedCourses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching created courses:', err);
    }
  };

  useEffect(() => {
    fetchCourseDetail();
    fetchCreatedCourses();
  }, [id, currentUser, dbUser]);

  if (loading) {
    return (
      <div className="lecturer-content" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#94a3b8' }}>Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="lecturer-content">
        <button className="form-input" onClick={() => navigate('/lecturer/courses')} style={{ width: 'auto', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Courses
        </button>
        <div className="empty-state-container">
          <h3>Course Not Found</h3>
        </div>
      </div>
    );
  }

  const syllabusMaterial = course.materials?.find((m) => m.materialType === 'COURSE_SYLLABUS');
  const lectureNotes = course.materials?.filter((m) => m.materialType === 'LECTURE_NOTES') || [];
  const researchPapers = course.materials?.filter((m) => m.materialType === 'RESEARCH_PAPER') || [];
  const otherMaterials = course.materials?.filter((m) => !['COURSE_SYLLABUS', 'LECTURE_NOTES', 'RESEARCH_PAPER'].includes(m.materialType)) || [];

  return (
    <div className="lecturer-content">
      {/* Top Back Navigation */}
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={() => navigate('/lecturer/courses')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#818cf8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.88rem',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>
      </div>

      {/* Course Header Banner */}
      <div className="lecturer-section" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #0d101a 100%)', marginBottom: 24 }}>
        <div className="lecturer-title-row" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 800,
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
              }}>
                {course.code}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {course.programme} • {course.level}
              </span>
            </div>
            <h1 className="lecturer-greeting" style={{ fontSize: '2rem' }}>{course.title}</h1>
            <p className="lecturer-subtitle">
              {course.semester} ({course.academicYear}) • Lecturer: Dr. {dbUser?.lastName || course.lecturer?.name || 'Lecturer'}
            </p>
          </div>

          <button 
            className="btn-upload-material"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus size={18} /> Upload Material
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
          {[
            { id: 'materials', label: 'Materials' },
            { id: 'syllabus', label: 'Syllabus' },
            { id: 'overview', label: 'Overview' },
            { id: 'courses_created', label: 'Courses Created' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === tab.id ? 'white' : '#94a3b8',
                padding: '8px 16px 12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Materials */}
      {activeTab === 'materials' && (
        <div className="lecturer-section">
          <div className="section-header">
            <h2 className="section-title">Course Academic Materials</h2>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Total: {course.materials?.length || 0} files
            </span>
          </div>

          {/* Grouped Categorized View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Syllabus Category */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 10 }}>
                Course Syllabus
              </h4>
              {syllabusMaterial ? (
                <div 
                  className="material-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/lecturer/materials/detail/${syllabusMaterial.id}`)}
                >
                  <div className="material-info">
                    <CheckCircle2 size={18} style={{ color: '#34d399' }} />
                    <div>
                      <div className="material-title">{syllabusMaterial.title}</div>
                      <div className="material-meta">{syllabusMaterial.fileName} ({Math.round(syllabusMaterial.fileSize / 1024)} KB)</div>
                    </div>
                  </div>
                  <span className="material-badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                    ✓ Ready
                  </span>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, fontSize: '0.85rem', color: '#64748b' }}>
                  No syllabus uploaded yet. Upload syllabus to enable curriculum alignment.
                </div>
              )}
            </div>

            {/* Lecture Notes Category */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: 10 }}>
                Lecture Notes ({lectureNotes.length})
              </h4>
              {lectureNotes.length > 0 ? (
                <div className="materials-list">
                  {lectureNotes.map((mat) => (
                    <div 
                      key={mat.id} 
                      className="material-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/lecturer/materials/detail/${mat.id}`)}
                    >
                      <div className="material-info">
                        <FileText size={18} style={{ color: '#818cf8' }} />
                        <div>
                          <div className="material-title">{mat.title}</div>
                          <div className="material-meta">{mat.fileName} • {mat.documentContent?.wordCount || 0} words</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {mat.visibility === 'AVAILABLE' ? (
                          <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Globe size={12} /> Student Access
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={12} /> Private
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, fontSize: '0.85rem', color: '#64748b' }}>
                  No lecture notes uploaded.
                </div>
              )}
            </div>

            {/* Research Papers & Other */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', marginBottom: 10 }}>
                Research Papers & Reference Materials ({researchPapers.length + otherMaterials.length})
              </h4>
              {[...researchPapers, ...otherMaterials].length > 0 ? (
                <div className="materials-list">
                  {[...researchPapers, ...otherMaterials].map((mat) => (
                    <div 
                      key={mat.id} 
                      className="material-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/lecturer/materials/detail/${mat.id}`)}
                    >
                      <div className="material-info">
                        <FileCheck size={18} style={{ color: '#c084fc' }} />
                        <div>
                          <div className="material-title">{mat.title}</div>
                          <div className="material-meta">{mat.fileName} • {mat.materialType}</div>
                        </div>
                      </div>
                      <span className="material-badge">{mat.visibility}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, fontSize: '0.85rem', color: '#64748b' }}>
                  No research papers or reference materials uploaded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Syllabus */}
      {activeTab === 'syllabus' && (
        <div className="lecturer-section">
          {course.syllabi && course.syllabi.length > 0 ? (
            <div>
              <div className="section-header">
                <h2 className="section-title">{course.syllabi[0].title}</h2>
                <button 
                  className="btn-upload-material" 
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  onClick={() => navigate(`/lecturer/syllabi/detail/${course.syllabi[0].id}`)}
                >
                  Inspect & Edit Structure
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: 12 }}>COURSE OBJECTIVES</h4>
                  <ul style={{ paddingLeft: 20, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {course.syllabi[0].objectives?.map((obj) => (
                      <li key={obj.id}>{obj.text}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: 12 }}>WEEKLY TOPICS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {course.syllabi[0].topics?.map((top) => (
                      <div key={top.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.88rem', color: 'white' }}>
                        <span style={{ color: '#818cf8', fontWeight: 700, marginRight: 8 }}>Week {top.weekNumber}:</span>
                        {top.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-container">
              <BookOpen size={28} style={{ color: '#818cf8', margin: '0 auto 12px' }} />
              <h3>No Extracted Syllabus Available</h3>
              <p className="empty-state-text">Upload a syllabus document to automatically extract objectives, outcomes, and topics.</p>
              <button className="btn-upload-material" style={{ margin: '0 auto' }} onClick={() => setIsUploadModalOpen(true)}>
                <Plus size={16} /> Upload Syllabus
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Overview */}
      {activeTab === 'overview' && (
        <div className="lecturer-section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Course Description & Overview</h2>
          <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {course.description || 'No description provided for this academic course.'}
          </p>
        </div>
      )}

      {/* Tab 4: Courses Created */}
      {activeTab === 'courses_created' && (
        <div className="lecturer-section">
          <div className="section-header">
            <div>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="#818cf8" /> Personalized Courses Created
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
                Review content, edit chapter text, add or remove video lessons for synthesized courses. All changes reflect live on student pages.
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Total: {createdCourses.length} course(s)
            </span>
          </div>

          {createdCourses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {createdCourses.map((c) => (
                <div 
                  key={c.id}
                  style={{
                    background: 'linear-gradient(160deg, #131728 0%, #0d101a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: c.visibility === 'PUBLIC' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: c.visibility === 'PUBLIC' ? '#34d399' : '#fbbf24',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {c.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
                          {c.visibility || 'PUBLIC'}
                        </span>

                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                        }}>
                          {c.targetDifficulty || 'INTERMEDIATE'}
                        </span>

                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Grounding: {c.groundingMode || 'HYBRID'} • Creator: Dr. {dbUser?.lastName || course.lecturer?.name || 'Lecturer'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        {c.title}
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: 4, margin: 0 }}>
                        Contains {c.modules?.length || 0} structured chapters/modules with interactive quizzes & videos.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => navigate(`/course/${c.id}`)}
                        className="form-input"
                        style={{
                          width: 'auto',
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.12)'
                        }}
                      >
                        <Eye size={14} color="#818cf8" /> View Student Page
                      </button>

                      <button
                        onClick={() => {
                          setEditingCourseTarget(c);
                          setIsEditContentModalOpen(true);
                        }}
                        className="btn-upload-material"
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.82rem'
                        }}
                      >
                        <Edit3 size={14} /> Review & Edit Content
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-container">
              <Sparkles size={32} color="#818cf8" style={{ margin: '0 auto 12px' }} />
              <h3>No Personalized Courses Created Yet</h3>
              <p className="empty-state-text">
                Synthesize a course from your uploaded lecture notes to publish personalized learning paths for students.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Course Content Editor Modal */}
      {editingCourseTarget && (
        <EditCourseContentModal
          isOpen={isEditContentModalOpen}
          onClose={() => {
            setIsEditContentModalOpen(false);
            setEditingCourseTarget(null);
          }}
          courseId={editingCourseTarget.id}
          courseTitle={editingCourseTarget.title}
          onSaved={fetchCreatedCourses}
        />
      )}

      {/* Upload Material Modal pre-linked to course */}
      <UploadMaterialModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchCourseDetail}
        defaultCourseId={course.id}
      />
    </div>
  );
};

export default CourseDetails;

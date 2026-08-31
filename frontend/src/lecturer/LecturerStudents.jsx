import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import { 
  Users, 
  UserPlus, 
  BookOpen, 
  GraduationCap, 
  Search, 
  Globe, 
  Lock, 
  X, 
  CheckCircle2, 
  Mail, 
  Trash2, 
  Sparkles,
  Building2
} from 'lucide-react';
import CreateCourseModal from './CreateCourseModal';

const LecturerStudents = () => {
  const { currentUser, dbUser } = useAuth();
  const [data, setData] = useState({
    department: 'Computer Science',
    enrollments: [],
    departmentStudents: [],
    courses: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Enroll Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [submittingEnroll, setSubmittingEnroll] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState({ type: '', text: '' });

  // Personalized Course Generation Modal State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const userId = currentUser?.uid || dbUser?.id;

  const fetchStudentsData = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/students/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        if (resData.courses && resData.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(resData.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch students data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, [userId]);

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !studentEmail.trim()) {
      setEnrollMsg({ type: 'error', text: 'Please select a course and enter a student email.' });
      return;
    }

    setSubmittingEnroll(true);
    setEnrollMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/students/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          studentEmail: studentEmail.trim(),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setEnrollMsg({ type: 'success', text: resData.message });
        setStudentEmail('');
        fetchStudentsData();
      } else {
        setEnrollMsg({ type: 'error', text: resData.message || 'Enrollment failed.' });
      }
    } catch (err) {
      setEnrollMsg({ type: 'error', text: err.message || 'Failed to enroll student.' });
    } finally {
      setSubmittingEnroll(false);
    }
  };

  const handleUnenroll = async (courseId, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from this course?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/students/unenroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          courseId,
          studentEmail: email,
        }),
      });

      if (res.ok) {
        fetchStudentsData();
      }
    } catch (err) {
      console.error('Failed to unenroll student:', err);
    }
  };

  const handleToggleVisibility = async (courseId, currentVisibility) => {
    const newVisibility = currentVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/courses/${courseId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (res.ok) {
        fetchStudentsData();
      }
    } catch (err) {
      console.error('Failed to update course visibility:', err);
    }
  };

  const filteredEnrollments = data.enrollments.filter((e) => {
    const search = searchTerm.toLowerCase();
    const studentName = e.student?.name || '';
    return (
      e.studentEmail.toLowerCase().includes(search) ||
      studentName.toLowerCase().includes(search) ||
      e.course?.title.toLowerCase().includes(search)
    );
  });

  return (
    <div className="lecturer-content">
      {/* Page Header Banner */}
      <div className="lecturer-title-row">
        <div>
          <div className="lecturer-header-badge">
            <Users size={12} /> Student Access & Course Enrolments
          </div>
          <h1 className="lecturer-greeting">Students & Course Enrolments</h1>
          <p className="lecturer-subtitle">
            <Building2 size={14} style={{ display: 'inline', marginRight: 4, color: '#818cf8' }} />
            Department of {dbUser?.lecturerProfile?.department || data.department}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="form-input"
            onClick={() => setIsCourseModalOpen(true)}
            style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Sparkles size={16} style={{ color: '#818cf8' }} /> Create Personalized Course
          </button>

          <button
            className="btn-upload-material"
            onClick={() => {
              setEnrollMsg({ type: '', text: '' });
              setIsEnrollModalOpen(true);
            }}
          >
            <UserPlus size={18} /> Enroll Student by Email
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="lecturer-stats-grid">
        <div className="lecturer-stat-card">
          <div className="stat-icon-wrapper indigo">
            <Users size={22} />
          </div>
          <div className="stat-label">Enrolled Students</div>
          <div className="stat-value-container">
            <span className="stat-number">{data.enrollments.length}</span>
            <span className="stat-unit">Direct Invites</span>
          </div>
        </div>

        <div className="lecturer-stat-card">
          <div className="stat-icon-wrapper emerald">
            <GraduationCap size={22} />
          </div>
          <div className="stat-label">Lecturer Courses</div>
          <div className="stat-value-container">
            <span className="stat-number">{data.courses.length}</span>
            <span className="stat-unit">Created</span>
          </div>
        </div>

        <div className="lecturer-stat-card">
          <div className="stat-icon-wrapper purple">
            <Globe size={22} />
          </div>
          <div className="stat-label">Public Courses</div>
          <div className="stat-value-container">
            <span className="stat-number">{data.courses.filter((c) => c.visibility === 'PUBLIC').length}</span>
            <span className="stat-unit">Dept Accessible</span>
          </div>
        </div>

        <div className="lecturer-stat-card">
          <div className="stat-icon-wrapper amber">
            <Lock size={22} />
          </div>
          <div className="stat-label">Private Courses</div>
          <div className="stat-value-container">
            <span className="stat-number">{data.courses.filter((c) => c.visibility === 'PRIVATE').length}</span>
            <span className="stat-unit">Invite Only</span>
          </div>
        </div>
      </div>

      {/* Main Content: Enrolled Students List */}
      <div className="lecturer-section" style={{ marginTop: 24 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="section-title">Course Enrolments ({filteredEnrollments.length})</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Students invited by email or enrolled directly in your personalized courses.
            </p>
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by student email, name, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 36, fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {filteredEnrollments.length > 0 ? (
          <div className="materials-list">
            {filteredEnrollments.map((item) => (
              <div key={item.id} className="material-item" style={{ cursor: 'default' }}>
                <div className="material-info">
                  <div 
                    style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 10, 
                      background: 'rgba(99, 102, 241, 0.15)', 
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      color: '#818cf8',
                      fontWeight: 700
                    }}
                  >
                    🎓
                  </div>

                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.student?.name || item.studentEmail}
                      <span 
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '1px 8px', 
                          borderRadius: 4, 
                          fontWeight: 700, 
                          background: item.status === 'ENROLLED' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                          color: item.status === 'ENROLLED' ? '#34d399' : '#fbbf24',
                          border: item.status === 'ENROLLED' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)'
                        }}
                      >
                        {item.status === 'ENROLLED' ? 'ENROLLED' : 'INVITE SENT'}
                      </span>
                    </div>

                    <div className="material-meta" style={{ marginTop: 3 }}>
                      <Mail size={12} style={{ display: 'inline', marginRight: 4, color: '#94a3b8' }} />
                      {item.studentEmail} • Course: <strong style={{ color: '#cbd5e1' }}>{item.course?.title}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => handleToggleVisibility(item.course?.id, item.course?.visibility)}
                    style={{
                      background: item.course?.visibility === 'PUBLIC' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                      border: item.course?.visibility === 'PUBLIC' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                      color: item.course?.visibility === 'PUBLIC' ? '#60a5fa' : '#c084fc',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Click to toggle course visibility (Public vs Private)"
                  >
                    {item.course?.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
                    {item.course?.visibility === 'PUBLIC' ? 'PUBLIC (Dept Access)' : 'PRIVATE (Invite Only)'}
                  </button>

                  <button
                    onClick={() => handleUnenroll(item.course?.id, item.studentEmail)}
                    className="preview-btn"
                    style={{ color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    title="Remove student enrollment"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <UserPlus size={24} />
            </div>
            <h3 className="empty-state-title">No Enrolled Students Yet</h3>
            <p className="empty-state-text">
              Enroll students directly using their email address to grant them exclusive access to your personalized academic courses.
            </p>
            <button
              className="btn-upload-material"
              style={{ margin: '0 auto' }}
              onClick={() => setIsEnrollModalOpen(true)}
            >
              <UserPlus size={16} /> Enroll First Student
            </button>
          </div>
        )}
      </div>

      {/* Modal: Enroll Student By Email */}
      {isEnrollModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEnrollModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="stat-icon-wrapper indigo" style={{ margin: 0, width: 36, height: 36 }}>
                  <UserPlus size={20} />
                </div>
                <h3 className="modal-title">Enroll Student by Email</h3>
              </div>
              <button className="close-btn" onClick={() => setIsEnrollModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {enrollMsg.text && (
              <div 
                className="auth-error" 
                style={{ 
                  marginBottom: 16, 
                  background: enrollMsg.type === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: enrollMsg.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  color: enrollMsg.type === 'success' ? '#34d399' : '#f87171'
                }}
              >
                <span>{enrollMsg.type === 'success' ? '✅' : '⚠️'} {enrollMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="auth-form">
              <div className="form-group">
                <label>SELECT LECTURER COURSE</label>
                {data.courses.length > 0 ? (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="form-select"
                  >
                    {data.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.visibility === 'PUBLIC' ? 'Public Dept Access' : 'Private Invite Only'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#f87171', padding: '6px 0' }}>
                    No created courses found. Please create a personalized course first.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>STUDENT EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="form-input"
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  If the student is already registered, they get instant access. If not, an enrollment invitation is linked to their email for when they sign up!
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="form-input"
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEnroll || !selectedCourseId}
                  className="auth-submit"
                  style={{ flex: 2, marginTop: 0 }}
                >
                  {submittingEnroll ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Personalized Course Modal */}
      <CreateCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={fetchStudentsData}
      />
    </div>
  );
};

export default LecturerStudents;

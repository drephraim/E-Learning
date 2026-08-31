import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import { 
  User, 
  Building2, 
  BookOpen, 
  Mail, 
  Phone, 
  Clock, 
  Award, 
  Edit3, 
  CheckCircle2, 
  Plus, 
  X, 
  Save, 
  GraduationCap,
  Sparkles
} from 'lucide-react';

const LecturerProfile = () => {
  const { currentUser, dbUser } = useAuth();
  const userId = dbUser?.id || currentUser?.uid;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Dr.');
  const [department, setDepartment] = useState('Computer Science');
  const [secondaryDepartments, setSecondaryDepartments] = useState('');
  const [coursesTaught, setCoursesTaught] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/profile/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        populateForm(data);
      }
    } catch (err) {
      console.error('Error fetching lecturer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    setName(data.name || dbUser?.name || '');
    setTitle(data.lecturerProfile?.title || 'Dr.');
    setDepartment(data.lecturerProfile?.department || 'Computer Science');
    setSecondaryDepartments(
      Array.isArray(data.lecturerProfile?.secondaryDepartments)
        ? data.lecturerProfile.secondaryDepartments.join(', ')
        : ''
    );
    setCoursesTaught(
      Array.isArray(data.lecturerProfile?.coursesTaught)
        ? data.lecturerProfile.coursesTaught.join(', ')
        : ''
    );
    setSpecialization(data.lecturerProfile?.specialization || '');
    setOfficeHours(data.lecturerProfile?.officeHours || '');
    setPhone(data.lecturerProfile?.phone || '');
    setBio(data.lecturerProfile?.bio || '');
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    const secDepts = secondaryDepartments
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const crsTaught = coursesTaught
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/profile/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          department: department.trim(),
          secondaryDepartments: secDepts,
          coursesTaught: crsTaught,
          specialization: specialization.trim(),
          officeHours: officeHours.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfileData(updated);
        setSuccessMsg('Profile updated successfully!');
        setIsEditModalOpen(false);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Connection error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="lecturer-content" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#94a3b8' }}>Loading academic profile...</p>
      </div>
    );
  }

  const lp = profileData?.lecturerProfile || {};
  const currentTitle = lp.title || 'Dr.';
  const currentName = profileData?.name || dbUser?.name || 'Lecturer';
  const primaryDept = lp.department || dbUser?.department || 'Computer Science';
  const secDeptsList = Array.isArray(lp.secondaryDepartments) ? lp.secondaryDepartments : [];
  const coursesTaughtList = Array.isArray(lp.coursesTaught) ? lp.coursesTaught : [];

  return (
    <div className="lecturer-content">
      {/* Header Banner */}
      <div 
        className="lecturer-section" 
        style={{ 
          background: 'linear-gradient(160deg, #1e1b4b 0%, #0d101a 100%)', 
          marginBottom: 28,
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}>
              👨‍🏫
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="lecturer-header-badge" style={{ margin: 0 }}>
                  <CheckCircle2 size={13} /> {lp.verificationStatus || 'VERIFIED LECTURER'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {dbUser?.institution || 'University E-Learning Portal'}
                </span>
              </div>
              <h1 className="lecturer-greeting" style={{ fontSize: '1.8rem', marginBottom: 2 }}>
                {currentTitle} {currentName}
              </h1>
              <p className="lecturer-subtitle">
                {primaryDept} Department {secDeptsList.length > 0 && `• Cross-Appointed in ${secDeptsList.join(', ')}`}
              </p>
            </div>
          </div>

          <button 
            className="btn-upload-material"
            onClick={() => setIsEditModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
          >
            <Edit3 size={16} /> Edit Academic Profile
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '12px 16px', borderRadius: 12, color: '#34d399', marginBottom: 24, fontSize: '0.9rem', fontWeight: 600 }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Grid Layout for Profile Details */}
      <div className="dashboard-main-grid">
        {/* Left Column: Academic Departments & Courses Taught */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Primary & Secondary Departments */}
          <div className="lecturer-section">
            <div className="section-header">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="#818cf8" /> Departments & Affiliations
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 14, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: 4 }}>
                  Primary Department
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                  {primaryDept}
                </div>
              </div>

              {secDeptsList.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 }}>
                    Secondary / Joint Departments ({secDeptsList.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {secDeptsList.map((dept, idx) => (
                      <span 
                        key={idx}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '0.85rem',
                          color: '#e2e8f0',
                          fontWeight: 600
                        }}
                      >
                        🏛️ {dept}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: '#64748b', fontStyle: 'italic' }}>
                  No secondary department affiliations added yet. Click "Edit Academic Profile" to add joint departments.
                </p>
              )}
            </div>
          </div>

          {/* Courses Taught */}
          <div className="lecturer-section">
            <div className="section-header">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} color="#34d399" /> Courses Taught
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {coursesTaughtList.length} course(s) assigned
              </span>
            </div>

            {coursesTaughtList.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {coursesTaughtList.map((courseItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 12,
                      background: 'rgba(52, 211, 153, 0.08)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.9rem',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    <GraduationCap size={16} color="#34d399" />
                    {courseItem}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-container" style={{ padding: '24px 16px' }}>
                <BookOpen size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                  No courses taught listed. You can add multiple courses you teach across departments.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact, Office Hours & Academic Bio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Contact & Office Hours */}
          <div className="lecturer-section">
            <h3 className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="#fbbf24" /> Contact & Office Hours
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#818cf8" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>OFFICIAL EMAIL</div>
                  <div style={{ fontSize: '0.88rem', color: 'white', fontWeight: 600 }}>{profileData?.email || dbUser?.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="#34d399" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>PHONE NUMBER</div>
                  <div style={{ fontSize: '0.88rem', color: 'white', fontWeight: 600 }}>{lp.phone || 'Not specified'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#fbbf24" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>OFFICE HOURS & ROOM</div>
                  <div style={{ fontSize: '0.88rem', color: 'white', fontWeight: 600 }}>{lp.officeHours || 'Mon & Wed 2:00 PM - 4:00 PM (Room 304)'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={16} color="#c084fc" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>SPECIALIZATION / RESEARCH</div>
                  <div style={{ fontSize: '0.88rem', color: 'white', fontWeight: 600 }}>{lp.specialization || 'Artificial Intelligence & Software Engineering'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Bio */}
          <div className="lecturer-section">
            <h3 className="section-title" style={{ marginBottom: 12 }}>Academic Biography</h3>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              {lp.bio || `${currentTitle} ${currentName} is a lecturer in the ${primaryDept} Department, specializing in modern curriculum design, AI personalized learning synthesis, and academic research.`}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit3 size={20} color="#818cf8" />
                <h3 className="modal-title" style={{ fontSize: '1.25rem', margin: 0 }}>Edit Academic Profile</h3>
              </div>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="auth-error" style={{ marginBottom: 14 }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>ACADEMIC TITLE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dr. / Prof. / Ing."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>PRIMARY DEPARTMENT</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>SECONDARY DEPARTMENTS (Comma-Separated)</label>
                <input
                  type="text"
                  value={secondaryDepartments}
                  onChange={(e) => setSecondaryDepartments(e.target.value)}
                  placeholder="e.g. Information Technology, Data Science, Software Engineering"
                  className="form-input"
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                  Add multiple departments if you are cross-appointed or teach across faculties.
                </span>
              </div>

              <div className="form-group">
                <label>COURSES TAUGHT (Comma-Separated)</label>
                <input
                  type="text"
                  value={coursesTaught}
                  onChange={(e) => setCoursesTaught(e.target.value)}
                  placeholder="e.g. CS 401: Machine Learning, IT 302: Web Systems, CS 201: Algorithms"
                  className="form-input"
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                  List all courses you teach so students can identify your curriculum.
                </span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>SPECIALIZATION / RESEARCH FOCUS</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Machine Learning, Cloud Systems"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>PHONE NUMBER</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +233 24 000 0000"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>OFFICE HOURS & LOCATION</label>
                <input
                  type="text"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="e.g. Mon & Wed 2:00 PM - 4:00 PM (Science Block Rm 304)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>ACADEMIC BIOGRAPHY</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Write a brief overview of your academic background and teaching philosophy..."
                  className="form-input"
                  style={{ height: 'auto', padding: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="form-input"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ width: 'auto', background: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-upload-material"
                  style={{ width: 'auto' }}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerProfile;

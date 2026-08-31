import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  Globe, 
  Lock, 
  Sparkles, 
  Mail, 
  FileText, 
  ShieldCheck, 
  BookOpen, 
  CheckSquare, 
  Square,
  Search
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../AuthContext';

const CreateCourseModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, dbUser } = useAuth();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState(dbUser?.lecturerProfile?.department || 'Computer Science');
  const [programme, setProgramme] = useState('BSc Computer Science');
  const [level, setLevel] = useState('Level 400');
  const [semester, setSemester] = useState('Semester 1');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [visibility, setVisibility] = useState('PUBLIC'); // 'PUBLIC' | 'PRIVATE'
  const [invitedEmails, setInvitedEmails] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE'); // 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  const [chapters, setChapters] = useState(5); // number of chapters to generate
  
  // AI Personalized Course Generation & Grounding Options
  const [synthesizeAiCourse, setSynthesizeAiCourse] = useState(true);
  const [enableOpenAlexValidation, setEnableOpenAlexValidation] = useState(true); // OpenAlex Database Grounding
  const [materials, setMaterials] = useState([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [materialSearch, setMaterialSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = currentUser?.uid || dbUser?.id;

  // Fetch lecturer uploaded materials
  useEffect(() => {
    if (!isOpen) return;
    const activeUserId = dbUser?.id || currentUser?.uid;
    if (!activeUserId) return;

    const fetchMaterialsForUser = async (id) => {
      try {
        const res = await fetch(`${API_BASE_URL}/lecturer/materials/${id}`, {
          headers: { 'x-user-id': id },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.materials && Array.isArray(data.materials) ? data.materials : []);
          return list;
        }
      } catch (err) {
        console.error(`Failed to fetch materials for ${id}:`, err);
      }
      return null;
    };

    (async () => {
      let list = await fetchMaterialsForUser(activeUserId);
      
      // Fallback check if dbUser.id and currentUser.uid differ
      if (!list && currentUser?.uid && dbUser?.id && currentUser.uid !== dbUser.id) {
        const fallbackId = activeUserId === dbUser.id ? currentUser.uid : dbUser.id;
        list = await fetchMaterialsForUser(fallbackId);
      }

      if (list && Array.isArray(list)) {
        setMaterials(list);
        setSelectedMaterialIds(list.map((m) => m.id));
      }
    })();
  }, [isOpen, dbUser, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a course title.');
      return;
    }

    setLoading(true);
    setError('');

    const parsedEmails = invitedEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'));

    // Determine AI Grounding Mode based on lecturer selections
    let groundingMode = 'AI_ONLY';
    const hasSelectedMaterials = selectedMaterialIds.length > 0;

    if (hasSelectedMaterials && enableOpenAlexValidation) {
      groundingMode = 'HYBRID'; // Grounded in both uploaded lecture notes + OpenAlex database!
    } else if (hasSelectedMaterials) {
      groundingMode = 'INSTITUTIONAL'; // Grounded in uploaded notes
    } else if (enableOpenAlexValidation) {
      groundingMode = 'EXTERNAL'; // Grounded in OpenAlex database
    }

    try {
      if (synthesizeAiCourse) {
        // Synthesize AI Course using selected materials & OpenAlex database validation
        const res = await fetch(`${API_BASE_URL}/courses/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            topic: title.trim(),
            difficulty: level === 'Level 100' ? 'BEGINNER' : level === 'Level 400' ? 'ADVANCED' : 'INTERMEDIATE',
            chapters: Number(chapters) || 4,
            includeYoutube: true,
            groundingMode,
            visibility,
            department,
            academicMaterialIds: selectedMaterialIds,
            invitedEmails: parsedEmails,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'AI Course generation failed');
        }
      } else {
        // Create Academic Course Shell
        const res = await fetch(`${API_BASE_URL}/lecturer/courses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            userId,
            title: title.trim(),
            code: (code || title.substring(0, 6)).trim().toUpperCase(),
            department,
            programme,
            level,
            semester,
            academicYear,
            description: description.trim(),
            visibility,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterialCheck = (id) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllMaterials = () => {
    setSelectedMaterialIds(materials.map((m) => m.id));
  };

  const deselectAllMaterials = () => {
    setSelectedMaterialIds([]);
  };

  const filteredMaterials = materials.filter((m) =>
    m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.materialType.toLowerCase().includes(materialSearch.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon-wrapper purple" style={{ margin: 0, width: 36, height: 36 }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className="modal-title">Create Lecturer Course</h3>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
                Synthesize personalized courses from lecture materials with OpenAlex scholarly validation.
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Mode Toggle */}
          <div className="form-group">
            <label className="toggle-container" style={{ cursor: 'pointer', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '12px 14px', borderRadius: 10 }}>
              <div className="toggle-label" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'white', fontSize: '0.88rem' }}>
                  <Sparkles size={16} style={{ color: '#818cf8' }} /> Synthesize AI Course from Uploaded Notes
                </div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Generates structured modules, quizzes, and learning objectives grounded in your uploaded materials.
                </span>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={synthesizeAiCourse}
                  onChange={(e) => setSynthesizeAiCourse(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>COURSE TITLE</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Machine Learning & Neural Networks"
              className="form-input"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>COURSE CODE</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IT 401"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>DEPARTMENT</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="form-input"
              />
            </div>
          </div>

          {/* Difficulty & Chapters Selection Grid */}
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label>DIFFICULTY LEVEL</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="form-input"
                style={{ cursor: 'pointer', background: '#1c1f2e' }}
              >
                <option value="BEGINNER">BEGINNER (Introductory)</option>
                <option value="INTERMEDIATE">INTERMEDIATE (Standard / Core)</option>
                <option value="ADVANCED">ADVANCED (In-Depth / Mastery)</option>
              </select>
            </div>

            <div className="form-group">
              <label>NUMBER OF CHAPTERS</label>
              <select
                value={chapters}
                onChange={(e) => setChapters(Number(e.target.value))}
                className="form-input"
                style={{ cursor: 'pointer', background: '#1c1f2e' }}
              >
                <option value={3}>3 Chapters (Short Overview)</option>
                <option value={4}>4 Chapters</option>
                <option value={5}>5 Chapters (Recommended Standard)</option>
                <option value={6}>6 Chapters</option>
                <option value={7}>7 Chapters</option>
                <option value={8}>8 Chapters</option>
                <option value={10}>10 Chapters (Comprehensive Course)</option>
              </select>
            </div>
          </div>

          {/* OpenAlex External Scholarly Database Validation Toggle */}
          {synthesizeAiCourse && (
            <div className="form-group">
              <label className="toggle-container" style={{ cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 14px', borderRadius: 10 }}>
                <div className="toggle-label" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#34d399', fontSize: '0.88rem' }}>
                    <ShieldCheck size={16} /> Validate Authenticity with OpenAlex Database
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Cross-references course materials and syllabus topics against 250M+ peer-reviewed papers for academic validation & citations.
                  </span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={enableOpenAlexValidation}
                    onChange={(e) => setEnableOpenAlexValidation(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          )}

          {/* Uploaded Materials Selection List */}
          {synthesizeAiCourse && (
            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: 14, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#34d399', fontSize: '0.86rem' }}>
                  <FileText size={15} /> SELECT UPLOADED MATERIALS ({selectedMaterialIds.length}/{materials.length})
                </div>

                {materials.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={selectAllMaterials}
                      style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>•</span>
                    <button
                      type="button"
                      onClick={deselectAllMaterials}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {materials.length > 0 ? (
                <>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Search uploaded materials..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 30, fontSize: '0.8rem', height: 32 }}
                    />
                  </div>

                  <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                    {filteredMaterials.map((m) => {
                      const isSelected = selectedMaterialIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleMaterialCheck(m.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: isSelected ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.03)',
                            border: isSelected ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isSelected ? <CheckSquare size={16} color="#34d399" /> : <Square size={16} color="#64748b" />}
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'white' }}>
                                {m.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {m.materialType ? m.materialType.replace(/_/g, ' ') : 'LECTURE NOTE'} • {m.fileName || 'Uploaded File'}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: m.processingStatus === 'READY' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(251, 191, 36, 0.18)',
                            color: m.processingStatus === 'READY' ? '#34d399' : '#fbbf24'
                          }}>
                            {m.processingStatus || 'READY'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px 12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 8, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 4px 0' }}>
                    No uploaded academic materials found yet.
                  </p>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    You can upload lecture notes in the Academic Materials tab, or use OpenAlex database validation.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Visibility Controls (Public vs Private) */}
          <div className="form-group">
            <label style={{ color: '#818cf8', fontWeight: 800 }}>COURSE VISIBILITY & ACCESS CONTROL</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                onClick={() => setVisibility('PUBLIC')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: visibility === 'PUBLIC' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: visibility === 'PUBLIC' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'white', fontSize: '0.86rem' }}>
                  <Globe size={16} style={{ color: '#60a5fa' }} /> PUBLIC
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.3 }}>
                  Accessible by any student in the <strong>{department}</strong> department.
                </div>
              </div>

              <div
                onClick={() => setVisibility('PRIVATE')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: visibility === 'PRIVATE' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: visibility === 'PRIVATE' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'white', fontSize: '0.86rem' }}>
                  <Lock size={16} style={{ color: '#c084fc' }} /> PRIVATE
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.3 }}>
                  Invite-only. Access restricted to students invited via email address.
                </div>
              </div>
            </div>
          </div>

          {/* Invited Student Email Addresses */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} style={{ color: '#818cf8' }} /> INVITE STUDENTS BY EMAIL (OPTIONAL / PRIVATE COURSES)
            </label>
            <input
              type="text"
              value={invitedEmails}
              onChange={(e) => setInvitedEmails(e.target.value)}
              placeholder="student1@university.edu, student2@university.edu"
              className="form-input"
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Separate multiple emails with commas. Invited students get direct access to this course!
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              className="form-input"
              style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
              style={{ flex: 2, marginTop: 0 }}
            >
              {loading ? 'Synthesizing & Validating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;

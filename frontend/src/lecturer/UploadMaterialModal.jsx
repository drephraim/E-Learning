import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../AuthContext';

const UploadMaterialModal = ({ isOpen, onClose, onSuccess, defaultCourseId = '' }) => {
  const { currentUser, dbUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState('COURSE_SYLLABUS');
  const [visibility, setVisibility] = useState('AVAILABLE'); // 'AVAILABLE' | 'PRIVATE'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultCourseId) setCourseId(defaultCourseId);
  }, [defaultCourseId]);

  useEffect(() => {
    const fetchCourses = async () => {
      const userId = currentUser?.uid || dbUser?.id;
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/lecturer/courses/${userId}`, {
          headers: { 'x-user-id': userId },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : (data.academicCourses || data.courses || []));
        }
      } catch (err) {
        console.error('Failed to fetch courses for upload modal', err);
      }
    };
    if (isOpen) fetchCourses();
  }, [isOpen, currentUser, dbUser]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const maxMb = 20;
      const oversized = newFiles.filter((f) => f.size > maxMb * 1024 * 1024);
      if (oversized.length > 0) {
        setError(`One or more files exceed the maximum allowed limit of ${maxMb} MB.`);
        return;
      }
      setSelectedFiles((prev) => {
        const combined = [...prev, ...newFiles];
        return combined.filter((f, idx, self) => idx === self.findIndex((t) => t.name === f.name));
      });
      setError('');
      if (selectedFiles.length === 0 && newFiles.length === 1 && !title) {
        setTitle(newFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const removeFile = (fileName) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please attach at least one document file (PDF, DOCX, PPTX, TXT).');
      return;
    }

    setLoading(true);
    setError('');
    const userId = currentUser?.uid || dbUser?.id;

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('userId', userId);
      if (title.trim()) formData.append('title', title.trim());
      formData.append('materialType', materialType);
      formData.append('visibility', visibility);
      if (courseId) formData.append('courseId', courseId);
      if (description) formData.append('description', description.trim());

      const res = await fetch(`${API_BASE_URL}/lecturer/materials/upload`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Upload failed with status ${res.status}`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload academic materials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon-wrapper indigo" style={{ margin: 0, width: 36, height: 36 }}>
              <UploadCloud size={20} />
            </div>
            <h3 className="modal-title">Upload Academic Materials</h3>
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
          <div className="form-grid">
            <div className="form-group">
              <label>ASSOCIATED COURSE</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="form-select"
              >
                <option value="">General Department Material</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>MATERIAL TYPE</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="form-select"
              >
                <option value="COURSE_SYLLABUS">Course Syllabus</option>
                <option value="COURSE_OUTLINE">Course Outline</option>
                <option value="LECTURE_NOTES">Lecture Notes</option>
                <option value="RESEARCH_PAPER">Research Paper</option>
                <option value="READING_MATERIAL">Reading Material</option>
                <option value="LAB_MANUAL">Lab Manual</option>
                <option value="ASSIGNMENT_GUIDE">Assignment Guide</option>
                <option value="OTHER">Other Academic Material</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>MATERIAL TITLE / BATCH NAME {selectedFiles.length > 1 && '(OPTIONAL FOR BATCH)'}</label>
            <input
              type="text"
              required={selectedFiles.length <= 1}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedFiles.length > 1 ? "Optional batch title prefix (defaults to file names)" : "e.g. Research Methods Course Syllabus 2026"}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>DESCRIPTION (OPTIONAL)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Official Level 400 syllabus and topic schedule"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>STUDENT VISIBILITY</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div
                className={`role-card ${visibility === 'PRIVATE' ? 'selected' : ''}`}
                style={{ padding: '12px 10px' }}
                onClick={() => setVisibility('PRIVATE')}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>🔒 Private</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Lecturer Only</div>
              </div>

              <div
                className={`role-card ${visibility === 'AVAILABLE' ? 'selected' : ''}`}
                style={{ padding: '12px 10px' }}
                onClick={() => setVisibility('AVAILABLE')}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399' }}>🌐 Available</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Student Accessible</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>DOCUMENT FILES (SELECT MULTIPLE - MAX 20 MB EACH)</label>
            <div 
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.4)'
              }}
              onClick={() => document.getElementById('academic-file-input').click()}
            >
              <input
                id="academic-file-input"
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <FileText size={32} style={{ color: '#818cf8', marginBottom: 8 }} />
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0, fontWeight: 600 }}>
                Click to select single or multiple documents
              </p>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Supported: PDF, DOCX, PPTX, PPT, TXT, MD
              </span>
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selected Files ({selectedFiles.length})
                </div>
                {selectedFiles.map((file) => (
                  <div
                    key={file.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                      <FileText size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || selectedFiles.length === 0}
              className="auth-submit"
              style={{ flex: 2, marginTop: 0 }}
            >
              {loading 
                ? 'Processing Documents...' 
                : selectedFiles.length > 1 
                  ? `Upload & Process (${selectedFiles.length} Files)` 
                  : 'Upload & Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterialModal;

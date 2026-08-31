import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  FileText, 
  Download, 
  Eye, 
  GraduationCap, 
  CheckCircle2, 
  User, 
  Building2, 
  FileCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from './config';

const InstitutionalCourseHubModal = ({ isOpen, onClose, courseId }) => {
  const [courseHub, setCourseHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCourseHub = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/courses/institutional-courses/${courseId}/materials`);
      if (res.ok) {
        const data = await res.json();
        setCourseHub(data);
      }
    } catch (err) {
      console.error('Error fetching institutional course materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      fetchCourseHub();
      setPreviewMaterial(null);
    }
  }, [isOpen, courseId]);

  const handlePreviewText = async (mat) => {
    setPreviewMaterial(mat);
    setPreviewLoading(true);
    setPreviewText('');
    try {
      const res = await fetch(`${API_BASE_URL}/courses/materials/${mat.id}/preview`);
      if (res.ok) {
        const data = await res.json();
        setPreviewText(data.preview || data.extractedText || 'No text preview available.');
      }
    } catch (err) {
      console.error('Error loading preview text:', err);
      setPreviewText('Failed to load document text preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = (matId, fileName) => {
    const downloadUrl = `${API_BASE_URL}/courses/materials/${matId}/download`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || 'Academic_Material';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const course = courseHub?.course || {};
  const materials = courseHub?.materials || [];
  const syllabusList = materials.filter((m) => m.materialType === 'COURSE_SYLLABUS' || m.isSyllabusOrOutline);
  const notesList = materials.filter((m) => m.materialType === 'LECTURE_NOTES');
  const otherList = materials.filter((m) => !m.isSyllabusOrOutline && m.materialType !== 'LECTURE_NOTES');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 840, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 800,
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
              }}>
                {course.code || 'INSTITUTIONAL COURSE'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {course.programme || course.department} • {course.level || 'Level 400'}
              </span>
            </div>

            <h2 className="modal-title" style={{ fontSize: '1.5rem', margin: '4px 0', color: 'white' }}>
              {course.title || 'Course Materials & Syllabus Hub'}
            </h2>
            <div style={{ fontSize: '0.84rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Lecturer: <strong>{course.lecturerName || 'Department Faculty'}</strong></span>
              <span>•</span>
              <span>Semester: {course.semester || 'Current Term'} ({course.academicYear || '2026/2027'})</span>
            </div>
          </div>

          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            Loading course academic materials...
          </div>
        ) : previewMaterial ? (
          /* Sub-View: Document Text Previewer */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  onClick={() => setPreviewMaterial(null)}
                  style={{ background: 'transparent', border: 'none', color: '#818cf8', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  ← Back to Materials List
                </button>
                <span style={{ color: '#64748b' }}>|</span>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{previewMaterial.title}</span>
              </div>

              <button
                onClick={() => handleDownload(previewMaterial.id, previewMaterial.fileName)}
                className="btn-upload-material"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <Download size={14} /> Download Original File
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#0a0d16', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 18, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}>
              {previewLoading ? 'Extracting document text...' : previewText}
            </div>
          </div>
        ) : (
          /* Main Materials View */
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <BookOpen size={16} color="#818cf8" /> UPLOADED ACADEMIC MATERIALS ({materials.length})
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                ✓ Official Lecturer Uploads • Direct Download Enabled
              </span>
            </div>

            {materials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.08)', borderRadius: 12 }}>
                <FileText size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No uploaded materials available for this course yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Course Syllabus */}
                {syllabusList.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 8 }}>
                      Course Syllabus ({syllabusList.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {syllabusList.map((m) => (
                        <MaterialCard key={m.id} material={m} onPreview={handlePreviewText} onDownload={handleDownload} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Lecture Notes */}
                {notesList.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: 8 }}>
                      Lecture Notes & Transcripts ({notesList.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {notesList.map((m) => (
                        <MaterialCard key={m.id} material={m} onPreview={handlePreviewText} onDownload={handleDownload} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other References */}
                {otherList.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: 8 }}>
                      Research Papers & Slides ({otherList.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {otherList.map((m) => (
                        <MaterialCard key={m.id} material={m} onPreview={handlePreviewText} onDownload={handleDownload} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MaterialCard = ({ material, onPreview, onDownload }) => {
  const sizeKb = material.fileSize ? Math.round(material.fileSize / 1024) : 0;
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 12,
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8'
        }}>
          <FileText size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {material.title}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            {material.fileName || 'Uploaded File'} • {sizeKb > 0 ? `${sizeKb} KB` : `${material.wordCount || 0} words`} • {material.materialType ? material.materialType.replace(/_/g, ' ') : 'LECTURE NOTE'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onPreview(material)}
          className="form-input"
          style={{
            width: 'auto',
            padding: '6px 12px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <Eye size={13} color="#818cf8" /> Preview Text
        </button>

        <button
          onClick={() => onDownload(material.id, material.fileName)}
          className="btn-upload-material"
          style={{
            padding: '6px 14px',
            fontSize: '0.78rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          }}
        >
          <Download size={13} /> Download File
        </button>
      </div>
    </div>
  );
};

export default InstitutionalCourseHubModal;

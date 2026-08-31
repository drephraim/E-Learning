import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Video, 
  Trash2, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Eye, 
  Layers, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../AuthContext';

const EditCourseContentModal = ({ isOpen, onClose, courseId, courseTitle, onSaved }) => {
  const { currentUser, dbUser } = useAuth();
  const userId = dbUser?.id || currentUser?.uid;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);

  // Editable Module Form State
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleContent, setModuleContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchCourseData = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        if (data.modules && data.modules.length > 0) {
          loadModuleIntoForm(data.modules[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching course for editor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      fetchCourseData();
    }
  }, [isOpen, courseId]);

  const loadModuleIntoForm = (mod) => {
    setModuleTitle(mod.title || '');
    setModuleContent(mod.content || '');
    setYoutubeUrl(mod.youtubeUrl || '');
    setSuccessMsg('');
    setError('');
  };

  const handleSelectModule = (idx) => {
    setActiveModuleIdx(idx);
    if (course && course.modules && course.modules[idx]) {
      loadModuleIntoForm(course.modules[idx]);
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    const currentModule = course?.modules?.[activeModuleIdx];
    if (!currentModule || !userId) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/modules/${currentModule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          title: moduleTitle.trim(),
          content: moduleContent.trim(),
          youtubeUrl: youtubeUrl.trim(),
        }),
      });

      if (res.ok) {
        const updatedMod = await res.json();
        setSuccessMsg(`Chapter ${activeModuleIdx + 1} updated! Changes are now live for all enrolled students.`);
        
        // Update local state copy
        const updatedModules = [...course.modules];
        updatedModules[activeModuleIdx] = {
          ...updatedModules[activeModuleIdx],
          title: updatedMod.title,
          content: updatedMod.content,
          youtubeUrl: updatedMod.youtubeUrl,
        };
        setCourse({ ...course, modules: updatedModules });

        if (onSaved) onSaved();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to save module edits.');
      }
    } catch (err) {
      console.error('Error saving module edits:', err);
      setError('Connection error saving module edits.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVideo = () => {
    setYoutubeUrl('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 860, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Sparkles size={14} /> Course Content & Video Reviewer / Editor
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>
              {courseTitle || course?.title || 'Review & Edit Course Content'}
            </h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            Loading course modules...
          </div>
        ) : !course || !course.modules || course.modules.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            No modules found for this course.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
            {/* Sidebar Chapter Navigator */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
                Course Chapters ({course.modules.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {course.modules.map((mod, idx) => {
                  const isSelected = activeModuleIdx === idx;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectModule(idx)}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                        color: isSelected ? 'white' : '#94a3b8',
                        padding: '10px 12px',
                        borderRadius: 10,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.84rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Layers size={14} color={isSelected ? '#818cf8' : '#64748b'} />
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Ch {idx + 1}: {mod.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Module Editor Form */}
            <div style={{ overflowY: 'auto', paddingRight: 6 }}>
              {successMsg && (
                <div style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 14px', borderRadius: 10, color: '#34d399', marginBottom: 14, fontSize: '0.84rem', fontWeight: 600 }}>
                  ✅ {successMsg}
                </div>
              )}

              {error && (
                <div className="auth-error" style={{ marginBottom: 14 }}>
                  <span>⚠️ {error}</span>
                </div>
              )}

              <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8' }}>
                    CHAPTER {activeModuleIdx + 1} TITLE
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Chapter Lesson Text Content */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8' }}>
                    CHAPTER LESSON CONTENT & TEXT (Markdown Supported)
                  </label>
                  <textarea
                    value={moduleContent}
                    onChange={(e) => setModuleContent(e.target.value)}
                    rows={8}
                    className="form-input"
                    style={{ height: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, padding: 12 }}
                  />
                </div>

                {/* Video URL & Controls */}
                <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: 14, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <Video size={15} /> RECOMMENDED YOUTUBE VIDEO LESSON
                    </label>
                    {youtubeUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '3px 10px', borderRadius: 6, fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Trash2 size={12} /> Remove Video
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                  </div>

                  {youtubeUrl ? (
                    <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#34d399" /> Video linked. Students will be able to watch this video lesson directly in Chapter {activeModuleIdx + 1}.
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      No video assigned to this chapter yet. Paste a YouTube URL above to add a video lesson.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-upload-material"
                  >
                    <Save size={16} /> {saving ? 'Saving Live Edits...' : 'Save & Publish Chapter Edits'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCourseContentModal;

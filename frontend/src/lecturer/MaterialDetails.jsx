import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import ReactMarkdown from 'react-markdown';
import EnhancedMarkdown from '../components/EnhancedMarkdown';
import { 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Trash2, 
  RefreshCw, 
  Globe, 
  Lock, 
  Eye,
  Building2,
  FileCheck,
  AlertTriangle,
  Edit3,
  X,
  Save
} from 'lucide-react';

const MaterialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('extracted'); // 'extracted' | 'chunks' | 'raw'
  const [updating, setUpdating] = useState(false);

  // Manual Text Editor Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [savingText, setSavingText] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const handleReprocess = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !material) return;
    setReprocessing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/materials/${material.id}/reprocess`, {
        method: 'POST',
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        await fetchDetail();
        alert('Material re-processed automatically with the upgraded class-based PDF engine!');
      } else {
        const errData = await res.json();
        alert(errData.message || 'Auto-extraction failed. Please use manual text entry.');
      }
    } catch (err) {
      console.error('Error re-processing material:', err);
      alert('Error re-processing material.');
    } finally {
      setReprocessing(false);
    }
  };

  const fetchDetail = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/materials/detail/${id}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterial(data);
        if (data.documentContent?.cleanedText) {
          setManualText(data.documentContent.cleanedText);
        }
      }
    } catch (err) {
      console.error('Error fetching material detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, currentUser, dbUser]);

  const toggleVisibility = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !material) return;
    setUpdating(true);

    const nextVis = material.visibility === 'AVAILABLE' ? 'PRIVATE' : 'AVAILABLE';
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/materials/${material.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ visibility: nextVis }),
      });
      if (res.ok) {
        setMaterial({ ...material, visibility: nextVis });
      }
    } catch (err) {
      console.error('Error updating visibility:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this academic material? This will remove all extracted text and chunks.')) return;
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !material) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/materials/${material.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        navigate('/lecturer/materials');
      }
    } catch (err) {
      console.error('Error deleting material:', err);
    }
  };

  const handleSaveManualText = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) {
      alert('Please enter or paste document text.');
      return;
    }
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !material) return;

    setSavingText(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/materials/${material.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ text: manualText }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        await fetchDetail();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to save document text.');
      }
    } catch (err) {
      console.error('Error saving manual text:', err);
      alert('Error updating material text.');
    } finally {
      setSavingText(false);
    }
  };

  if (loading) {
    return (
      <div className="lecturer-content" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#94a3b8' }}>Loading material details & extracted content...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="lecturer-content">
        <button className="form-input" onClick={() => navigate('/lecturer/materials')} style={{ width: 'auto', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Materials
        </button>
        <div className="empty-state-container">
          <h3>Material Not Found</h3>
        </div>
      </div>
    );
  }

  const isFailedOrEmpty = material.processingStatus === 'FAILED' || !material.documentContent?.wordCount;

  return (
    <div className="lecturer-content">
      {/* Top Back Navigation */}
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={() => navigate('/lecturer/materials')}
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
          <ArrowLeft size={16} /> Back to Academic Materials
        </button>
      </div>

      {/* Warning Banner if Text Extraction Failed or 0 Words */}
      {isFailedOrEmpty && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 14,
          padding: '18px 24px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <AlertTriangle size={26} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <div>
              <h4 style={{ color: '#fbbf24', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>
                Text Extraction Action Required
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                No text was extracted automatically from <strong>{material.fileName}</strong> (scanned image PDF or custom encoding). Paste the document text below to generate RAG chunks for student AI course grounding.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              className="btn-upload-material"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', padding: '10px 18px', fontSize: '0.88rem', flexShrink: 0 }}
            >
              <RefreshCw size={16} className={reprocessing ? 'spin' : ''} /> {reprocessing ? 'Extracting...' : 'Auto Re-Extract Text'}
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-upload-material"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '10px 18px', fontSize: '0.88rem', flexShrink: 0 }}
            >
              <Edit3 size={16} /> Edit / Paste Document Text
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="lecturer-section" style={{ marginBottom: 24 }}>
        <div className="lecturer-title-row" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="material-badge">{material.materialType.replace('_', ' ')}</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {material.course ? `${material.course.code}: ${material.course.title}` : 'General Material'}
              </span>
            </div>

            <h1 className="lecturer-greeting" style={{ fontSize: '1.8rem' }}>{material.title}</h1>
            <p className="lecturer-subtitle">
              File: <strong style={{ color: 'white' }}>{material.fileName}</strong> ({Math.round(material.fileSize / 1024)} KB) • Uploaded on {new Date(material.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RefreshCw size={14} className={reprocessing ? 'spin' : ''} /> {reprocessing ? 'Re-extracting...' : 'Auto Re-Extract'}
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Edit3 size={14} /> Edit Text
            </button>

            <button 
              onClick={toggleVisibility}
              disabled={updating}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: material.visibility === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: material.visibility === 'AVAILABLE' ? '#34d399' : '#fbbf24',
                border: '1px solid currentColor',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {material.visibility === 'AVAILABLE' ? <Globe size={14} /> : <Lock size={14} />}
              {material.visibility === 'AVAILABLE' ? 'Available to Students' : 'Private (Lecturer Only)'}
            </button>

            <button 
              onClick={handleDelete}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Trash2 size={14} /> Delete Material
            </button>
          </div>
        </div>

        {/* Tab Header */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
          <button
            onClick={() => setActiveTab('extracted')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'extracted' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'extracted' ? 'white' : '#94a3b8',
              padding: '8px 16px 12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Extracted Clean Text ({material.documentContent?.wordCount || 0} words)
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chunks' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'chunks' ? 'white' : '#94a3b8',
              padding: '8px 16px 12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            RAG Chunks ({material.chunks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'raw' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'raw' ? 'white' : '#94a3b8',
              padding: '8px 16px 12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Raw Unfiltered Output
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'extracted' && (
        <div className="lecturer-section">
          <div className="section-header">
            <h3 className="section-title">Cleaned Document Text</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                Source Category: {material.sourceCategory}
              </span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Edit3 size={14} /> Edit Text
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 24,
            color: '#e2e8f0',
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
            fontSize: '0.92rem',
            lineHeight: 1.7,
            maxHeight: 650,
            overflowY: 'auto'
          }}>
            {material.documentContent?.cleanedText ? (
              <EnhancedMarkdown content={material.documentContent.cleanedText} />
            ) : (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                No text extracted. Click "Edit Text" to paste document text or click "Auto Re-Extract" to process document slides.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chunks' && (
        <div className="lecturer-section">
          <div className="section-header">
            <h3 className="section-title">Structured Document Chunks</h3>
            <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>
              Prepared for RAG & Citation Traceability
            </span>
          </div>

          {material.chunks && material.chunks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {material.chunks.map((chunk) => (
                <div 
                  key={chunk.id} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.78rem', color: '#94a3b8' }}>
                    <span style={{ fontWeight: 700, color: '#818cf8' }}>
                      CHUNK #{chunk.chunkIndex + 1} {chunk.sectionTitle ? `• Section: ${chunk.sectionTitle}` : ''}
                    </span>
                    <span>Tokens: ~{chunk.tokenCount}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {chunk.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-container">
              <Layers size={24} style={{ color: '#818cf8', margin: '0 auto 10px' }} />
              <p style={{ color: '#94a3b8' }}>No document chunks generated yet. Click "Edit Text" above to provide material content.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="lecturer-section">
          <div style={{
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 24,
            color: '#94a3b8',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            maxHeight: 600,
            overflowY: 'auto'
          }}>
            {material.documentContent?.rawText || 'No raw text.'}
          </div>
        </div>
      )}

      {/* Edit / Paste Text Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit / Paste Document Text</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualText} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Paste or edit the text content for <strong>{material.title}</strong>. Saving will clean the text, calculate word count, and automatically generate RAG chunks for course grounding.
              </div>

              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste course syllabus text, lecture notes, or chapter outline here..."
                style={{
                  width: '100%',
                  height: 300,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  padding: 16,
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>
                  Word Count: {manualText.trim() ? manualText.trim().split(/\s+/).length : 0} words
                </span>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="form-input"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ width: 'auto', padding: '10px 16px' }}
                    disabled={savingText}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-upload-material"
                    disabled={savingText || !manualText.trim()}
                  >
                    <Save size={16} /> {savingText ? 'Saving & Chunking...' : 'Save & Generate Chunks'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialDetails;

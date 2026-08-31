import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import { 
  BookOpen, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  FileText, 
  Target, 
  Award, 
  ListOrdered, 
  BookMarked 
} from 'lucide-react';

const SyllabusDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('structure'); // 'structure' | 'original'

  // Editable States
  const [title, setTitle] = useState('');
  const [objectives, setObjectives] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [readings, setReadings] = useState([]);

  const fetchSyllabusDetail = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/syllabi/detail/${id}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setSyllabus(data);
        setTitle(data.title || '');
        setObjectives(data.objectives || []);
        setOutcomes(data.outcomes || []);
        setTopics(data.topics || []);
        setReadings(data.readings || []);
      }
    } catch (err) {
      console.error('Error fetching syllabus detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabusDetail();
  }, [id, currentUser, dbUser]);

  const handleSaveCorrections = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId || !id) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/syllabi/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          title,
          objectives: objectives.map((o) => ({ text: o.text })),
          outcomes: outcomes.map((o) => ({ text: o.text })),
          topics: topics.map((t) => ({ title: t.title, description: t.description, weekNumber: t.weekNumber })),
          readings: readings.map((r) => ({ citation: r.citation, title: r.title, author: r.author })),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSyllabus(updated);
        alert('Syllabus structure successfully updated and saved!');
      }
    } catch (err) {
      console.error('Error saving syllabus corrections:', err);
      alert('Failed to save syllabus corrections.');
    } finally {
      setSaving(false);
    }
  };

  // Helper Array Manipulations
  const addObjective = () => setObjectives([...objectives, { text: '' }]);
  const updateObjective = (idx, text) => {
    const copy = [...objectives];
    copy[idx].text = text;
    setObjectives(copy);
  };
  const removeObjective = (idx) => setObjectives(objectives.filter((_, i) => i !== idx));

  const addOutcome = () => setOutcomes([...outcomes, { text: '' }]);
  const updateOutcome = (idx, text) => {
    const copy = [...outcomes];
    copy[idx].text = text;
    setOutcomes(copy);
  };
  const removeOutcome = (idx) => setOutcomes(outcomes.filter((_, i) => i !== idx));

  const addTopic = () => setTopics([...topics, { title: '', weekNumber: topics.length + 1 }]);
  const updateTopic = (idx, field, val) => {
    const copy = [...topics];
    copy[idx][field] = val;
    setTopics(copy);
  };
  const removeTopic = (idx) => setTopics(topics.filter((_, i) => i !== idx));

  const addReading = () => setReadings([...readings, { citation: '' }]);
  const updateReading = (idx, citation) => {
    const copy = [...readings];
    copy[idx].citation = citation;
    setReadings(copy);
  };
  const removeReading = (idx) => setReadings(readings.filter((_, i) => i !== idx));

  if (loading) {
    return (
      <div className="lecturer-content" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#94a3b8' }}>Loading syllabus extraction & structure...</p>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="lecturer-content">
        <button className="form-input" onClick={() => navigate('/lecturer/syllabi')} style={{ width: 'auto', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Syllabi
        </button>
        <div className="empty-state-container">
          <h3>Syllabus Not Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="lecturer-content">
      {/* Top Navigation */}
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={() => navigate('/lecturer/syllabi')}
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
          <ArrowLeft size={16} /> Back to Syllabi List
        </button>
      </div>

      {/* Header Banner */}
      <div className="lecturer-section" style={{ marginBottom: 24 }}>
        <div className="lecturer-title-row" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="material-badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                {syllabus.course?.code || 'SYLLABUS'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {syllabus.course?.title} ({syllabus.academicYear || '2026/2027'})
              </span>
            </div>
            <h1 className="lecturer-greeting" style={{ fontSize: '1.8rem' }}>{syllabus.title}</h1>
            <p className="lecturer-subtitle">
              Original File: <strong style={{ color: 'white' }}>{syllabus.material?.fileName || 'Extracted Document'}</strong>
            </p>
          </div>

          <button 
            className="btn-upload-material"
            disabled={saving}
            onClick={handleSaveCorrections}
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Manual Corrections'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
          <button
            onClick={() => setActiveTab('structure')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'structure' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'structure' ? 'white' : '#94a3b8',
              padding: '8px 16px 12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Structured Data & Manual Editor
          </button>
          <button
            onClick={() => setActiveTab('original')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'original' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'original' ? 'white' : '#94a3b8',
              padding: '8px 16px 12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Compare Original Extracted Text
          </button>
        </div>
      </div>

      {activeTab === 'structure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Objectives */}
          <div className="lecturer-section">
            <div className="section-header">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} style={{ color: '#818cf8' }} /> Course Objectives ({objectives.length})
              </h3>
              <button className="form-input" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }} onClick={addObjective}>
                <Plus size={14} /> Add Objective
              </button>
            </div>

            {objectives.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {objectives.map((obj, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#818cf8', width: 24 }}>{idx + 1}.</span>
                    <input
                      type="text"
                      value={obj.text}
                      onChange={(e) => updateObjective(idx, e.target.value)}
                      className="form-input"
                      placeholder="e.g. Understand core concepts of research design..."
                    />
                    <button onClick={() => removeObjective(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No objectives detected in uploaded document. Click "Add Objective" to specify manually.</p>
            )}
          </div>

          {/* Section 2: Outcomes */}
          <div className="lecturer-section">
            <div className="section-header">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} style={{ color: '#34d399' }} /> Intended Learning Outcomes ({outcomes.length})
              </h3>
              <button className="form-input" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }} onClick={addOutcome}>
                <Plus size={14} /> Add Outcome
              </button>
            </div>

            {outcomes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {outcomes.map((out, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#34d399', width: 24 }}>{idx + 1}.</span>
                    <input
                      type="text"
                      value={out.text}
                      onChange={(e) => updateOutcome(idx, e.target.value)}
                      className="form-input"
                      placeholder="e.g. Formulate empirical research questions..."
                    />
                    <button onClick={() => removeOutcome(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No learning outcomes detected in uploaded document. Click "Add Outcome" to specify manually.</p>
            )}
          </div>

          {/* Section 3: Weekly Topics */}
          <div className="lecturer-section">
            <div className="section-header">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ListOrdered size={18} style={{ color: '#c084fc' }} /> Course Weekly Topics ({topics.length})
              </h3>
              <button className="form-input" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }} onClick={addTopic}>
                <Plus size={14} /> Add Topic
              </button>
            </div>

            {topics.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topics.map((top, idx) => (
                  <div key={idx} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc' }}>WEEK</span>
                      <input
                        type="number"
                        value={top.weekNumber || idx + 1}
                        onChange={(e) => updateTopic(idx, 'weekNumber', parseInt(e.target.value, 10))}
                        className="form-input"
                        style={{ width: 70 }}
                      />
                      <input
                        type="text"
                        value={top.title}
                        onChange={(e) => updateTopic(idx, 'title', e.target.value)}
                        className="form-input"
                        placeholder="Topic Title (e.g. Introduction to Research Methodologies)"
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => removeTopic(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No weekly schedule detected. Click "Add Topic" to specify weekly topics.</p>
            )}
          </div>

          {/* Section 4: Recommended Readings */}
          <div className="lecturer-section">
            <div className="section-header">
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookMarked size={18} style={{ color: '#fbbf24' }} /> Recommended Readings ({readings.length})
              </h3>
              <button className="form-input" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer' }} onClick={addReading}>
                <Plus size={14} /> Add Reading
              </button>
            </div>

            {readings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {readings.map((rd, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={rd.citation}
                      onChange={(e) => updateReading(idx, e.target.value)}
                      className="form-input"
                      placeholder="e.g. Creswell, J. W. (2018). Research Design: Qualitative, Quantitative, and Mixed Methods Approaches."
                    />
                    <button onClick={() => removeReading(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No recommended readings detected in uploaded file.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'original' && (
        <div className="lecturer-section">
          <h3 className="section-title" style={{ marginBottom: 16 }}>Original Extracted File Text</h3>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 24,
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            maxHeight: 600,
            overflowY: 'auto'
          }}>
            {syllabus.material?.documentContent?.cleanedText || 'Original text not available.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusDetails;

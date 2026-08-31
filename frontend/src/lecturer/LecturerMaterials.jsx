import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import UploadMaterialModal from './UploadMaterialModal';
import CreateCourseModal from './CreateCourseModal';
import { 
  FileText, 
  Plus, 
  Search, 
  Sparkles, 
  Clock, 
  Globe, 
  Lock, 
  FileCheck, 
  ChevronRight,
  AlertTriangle 
} from 'lucide-react';

const LecturerMaterials = () => {
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');

  const fetchMaterials = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/materials/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Error fetching academic materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [currentUser, dbUser]);

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.fileName && m.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || m.materialType === typeFilter;
    const matchesVis = visibilityFilter === 'ALL' || m.visibility === visibilityFilter;
    return matchesSearch && matchesType && matchesVis;
  });

  const getStatusBadge = (status) => {
    if (status === 'READY') {
      return <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>✓ Ready</span>;
    }
    if (status === 'PROCESSING') {
      return <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>⌛ Processing</span>;
    }
    return <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>⚠️ Failed</span>;
  };

  return (
    <div className="lecturer-content">
      <div>
        <div className="lecturer-header-badge">
          <Sparkles size={12} /> Institutional Knowledge Base
        </div>

        <div className="lecturer-title-row">
          <div>
            <h1 className="lecturer-greeting">Academic Materials</h1>
            <p className="lecturer-subtitle">
              Manage uploaded course syllabi, lecture notes, outlines, and research papers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="form-input"
              onClick={() => setIsCourseModalOpen(true)}
              style={{ width: 'auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Sparkles size={16} style={{ color: '#818cf8' }} /> Create Course from Materials
            </button>

            <button 
              className="btn-upload-material"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus size={18} /> Upload Academic Material
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="lecturer-section" style={{ padding: '16px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by material title or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 36 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TYPE:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Types</option>
              <option value="COURSE_SYLLABUS">Course Syllabus</option>
              <option value="COURSE_OUTLINE">Course Outline</option>
              <option value="LECTURE_NOTES">Lecture Notes</option>
              <option value="RESEARCH_PAPER">Research Paper</option>
              <option value="READING_MATERIAL">Reading Material</option>
            </select>

            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>VISIBILITY:</span>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Visibility</option>
              <option value="AVAILABLE">Available to Students</option>
              <option value="PRIVATE">Private (Lecturer Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length > 0 ? (
        <div className="materials-list">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="material-item"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/lecturer/materials/detail/${mat.id}`)}
            >
              <div className="material-info">
                <FileText size={20} style={{ color: '#818cf8' }} />
                <div>
                  <div className="material-title">{mat.title}</div>
                  <div className="material-meta">
                    {mat.course ? `${mat.course.code}: ${mat.course.title}` : 'General Material'} • {mat.fileName} • {mat.documentContent?.wordCount || 0} words
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className="material-badge">{mat.materialType.replace('_', ' ')}</span>
                {getStatusBadge(mat.processingStatus)}
                {mat.visibility === 'AVAILABLE' ? (
                  <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={12} /> Available
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={12} /> Private
                  </span>
                )}
                <ChevronRight size={16} style={{ color: '#818cf8' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lecturer-section">
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <h3 className="empty-state-title">No Academic Materials Found</h3>
            <p className="empty-state-text">
              Upload your course syllabi, lecture notes, or research papers to build your searchable institutional knowledge base.
            </p>
            <button 
              className="btn-upload-material"
              style={{ margin: '0 auto' }}
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus size={16} /> Upload First Material
            </button>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchMaterials}
      />

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={fetchMaterials}
      />
    </div>
  );
};

export default LecturerMaterials;

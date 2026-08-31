import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import UploadMaterialModal from './UploadMaterialModal';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  FileText, 
  ListOrdered, 
  Target, 
  Award 
} from 'lucide-react';

const LecturerSyllabi = () => {
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchSyllabi = async () => {
    const userId = currentUser?.uid || dbUser?.id;
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/syllabi/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setSyllabi(data);
      }
    } catch (err) {
      console.error('Error fetching syllabi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabi();
  }, [currentUser, dbUser]);

  return (
    <div className="lecturer-content">
      <div>
        <div className="lecturer-header-badge">
          <Sparkles size={12} /> Syllabus Management
        </div>

        <div className="lecturer-title-row">
          <div>
            <h1 className="lecturer-greeting">Extracted Course Syllabi</h1>
            <p className="lecturer-subtitle">
              Inspect, validate, and manually correct extracted syllabus structures for curriculum alignment.
            </p>
          </div>

          <button 
            className="btn-upload-material"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus size={18} /> Upload Syllabus
          </button>
        </div>
      </div>

      {/* Syllabi List */}
      {syllabi.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {syllabi.map((syl) => (
            <div
              key={syl.id}
              className="lecturer-stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/lecturer/syllabi/detail/${syl.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34d399',
                }}>
                  {syl.course?.code || 'SYLLABUS'}
                </span>

                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {syl.academicYear || '2026/2027'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>
                {syl.title}
              </h3>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 16 }}>
                {syl.course?.title} ({syl.course?.level || 'Level 400'})
              </div>

              {/* Summary Counts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 4px', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8' }}>{syl._count?.topics || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', uppercase: true }}>Topics</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 4px', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{syl._count?.objectives || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', uppercase: true }}>Objectives</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 4px', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc' }}>{syl._count?.outcomes || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', uppercase: true }}>Outcomes</div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.8rem',
                color: '#818cf8',
                fontWeight: 600
              }}>
                <span>Inspect & Edit Structure</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lecturer-section">
          <div className="empty-state-container">
            <div className="empty-state-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
              <BookOpen size={28} />
            </div>
            <h3 className="empty-state-title">No Syllabi Extracted Yet</h3>
            <p className="empty-state-text">
              Upload course syllabus documents to automatically detect objectives, outcomes, and weekly topics.
            </p>
            <button 
              className="btn-upload-material"
              style={{ margin: '0 auto' }}
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus size={16} /> Upload First Syllabus
            </button>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchSyllabi}
      />
    </div>
  );
};

export default LecturerSyllabi;

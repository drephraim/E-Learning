import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  BookOpen, 
  Search, 
  FileCheck, 
  Building2,
  AlertTriangle,
  Award,
  BookMarked
} from 'lucide-react';

const LecturerValidation = () => {
  const { currentUser, dbUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const userId = currentUser?.uid || dbUser?.id;

  const fetchValidationCourses = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/validation/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        if (data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching validation courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationCourses();
  }, [userId]);

  const toggleVerification = async (courseId, currentStatus) => {
    setVerifyingId(courseId);
    const newStatus = currentStatus === 'VERIFIED' ? 'PENDING_REVIEW' : 'VERIFIED';
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/validation/verify/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, verificationStatus: newStatus } : c))
        );
        if (selectedCourse?.id === courseId) {
          setSelectedCourse((prev) => ({ ...prev, verificationStatus: newStatus }));
        }
      }
    } catch (err) {
      console.error('Error verifying course content:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lecturer-content">
      <div>
        <div className="lecturer-header-badge">
          <ShieldCheck size={12} /> Academic Grounding & Audit
        </div>

        <div className="lecturer-title-row">
          <div>
            <h1 className="lecturer-greeting">Content Validation Workspace</h1>
            <p className="lecturer-subtitle">
              Verify the academic authenticity of AI-synthesized courses, audit OpenAlex paper citations, and certify course grounding.
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Course Roster */}
        <div className="lecturer-section" style={{ padding: 18 }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search course title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 36, fontSize: '0.84rem' }}
            />
          </div>

          <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
            Courses for Audit ({filtered.length})
          </h3>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Loading courses...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '65vh', overflowY: 'auto' }}>
              {filtered.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                const isVerified = c.verificationStatus === 'VERIFIED';
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourse(c)}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: isVerified ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isVerified ? '#34d399' : '#fbbf24'
                      }}>
                        {isVerified ? '✓ AUDITED' : 'PENDING'}
                      </span>

                      <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700 }}>
                        {c.authenticityScore}% Authenticity
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                      {c.modulesCount} Modules • {c.openAlexCitationsCount} Citations
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Audit & OpenAlex Citation Panel */}
        {selectedCourse ? (
          <div className="lecturer-section" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8'
                  }}>
                    {selectedCourse.targetDifficulty}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Department: {selectedCourse.department}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: '4px 0' }}>
                  {selectedCourse.title}
                </h2>
              </div>

              <button
                onClick={() => toggleVerification(selectedCourse.id, selectedCourse.verificationStatus)}
                disabled={verifyingId === selectedCourse.id}
                className="btn-upload-material"
                style={{
                  background: selectedCourse.verificationStatus === 'VERIFIED'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: selectedCourse.verificationStatus === 'VERIFIED' ? '#f87171' : 'white',
                  border: selectedCourse.verificationStatus === 'VERIFIED' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                }}
              >
                {selectedCourse.verificationStatus === 'VERIFIED' ? (
                  <>Revoke Verification</>
                ) : (
                  <><CheckCircle2 size={16} /> Certify & Verify Course</>
                )}
              </button>
            </div>

            {/* Validation Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>AUTHENTICITY SCORE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
                  {selectedCourse.authenticityScore}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Calculated via Scientific Audit Engine</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>GROUNDING SOURCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginTop: 6 }}>
                  {selectedCourse.groundingSource.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Verified Notes & OpenAlex</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>OPENALEX CITATIONS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                  {Number(selectedCourse.openAlexCitationsCount || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Matched Peer-Reviewed Works</div>
              </div>
            </div>

            {/* 4-Pillar Scientific Audit Score Breakdown */}
            {selectedCourse.auditBreakdown && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 12, padding: 16, marginBottom: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Award size={16} /> 4-Pillar Scientific Audit Score Breakdown
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>Citations & Literature Coverage</span>
                      <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 800 }}>
                        {selectedCourse.auditBreakdown.citationsCoverage.score} / {selectedCourse.auditBreakdown.citationsCoverage.max} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                      {selectedCourse.auditBreakdown.citationsCoverage.details}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>Academic Grounding Level</span>
                      <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 800 }}>
                        {selectedCourse.auditBreakdown.groundingIntegrity.score} / {selectedCourse.auditBreakdown.groundingIntegrity.max} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                      {selectedCourse.auditBreakdown.groundingIntegrity.details}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>Textbook Structural Depth</span>
                      <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 800 }}>
                        {selectedCourse.auditBreakdown.structuralDepth.score} / {selectedCourse.auditBreakdown.structuralDepth.max} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                      {selectedCourse.auditBreakdown.structuralDepth.details}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>APA References & Documentation</span>
                      <span style={{ fontSize: '0.8rem', color: '#f472b6', fontWeight: 800 }}>
                        {selectedCourse.auditBreakdown.referencesCompliance.score} / {selectedCourse.auditBreakdown.referencesCompliance.max} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                      {selectedCourse.auditBreakdown.referencesCompliance.details}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* OpenAlex Matched Peer-Reviewed Papers Section */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <BookMarked size={16} color="#c084fc" /> OpenAlex Peer-Reviewed References Matched
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedCourse.openAlexPapers.map((paper, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 14,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {paper.title}
                        {paper.citationsCount > 0 && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc' }}>
                            {Number(paper.citationsCount).toLocaleString()} Citations
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 3 }}>
                        {paper.authors} • <em>{paper.journal}</em> ({paper.year})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: 2 }}>
                        DOI: {paper.doi}
                      </div>
                    </div>

                    <a
                      href={paper.doi?.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="form-input"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.76rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        width: 'auto',
                        textDecoration: 'none'
                      }}
                    >
                      Open Citation <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lecturer-section" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            Select a course from the list to inspect its content grounding and OpenAlex citations.
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerValidation;

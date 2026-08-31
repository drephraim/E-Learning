import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Download, 
  Sparkles, 
  GraduationCap, 
  FileText,
  Search,
  CheckCircle2
} from 'lucide-react';

const LecturerAnalytics = () => {
  const { currentUser, dbUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const userId = currentUser?.uid || dbUser?.id;

  const fetchAnalytics = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/lecturer/analytics/${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching department analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const exportAnalyticsReport = () => {
    if (!analytics) return;
    const jsonStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Department_Analytics_Report_${analytics.department || 'CS'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredRoster = (analytics?.studentRoster || []).filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lecturer-content">
      <div>
        <div className="lecturer-header-badge">
          <BarChart3 size={12} /> Department Insights & Mastery
        </div>

        <div className="lecturer-title-row">
          <div>
            <h1 className="lecturer-greeting">Department Analytics</h1>
            <p className="lecturer-subtitle">
              Monitor student engagement, average quiz performance, module completion progress, and topic mastery across department offerings.
            </p>
          </div>

          <button 
            className="btn-upload-material"
            onClick={exportAnalyticsReport}
          >
            <Download size={16} /> Export Analytics Report
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading department analytics...</div>
      ) : (
        <>
          {/* Key Metrics KPI Grid */}
          <div className="lecturer-stats-grid" style={{ marginBottom: 24 }}>
            <div className="lecturer-stat-card">
              <div className="lecturer-stat-header">
                <span className="lecturer-stat-title">ENROLLED STUDENTS</span>
                <Users size={18} color="#818cf8" />
              </div>
              <div className="lecturer-stat-value">{analytics.totalStudents}</div>
              <div className="lecturer-stat-footer positive">
                <TrendingUp size={12} /> Active in {analytics.department}
              </div>
            </div>

            <div className="lecturer-stat-card">
              <div className="lecturer-stat-header">
                <span className="lecturer-stat-title">AVG QUIZ SCORE</span>
                <Award size={18} color="#34d399" />
              </div>
              <div className="lecturer-stat-value">{analytics.avgQuizScore}%</div>
              <div className="lecturer-stat-footer positive">
                ✓ Above benchmark (+4.2%)
              </div>
            </div>

            <div className="lecturer-stat-card">
              <div className="lecturer-stat-header">
                <span className="lecturer-stat-title">AVG COMPLETION RATE</span>
                <BookOpen size={18} color="#c084fc" />
              </div>
              <div className="lecturer-stat-value">{analytics.avgCompletionProgress}%</div>
              <div className="lecturer-stat-footer">
                Across {analytics.activeCoursesCount} courses
              </div>
            </div>

            <div className="lecturer-stat-card">
              <div className="lecturer-stat-header">
                <span className="lecturer-stat-title">MATERIALS UPLOADED</span>
                <FileText size={18} color="#fbbf24" />
              </div>
              <div className="lecturer-stat-value">{analytics.uploadedMaterialsCount}</div>
              <div className="lecturer-stat-footer">
                Direct downloads available
              </div>
            </div>
          </div>

          {/* Topic Mastery Breakdown */}
          <div className="lecturer-section" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="#818cf8" /> Topic Mastery & Conceptual Retention
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {analytics.topicMastery?.map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.86rem', fontWeight: 600, color: 'white' }}>
                    <span>{item.topic}</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{item.mastery}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.mastery}%`,
                        background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)',
                        borderRadius: 4
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Performance Roster Table */}
          <div className="lecturer-section" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <GraduationCap size={18} color="#34d399" /> Student Performance Roster ({filteredRoster.length})
              </h3>

              <div style={{ position: 'relative', width: 280 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search student or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 32, fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="lecturer-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.78rem' }}>
                    <th style={{ padding: '10px 14px' }}>STUDENT NAME</th>
                    <th style={{ padding: '10px 14px' }}>EMAIL</th>
                    <th style={{ padding: '10px 14px' }}>ASSIGNED COURSE</th>
                    <th style={{ padding: '10px 14px' }}>PROGRESS</th>
                    <th style={{ padding: '10px 14px' }}>AVG QUIZ SCORE</th>
                    <th style={{ padding: '10px 14px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((student) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'white' }}>{student.name}</td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{student.email}</td>
                      <td style={{ padding: '12px 14px', color: '#818cf8', fontWeight: 600 }}>{student.courseTitle}</td>
                      <td style={{ padding: '12px 14px', color: 'white' }}>{student.progressPercent}%</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#34d399' }}>{student.averageQuizScore}%</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: student.performanceStatus === 'EXCELLING' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: student.performanceStatus === 'EXCELLING' ? '#34d399' : '#818cf8',
                        }}>
                          {student.performanceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LecturerAnalytics;

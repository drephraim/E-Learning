import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from './Sidebar';
import { Shield, BarChart3, ArrowLeft, Save, Mail, Trophy, Flame, Target, Hourglass, Activity, BookOpen, Award } from 'lucide-react';
import ReactStars from 'react-stars';
import './Profile.css';
import { API_BASE_URL } from './config';

// Custom Tooltip component for Recharts
const CustomChartTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="recharts-custom-tooltip">
        <div className="recharts-custom-tooltip-date">{label}</div>
        <div className="recharts-custom-tooltip-value">
          <Activity size={14} style={{ color: 'var(--accent-primary)', marginRight: 6 }} />
          <span>{payload[0].value}{unit}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      try {
        const [statsRes, analyticsRes, userRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${uid}/stats`),
          fetch(`${API_BASE_URL}/users/${uid}/analytics`),
          fetch(`${API_BASE_URL}/users/${uid}`)
        ]);

        setStats(await statsRes.json());
        setAnalytics(await analyticsRes.json());
        const user = await userRes.json();
        setUserData(user);
        setName(user.name || '');
      } catch (err) {
        console.error("Error fetching profile data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchData();
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage('');
    try {
      const resp = await fetch(`${API_BASE_URL}/users/${auth.currentUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        const updated = await resp.json();
        setUserData(updated);
        setMessage('Profile updated!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (auth.currentUser?.email) {
      try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        setMessage('Password reset email sent! Check your inbox.');
      } catch (error) {
        setMessage('Error: ' + error.message);
      }
    }
  };

  const getInitials = () => {
    const dispName = userData?.name || auth.currentUser?.displayName || auth.currentUser?.email || 'U';
    return dispName.split(' ').map(n => n[0]).slice(0, 2).join('');
  };

  // Get unique topics list from progression history
  const uniqueTopics = stats?.topicStates?.map(t => t.topic) || [];

  // Filter progression chart data by selected topic
  const getCurveData = () => {
    if (!analytics?.emaProgression) return [];
    
    if (selectedTopic !== 'ALL') {
      return analytics.emaProgression
        .filter(item => item.topic.toLowerCase() === selectedTopic.toLowerCase())
        .map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(item.score)
        }));
    }

    // Average EMA progression by date
    const dateMap = {};
    analytics.emaProgression.forEach(item => {
      const dateStr = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { sum: 0, count: 0 };
      }
      dateMap[dateStr].sum += item.score;
      dateMap[dateStr].count += 1;
    });

    return Object.keys(dateMap).map(date => ({
      date,
      score: Math.round(dateMap[date].sum / dateMap[date].count)
    }));
  };

  const getPulseData = () => {
    if (!analytics?.pulse) return [];
    return analytics.pulse.map(p => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activity: p.count
    }));
  };

  const getMasteryData = () => {
    if (!stats?.topicStates) return [];
    return stats.topicStates.map(ts => ({
      name: ts.topic,
      score: Math.round(ts.emaScore || 0)
    }));
  };

  if (loading) return <div className="loading-screen">Loading profile dashboard...</div>;

  return (
    <div className="profile-layout">
      <Sidebar />
      <main className="profile-main">
        {/* SVG gradients definitions for Recharts */}
        <svg style={{ height: 0, width: 0, position: 'absolute' }}>
          <defs>
            <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </svg>

        <div className="profile-content">
          <div className="profile-top-nav">
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>

          {/* Premium Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-identity">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">{getInitials()}</div>
              </div>
              <div className="profile-details">
                <h1>{userData?.name || auth.currentUser?.displayName || 'Student'}</h1>
                <p>{auth.currentUser?.email}</p>
              </div>
            </div>
            
            <div className="cognitive-badge-container">
              <span className="cognitive-level-label">Overall Level</span>
              <span className="cognitive-badge-glowing">
                {userData?.cognitiveState || 'BEGINNER'}
              </span>
            </div>
          </div>

          {/* Sliding Tabs */}
          <div className="profile-tabs">
            <div
              className={`profile-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} /> Analytics Dashboard
            </div>
            <div
              className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={16} /> Account Settings
            </div>
          </div>

          {activeTab === 'analytics' ? (
            <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Interactive Stats Grid */}
              <div className="profile-stats-grid">
                <div className="profile-stat-card-glowing">
                  <div className="stat-glow-bg" />
                  <div className="stat-icon-circle">
                    <BookOpen size={20} />
                  </div>
                  <div className="stat-info-block">
                    <span className="profile-stat-value">{stats?.enrolledCount || 0}</span>
                    <span className="profile-stat-label">Enrolled</span>
                  </div>
                </div>

                <div className="profile-stat-card-glowing">
                  <div className="stat-glow-bg" />
                  <div className="stat-icon-circle">
                    <Award size={20} />
                  </div>
                  <div className="stat-info-block">
                    <span className="profile-stat-value">{stats?.completedCount || 0}</span>
                    <span className="profile-stat-label">Completed</span>
                  </div>
                </div>

                <div className="profile-stat-card-glowing">
                  <div className="stat-glow-bg" />
                  <div className="stat-icon-circle">
                    <Target size={20} />
                  </div>
                  <div className="stat-info-block">
                    <span className="profile-stat-value">{stats?.avgScore || 0}%</span>
                    <span className="profile-stat-label">Avg. Quiz Score</span>
                  </div>
                </div>

                <div className="profile-stat-card-glowing">
                  <div className="stat-glow-bg" />
                  <div className="stat-icon-circle">
                    <Hourglass size={20} />
                  </div>
                  <div className="stat-info-block">
                    <span className="profile-stat-value">{stats?.timeSpentHours || 0}h</span>
                    <span className="profile-stat-label">Hours Invested</span>
                  </div>
                </div>
              </div>

              {/* Main Charts Row */}
              <div className="charts-grid-main">
                {/* Curve Progression AreaChart */}
                <div className="analytics-card-premium">
                  <div className="card-header-actions">
                    <h3><Activity size={18} style={{ color: 'var(--orange)' }} /> Learning Curve Progression</h3>
                    {uniqueTopics.length > 0 && (
                      <select 
                        className="topic-select-dropdown"
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                      >
                        <option value="ALL">All Subjects (Avg)</option>
                        {uniqueTopics.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div className="pulse-chart-wrapper" style={{ height: '280px' }}>
                    {analytics?.emaProgression?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getCurveData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="var(--text-secondary)"
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} unit="%" domain={[0, 100]} tickLine={false} />
                          <Tooltip content={<CustomChartTooltip unit="%" />} />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#a78bfa"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorArea)"
                            name="Skill Rating"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-text">
                        <p>No progression records yet. Quizzes completed within lessons generate your curve history!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mastery Bar Chart */}
                <div className="analytics-card-premium">
                  <h3><Trophy size={18} style={{ color: 'var(--orange)' }} /> Subject Mastery Index</h3>
                  <div className="pulse-chart-wrapper" style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
                    {stats?.topicStates?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getMasteryData()} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                          <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} width={80} />
                          <Tooltip content={<CustomChartTooltip unit="%" />} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {getMasteryData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index % 2 === 0 ? "url(#colorPurple)" : "url(#colorOrange)"} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-text" style={{ width: '100%' }}>
                        <p>Topic masteries will pop up here as you answer quizzes on different subjects.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Charts Row */}
              <div className="charts-row-full">
                {/* Activity Pulse BarChart */}
                <div className="analytics-card-premium">
                  <h3><Flame size={18} style={{ color: 'var(--orange)' }} /> Daily Learning Pulse</h3>
                  <div className="pulse-chart-wrapper" style={{ height: '250px' }}>
                    {analytics?.pulse?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getPulseData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} allowDecimals={false} tickLine={false} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar dataKey="activity" fill="url(#colorPulse)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-text">
                        <p>Solve tasks, reviews, and quizzes to pulse check your daily learning activity map!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cognitive Distribution List */}
                <div className="analytics-card-premium">
                  <h3><Award size={18} style={{ color: 'var(--orange)' }} /> Topic Engine Levels</h3>
                  <div style={{ marginTop: 16, overflowY: 'auto', maxHeight: '250px', paddingRight: 6 }}>
                    {stats?.topicStates?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {stats.topicStates.map((ts, i) => (
                          <div key={ts.id || i} style={{
                            padding: '12px 18px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white', textTransform: 'capitalize' }}>{ts.topic}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Cognitive Rating Index</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange)' }}>{ts.cognitiveState}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score: {Math.round(ts.emaScore)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-text">
                        <p>No topic states analyzed yet. Select and complete courses to see your subject-specific level distribution!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Settings Panel */
            <div className="tab-content settings-panel-premium" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="settings-card">
                <h3>Personal Info</h3>
                <p className="settings-desc">Update your display information and account parameters below.</p>
                <div className="profile-form">
                  <div className="profile-input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="profile-input-group">
                    <label>Registered Email Address</label>
                    <input type="email" value={auth.currentUser?.email || ''} disabled />
                  </div>
                  <button className="btn-premium btn-premium-primary" onClick={handleSaveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {message && !message.includes('Password') && (
                    <div className={`form-msg ${message.startsWith('Error') ? 'error' : 'success'}`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>

              <div className="settings-card">
                <h3>Account Security</h3>
                <p className="settings-desc">
                  To update your password, request a secure verification and reset link sent to your registered email address.
                </p>
                <button className="btn-premium btn-premium-secondary" onClick={handleResetPassword}>
                  <Mail size={16} /> Send Reset Verification Email
                </button>
                {message && message.includes('Password') && (
                  <div className={`form-msg ${message.startsWith('Error') ? 'error' : 'success'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

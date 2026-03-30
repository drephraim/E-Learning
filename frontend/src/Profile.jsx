import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from './Sidebar';
import './Profile.css';

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  );

  const ChartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  );

export default function Profile() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      try {
        const [statsRes, analyticsRes, userRes] = await Promise.all([
          fetch(`http://localhost:3000/users/${uid}/stats`),
          fetch(`http://localhost:3000/users/${uid}/analytics`),
          fetch(`http://localhost:3000/users/${uid}`)
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
      const resp = await fetch(`http://localhost:3000/users/${auth.currentUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        const updated = await resp.json();
        setUserData(updated);
        setMessage('Profile updated successfully!');
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

  if (loading) return <div className="loading-screen">Loading Profile Analytics...</div>;

  return (
    <div className="profile-layout">
      {/* Sidebar removed as requested */}
      <main className="profile-main">
        <div className="profile-content">
          <div className="profile-top-nav">
              <button className="back-button-simple" onClick={() => navigate('/dashboard')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Dashboard
              </button>
          </div>
          <header className="profile-header">
            <div className="profile-user-info">
              <h1>{userData?.name || auth.currentUser?.displayName || 'Student Profile'}</h1>
              <p>{auth.currentUser?.email}</p>
            </div>
            <div className="cognitive-badge">
                <span className="course-tag purple">{userData?.cognitiveState || 'BEGINNER'} LEVEL</span>
            </div>
          </header>

          <div className="profile-tabs">
            <div 
              className={`profile-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <ChartIcon /> Analytics
            </div>
            <div 
              className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <ShieldIcon /> Security & Settings
            </div>
          </div>

          {activeTab === 'analytics' ? (
            <div className="tab-content animate-in">
              <div className="profile-stats-grid">
                <div className="profile-stat-card">
                  <span className="profile-stat-value">{stats?.totalCourses || 0}</span>
                  <span className="profile-stat-label">Courses Created</span>
                </div>
                <div className="profile-stat-card">
                  <span className="profile-stat-value">{stats?.completedModules || 0}</span>
                  <span className="profile-stat-label">Modules Completed</span>
                </div>
                <div className="profile-stat-card">
                  <span className="profile-stat-value">{stats?.avgScore || 0}%</span>
                  <span className="profile-stat-label">Avg. Quiz Score</span>
                </div>
              </div>

              <div className="analytics-container">
                <div className="analytics-card">
                  <h3>Learning Pulse (Activity)</h3>
                  <div className="pulse-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.pulse || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getMonth()+1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} allowDecimals={false} />
                        <Tooltip 
                            contentStyle={{ background: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#a855f7' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#a855f7" 
                          strokeWidth={3} 
                          dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3>Mastery Breakdown</h3>
                  <div className="mastery-list">
                    {stats?.mastery?.map((item, i) => (
                      <div key={i} className="mastery-item">
                        <div className="mastery-info">
                          <span>{item.title}</span>
                          <span>{item.score}%</span>
                        </div>
                        <div className="mastery-bar">
                          <div className="mastery-fill" style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                    {!stats?.mastery?.length && <p style={{color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem'}}>No mastery data yet. Complete quizzes to see your growth!</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tab-content animate-in security-container">
              <div className="settings-group">
                <h3>Personal Information</h3>
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
                    <label>Email Address</label>
                    <input type="email" value={auth.currentUser?.email} disabled style={{opacity: 0.6, cursor: 'not-allowed'}} />
                  </div>
                  <button 
                    className="save-btn" 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {activeTab === 'security' && message && !message.includes('Password') && (
                    <div style={{ 
                        marginTop: '1.5rem', 
                        padding: '1rem', 
                        borderRadius: '12px', 
                        background: message.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                        border: `1px solid ${message.startsWith('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`,
                        color: message.startsWith('Error') ? '#fca5a5' : '#d8b4fe',
                        fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                  )}
                </div>
              </div>

              <div className="settings-group">
                <h3>Password & Security</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Keep your account secure by resetting your password periodically. We'll send a link to your email to verify your identity.
                </p>
                <button className="reset-btn" onClick={handleResetPassword}>Send Reset Email</button>
                {message && (
                    <div style={{ 
                        marginTop: '1.5rem', 
                        padding: '1rem', 
                        borderRadius: '12px', 
                        background: message.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                        border: `1px solid ${message.startsWith('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`,
                        color: message.startsWith('Error') ? '#fca5a5' : '#d8b4fe',
                        fontSize: '0.9rem'
                    }}>
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

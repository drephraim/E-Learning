import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Sparkles, Home, Compass, Plus, User, LogOut } from 'lucide-react';
import { API_BASE_URL } from './config';
import './Sidebar.css';

const levelColors = {
  BEGINNER: { bg: 'rgba(74,156,232,0.12)', color: '#93c5fd' },
  INTERMEDIATE: { bg: 'rgba(234,179,8,0.12)', color: '#fde047' },
  ADVANCED: { bg: 'rgba(232,136,74,0.12)', color: '#fdba74' },
};

const Sidebar = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, dbUser, logout } = useAuth();
  const [cognitiveState, setCognitiveState] = useState('BEGINNER');

  useEffect(() => {
    const fetchLevel = async () => {
      if (!currentUser) return;
      try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.cognitiveState) setCognitiveState(data.cognitiveState);
        }
      } catch (_) {}
    };
    fetchLevel();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const isActive = (path) => location.pathname === path;

  const studentName = dbUser?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student User';
  const studentInitials = studentName.substring(0, 2).toUpperCase();

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
            <div className="logo-icon"><Sparkles size={16} color="#0c0e12" /></div>
            <span className="logo-text">Adaptive<span style={{ color: 'var(--orange)' }}>Learn</span></span>
          </div>
          <nav className="sidebar-nav">
            <div
              className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <Home size={18} /> <span>Dashboard</span>
            </div>
            <div
              className={`nav-item ${isActive('/explore') ? 'active' : ''}`}
              onClick={() => navigate('/explore')}
            >
              <Compass size={18} /> <span>Explore</span>
            </div>
            <div
              className="nav-item"
              onClick={() => {
                if (onOpenModal) {
                  onOpenModal();
                } else {
                  navigate('/dashboard', { state: { openCreateModal: true } });
                }
              }}
            >
              <Plus size={18} /> <span>Create</span>
            </div>
            <div
              className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              <User size={18} /> <span>Profile</span>
            </div>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar">
              {studentInitials}
            </div>
            <div className="user-info">
              <div className="user-name" title={studentName}>{studentName}</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: levelColors[cognitiveState]?.bg || levelColors.BEGINNER.bg,
                  color: levelColors[cognitiveState]?.color || levelColors.BEGINNER.color,
                }}>
                  {cognitiveState}
                </span>
                {dbUser?.studentProfile?.level && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                  }}>
                    {dbUser.studentProfile.level}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="signout-btn"
            title="Sign out"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div
          className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <Home size={20} />
          <span>Dashboard</span>
        </div>
        <div
          className={`mobile-nav-item ${isActive('/explore') ? 'active' : ''}`}
          onClick={() => navigate('/explore')}
        >
          <Compass size={20} />
          <span>Explore</span>
        </div>
        <div
          className="mobile-nav-item mobile-create-btn"
          onClick={() => {
            if (onOpenModal) {
              onOpenModal();
            } else {
              navigate('/dashboard', { state: { openCreateModal: true } });
            }
          }}
        >
          <div className="mobile-create-icon">
            <Plus size={22} color="#0c0e12" />
          </div>
          <span>Create</span>
        </div>
        <div
          className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;

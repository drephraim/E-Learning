import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { Sparkles, Home, Compass, Plus, User, LogOut } from 'lucide-react';
import { API_BASE_URL } from './config';

const levelColors = {
  BEGINNER: { bg: 'rgba(74,156,232,0.12)', color: '#93c5fd' },
  INTERMEDIATE: { bg: 'rgba(234,179,8,0.12)', color: '#fde047' },
  ADVANCED: { bg: 'rgba(232,136,74,0.12)', color: '#fdba74' },
};

const Sidebar = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cognitiveState, setCognitiveState] = useState('BEGINNER');

  useEffect(() => {
    const fetchLevel = async () => {
      if (!auth.currentUser) return;
      try {
        const res = await fetch(`${API_BASE_URL}/users/${auth.currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.cognitiveState) setCognitiveState(data.cognitiveState);
        }
      } catch (_) {}
    };
    fetchLevel();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchLevel();
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon"><Sparkles size={16} color="#0c0e12" /></div>
          <span className="logo-text">Adaptive<span style={{color: 'var(--orange)'}}>Learn</span></span>
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
            onClick={(e) => {
              if (onOpenModal) {
                onOpenModal();
              } else {
                navigate('/dashboard');
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
            {auth.currentUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="user-info">
            <div className="user-name">{auth.currentUser?.displayName || 'Student User'}</div>
            <div style={{
              display: 'inline-block',
              marginTop: 4,
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: levelColors[cognitiveState]?.bg || levelColors.BEGINNER.bg,
              color: levelColors[cognitiveState]?.color || levelColors.BEGINNER.color,
            }}>
              {cognitiveState}
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
  );
};

export default Sidebar;

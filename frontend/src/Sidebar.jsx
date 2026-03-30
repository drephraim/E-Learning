import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3L10.5 8.5L16 10L10.5 11.5L9 17L7.5 11.5L2 10L7.5 8.5L9 3Z"></path>
    <path d="M18 16L18.5 18.5L21 19L18.5 19.5L18 22L17.5 19.5L15 19L17.5 18.5L18 16Z"></path>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const CompassIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const Sidebar = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar" style={{ minWidth: '240px' }}>
      <div className="sidebar-top">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon"><SparklesIcon /></div>
          <span className="logo-text">AdaptAI</span>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} 
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <HomeIcon /> <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${isActive('/explore') ? 'active' : ''}`} 
            onClick={() => navigate('/explore')}
            style={{ cursor: 'pointer' }}
          >
            <CompassIcon /> <span>Explore</span>
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
            style={{ cursor: 'pointer' }}
          >
            <PlusIcon /> <span>Create</span>
          </div>
          <div 
            className={`nav-item ${isActive('/profile') ? 'active' : ''}`} 
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
          >
            <UserIcon /> <span>Profile</span>
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
            <div className="user-email">{auth.currentUser?.email || 'Learning with AdaptAI'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

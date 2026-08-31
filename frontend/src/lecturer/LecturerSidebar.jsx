import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  BarChart3, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react';
import '../Sidebar.css';

const LecturerSidebar = ({ onOpenUploadModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, dbUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/lecturer/dashboard', icon: LayoutDashboard },
    { label: 'Academic Materials', path: '/lecturer/materials', icon: FileText },
    { label: 'Syllabi', path: '/lecturer/syllabi', icon: BookOpen },
    { label: 'Courses', path: '/lecturer/courses', icon: GraduationCap },
    { label: 'Content Validation', path: '/lecturer/validation', icon: ShieldCheck },
    { label: 'Students', path: '/lecturer/students', icon: Users },
    { label: 'Analytics', path: '/lecturer/analytics', icon: BarChart3 },
    { label: 'Profile', path: '/lecturer/profile', icon: User },
    { label: 'Settings', path: '/lecturer/settings', icon: Settings },
  ];

  const titlePrefix = dbUser?.lecturerProfile?.title || 'Dr.';
  let nameStr = '';
  if (dbUser?.firstName || dbUser?.lastName) {
    nameStr = `${dbUser?.firstName || ''} ${dbUser?.lastName || ''}`.trim();
  } else if (dbUser?.name) {
    nameStr = dbUser.name;
  }
  nameStr = nameStr.replace(/undefined/gi, '').replace(/null/gi, '').trim();
  if (!nameStr) nameStr = 'Lecturer';

  const lecturerName = nameStr.toLowerCase().startsWith('dr') ? nameStr : `${titlePrefix} ${nameStr}`;

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo" onClick={() => navigate('/lecturer/dashboard')}>
            <div className="logo-icon"><Sparkles size={16} color="#0c0e12" /></div>
            <span className="logo-text">Adaptive<span style={{ color: 'var(--orange, #f97316)' }}>Learn</span></span>
          </div>

          <div style={{
            margin: '12px 16px 20px',
            padding: '6px 10px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#818cf8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            Lecturer Portal
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <div
                  key={item.path}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              👨‍🏫
            </div>
            <div className="user-info">
              <div className="user-name" title={lecturerName}>{lecturerName}</div>
              <div style={{
                display: 'inline-block',
                marginTop: 2,
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
              }}>
                {dbUser?.lecturerProfile?.department || 'LECTURER'}
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
    </>
  );
};

export default LecturerSidebar;

import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const { setDbUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'LECTURER'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');
  const [courseTaught, setCourseTaught] = useState(''); // Lecturer specific
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const syncUserWithBackend = async (firebaseUser, registrationData = null) => {
    try {
      const payload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: registrationData?.name || firebaseUser.displayName || email.split('@')[0],
        role,
        ...(registrationData || {}),
      };

      const response = await fetch(`${API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Server responded with ${response.status}`);
      }

      const resData = await response.json();
      const userObj = resData.user;
      setDbUser(userObj);

      // Route based on user role
      const userRole = userObj.role || role;
      if (userRole === 'LECTURER') {
        navigate('/lecturer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot reach backend server. Please verify the backend is running.');
      } else {
        setError('Authentication error: ' + err.message);
      }
      console.error('Sync error:', err);
    }
  };

  const validateRegistration = () => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address.';
    if (!school.trim()) return 'Please enter your school or university name.';
    if (!department.trim()) return 'Please enter your department or programme.';
    if (role === 'LECTURER' && !courseTaught.trim()) return 'Please enter the course you teach.';
    if (!password) return 'Please enter a password.';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    if (password !== confirmPassword) return 'Password and Confirm Password do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      // Sign In Flow
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUserWithBackend(userCredential.user);
      } catch (err) {
        setLoading(false);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(err.message.replace('Firebase:', '').trim());
        }
      }
    } else {
      // Sign Up Flow
      const validationError = validateRegistration();
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const registrationData = {
        role,
        name: fullName.trim(),
        firstName,
        lastName,
        institution: school.trim(),
        ...(role === 'STUDENT' ? {
          studentProfile: {
            programme: department.trim(),
            level: 'Level 100'
          }
        } : {
          lecturerProfile: {
            title: 'Dr.',
            department: department.trim(),
            specialization: courseTaught.trim(),
            verificationStatus: 'VERIFIED'
          }
        })
      };

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserWithBackend(userCredential.user, registrationData);
      } catch (err) {
        setLoading(false);
        if (err.code === 'auth/email-already-in-use') {
          setError('An account with this email address already exists. Please sign in instead.');
        } else {
          setError(err.message.replace('Firebase:', '').trim());
        }
      }
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(userCredential.user, !isLogin ? { role } : null);
    } catch (err) {
      setLoading(false);
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-card">
          {/* Platform Branding Logo */}
          <div className="auth-header text-center">
            <div className="logo" style={{ marginBottom: '12px', fontSize: '1.8rem', fontWeight: 800 }}>
              Adaptive<span style={{ color: '#818cf8' }}>Learn</span>
            </div>
            <p className="auth-subtitle">
              {isLogin 
                ? `Sign in to your ${role === 'STUDENT' ? 'Student' : 'Lecturer'} account` 
                : `Create your ${role === 'STUDENT' ? 'Student' : 'Lecturer'} profile`
              }
            </p>
          </div>

          {/* Role Selector Tabs (Student vs Lecturer) */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`role-tab ${role === 'STUDENT' ? 'active student' : ''}`}
              onClick={() => { setRole('STUDENT'); setError(''); }}
            >
              <span className="role-tab-icon">🎓</span>
              <span className="role-tab-text">Student</span>
            </button>

            <button
              type="button"
              className={`role-tab ${role === 'LECTURER' ? 'active lecturer' : ''}`}
              onClick={() => { setRole('LECTURER'); setError(''); }}
            >
              <span className="role-tab-icon">👨‍🏫</span>
              <span className="role-tab-text">Lecturer</span>
            </button>
          </div>

          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          <div className="auth-mode-switch">
            <button 
              type="button"
              className={`mode-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button 
              type="button"
              className={`mode-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="auth-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {isLogin ? (
              /* ================= SIGN IN FORM ================= */
              <>
                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'STUDENT' ? "student@university.edu" : "lecturer@university.edu"}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>PASSWORD</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={`btn btn-primary auth-submit ${role === 'LECTURER' ? 'lecturer-btn' : ''}`}
                >
                  {loading ? 'Signing In...' : `Sign In as ${role === 'STUDENT' ? 'Student' : 'Lecturer'}`}
                </button>
              </>
            ) : role === 'STUDENT' ? (
              /* ================= STUDENT SIGN UP FORM ================= */
              <>
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>SCHOOL / UNIVERSITY</label>
                    <input 
                      type="text" 
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. University of Ghana"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>DEPARTMENT / PROGRAMME</label>
                    <input 
                      type="text" 
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & IT"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@student.edu"
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>PASSWORD</label>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>CONFIRM PASSWORD</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
                  {loading ? 'Creating Student Account...' : 'Create Student Account'}
                </button>
              </>
            ) : (
              /* ================= LECTURER SIGN UP FORM ================= */
              <>
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>INSTITUTIONAL EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jsmith@university.edu"
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>SCHOOL / UNIVERSITY</label>
                    <input 
                      type="text" 
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. University of Ghana"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>DEPARTMENT</label>
                    <input 
                      type="text" 
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>COURSE YOU TEACH</label>
                  <input 
                    type="text" 
                    required
                    value={courseTaught}
                    onChange={(e) => setCourseTaught(e.target.value)}
                    placeholder="e.g. IT 401 - Machine Learning & AI"
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>PASSWORD</label>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>CONFIRM PASSWORD</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary auth-submit lecturer-btn">
                  {loading ? 'Creating Lecturer Account...' : 'Create Lecturer Account'}
                </button>
              </>
            )}
          </form>

          {/* Social Auth Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Google Single Sign-On */}
          <button type="button" onClick={handleGoogleAuth} disabled={loading} className="btn-google">
            <svg className="google-icon" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          {/* Bottom Switch Link */}
          <p className="auth-toggle">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="toggle-btn">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

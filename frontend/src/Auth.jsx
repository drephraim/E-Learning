import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import './Auth.css';

import { API_BASE_URL } from './config';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const syncUserWithBackend = async (firebaseUser) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || email.split('@')[0],
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Server responded with ${response.status}`);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot reach the backend server. Make sure it is running on port 3000.");
      } else {
        setError("Sign-in error: " + err.message);
      }
      console.error(err);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      await syncUserWithBackend(userCredential.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(userCredential.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header text-center">
            <div className="logo" style={{ marginBottom: '24px' }}>
              Adaptive<span className="text-gradient">Learn</span>
            </div>
            <h2 className="auth-title">{isLogin ? "Welcome Back" : "Create an Account"}</h2>
            <p className="auth-subtitle">
              {isLogin ? "Enter your credentials to access your courses." : "Sign up to start generating adaptive learning roadmaps."}
            </p>
          </div>

          {error && <div className="auth-error">{error.replace('Firebase:', '')}</div>}

          <form onSubmit={handleEmailAuth} className="auth-form">
            <div className="form-group">
              <label>EMAIL ADDRESS</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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

            <button type="submit" className="btn btn-primary auth-submit">
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button type="button" onClick={handleGoogleAuth} className="btn-google">
            <svg className="google-icon" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

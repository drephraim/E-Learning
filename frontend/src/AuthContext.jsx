import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { API_BASE_URL } from './config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = async (firebaseUser) => {
    if (!firebaseUser) {
      setDbUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me/${firebaseUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.user) {
          setDbUser(data.user);
          setLoading(false);
          return data.user;
        }
      }
    } catch (err) {
      console.error('Error fetching DB user profile:', err);
    }

    // Fallback sync if me endpoint isn't ready
    try {
      const syncRes = await fetch(`${API_BASE_URL}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        }),
      });
      if (syncRes.ok) {
        const data = await syncRes.json();
        setDbUser(data.user);
        setLoading(false);
        return data.user;
      }
    } catch (err) {
      console.error('Fallback sync error:', err);
    }

    setLoading(false);
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchDbUser(user);
      } else {
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setDbUser(null);
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      return await fetchDbUser(auth.currentUser);
    }
  };

  const value = {
    currentUser,
    dbUser,
    role: dbUser?.role || 'STUDENT',
    loading,
    logout,
    refreshUser,
    setDbUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

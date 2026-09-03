import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Lazy-loaded Student components
const Landing = lazy(() => import('./Landing'));
const Auth = lazy(() => import('./Auth'));
const Dashboard = lazy(() => import('./Dashboard'));
const CourseView = lazy(() => import('./CourseView'));
const Profile = lazy(() => import('./Profile'));
const Explore = lazy(() => import('./Explore'));

// Lazy-loaded Lecturer components
const LecturerLayout = lazy(() => import('./lecturer/LecturerLayout'));
const LecturerDashboard = lazy(() => import('./lecturer/LecturerDashboard'));
const LecturerCourses = lazy(() => import('./lecturer/LecturerCourses'));
const CourseDetails = lazy(() => import('./lecturer/CourseDetails'));
const LecturerMaterials = lazy(() => import('./lecturer/LecturerMaterials'));
const MaterialDetails = lazy(() => import('./lecturer/MaterialDetails'));
const LecturerSyllabi = lazy(() => import('./lecturer/LecturerSyllabi'));
const SyllabusDetails = lazy(() => import('./lecturer/SyllabusDetails'));
const LecturerStudents = lazy(() => import('./lecturer/LecturerStudents'));
const LecturerProfile = lazy(() => import('./lecturer/LecturerProfile'));
const LecturerValidation = lazy(() => import('./lecturer/LecturerValidation'));
const LecturerAnalytics = lazy(() => import('./lecturer/LecturerAnalytics'));
const LecturerPlaceholder = lazy(() => import('./lecturer/LecturerPlaceholder'));

const PageFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg, #0c0e12)',
    color: 'var(--text-muted, #8b8d98)',
    fontSize: '0.9rem',
    fontWeight: 600
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected Student Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/explore" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Explore />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:id" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'LECTURER']}>
                <CourseView />
              </ProtectedRoute>
            } 
          />

          {/* Protected Lecturer Routes */}
          <Route 
            path="/lecturer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerDashboard />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/courses" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerCourses />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/courses/detail/:id" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <CourseDetails />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/materials" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerMaterials />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/materials/detail/:id" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <MaterialDetails />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/syllabi" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerSyllabi />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/syllabi/detail/:id" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <SyllabusDetails />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/validation" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerValidation />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/students" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerStudents />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/analytics" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerAnalytics />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/profile" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerProfile />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/settings" 
            element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                <LecturerLayout>
                  <LecturerPlaceholder 
                    title="Portal Settings" 
                    subtitle="Configure department preferences and integration settings." 
                  />
                </LecturerLayout>
              </ProtectedRoute>
            } 
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;

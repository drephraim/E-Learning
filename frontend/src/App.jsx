import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

import Landing from './Landing';
import Auth from './Auth';
import Dashboard from './Dashboard';
import CourseView from './CourseView';
import Profile from './Profile';
import Explore from './Explore';

// Lecturer components
import LecturerLayout from './lecturer/LecturerLayout';
import LecturerDashboard from './lecturer/LecturerDashboard';
import LecturerCourses from './lecturer/LecturerCourses';
import CourseDetails from './lecturer/CourseDetails';
import LecturerMaterials from './lecturer/LecturerMaterials';
import MaterialDetails from './lecturer/MaterialDetails';
import LecturerSyllabi from './lecturer/LecturerSyllabi';
import SyllabusDetails from './lecturer/SyllabusDetails';
import LecturerStudents from './lecturer/LecturerStudents';
import LecturerProfile from './lecturer/LecturerProfile';
import LecturerValidation from './lecturer/LecturerValidation';
import LecturerAnalytics from './lecturer/LecturerAnalytics';
import LecturerPlaceholder from './lecturer/LecturerPlaceholder';

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ThemeToggle from './components/ThemeToggle';

// Auth
import Login from './pages/casestack/Login';
import FirmSetupProfessional from './pages/casestack/FirmSetupProfessional';
import EmailVerification from './pages/casestack/EmailVerification';
import ForgotPassword from './pages/casestack/ForgotPassword';

// Main screens
import Dashboard from './pages/casestack/Dashboard';
import CaseList from './pages/casestack/CaseList';
import CaseDetail from './pages/casestack/CaseDetail';
import Search from './pages/casestack/Search';
import Archive from './pages/casestack/Archive';
import AuditLogs from './pages/casestack/AuditLogs';
import Admin from './pages/casestack/Admin';

// ============================================
// CASESTACK APP
// Professional Black & White Theme
// Advanced Auth System
// ============================================

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/setup" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        {/* Public Routes - Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<FirmSetupProfessional />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/cases" element={
          <ProtectedRoute>
            <CaseList />
          </ProtectedRoute>
        } />
        
        <Route path="/cases/:id" element={
          <ProtectedRoute>
            <CaseDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/search" element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } />
        
        <Route path="/archive" element={
          <ProtectedRoute>
            <Archive />
          </ProtectedRoute>
        } />
        
        <Route path="/audit" element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;

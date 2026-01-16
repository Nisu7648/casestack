import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/cases/CaseList';
import CaseDetail from './pages/cases/CaseDetail';
import CreateCase from './pages/cases/CreateCase';
import AnalysisList from './pages/analysis/AnalysisList';
import AnalysisDetail from './pages/analysis/AnalysisDetail';
import CreateAnalysis from './pages/analysis/CreateAnalysis';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Register />
                  </AuthLayout>
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CaseList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/new"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreateCase />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CaseDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/:caseId/analyses"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AnalysisList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/:caseId/analyses/new"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreateAnalysis />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyses/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AnalysisDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

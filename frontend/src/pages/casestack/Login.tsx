import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react';

// ============================================
// 1️⃣ LOGIN & FIRM CONTEXT SCREEN
// Desktop-first, official, no animations
// ============================================

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firmInfo, setFirmInfo] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CASESTACK</h1>
          <p className="text-sm text-gray-600">Finalization & Defensibility System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-300 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Firm Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                  placeholder="you@firm.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {firmInfo && (
              <div className="p-3 bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Firm</p>
                <p className="text-sm font-medium text-gray-900">{firmInfo.name}</p>
                <p className="text-xs text-gray-600 mt-1">Role: {firmInfo.role}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              No cross-firm switching. No personal dashboards.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © 2024 CASESTACK. Enterprise finalization system.
        </p>
      </div>
    </div>
  );
}

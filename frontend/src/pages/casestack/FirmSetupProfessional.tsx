import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Mail, Check, ArrowRight, Sparkles, Shield, Zap, Lock, User } from 'lucide-react';

// ============================================
// SIMPLE SIGNUP & LOGIN - NO PRICING
// Fixed network error with full API URL
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'https://casestack-backend.onrender.com';

export default function FirmSetupProfessional() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'auth' | 'firm' | 'complete'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Auth form data
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  // Firm form data
  const [firmData, setFirmData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user already has a firm
      if (parsedUser.firmId) {
        navigate('/dashboard');
      } else {
        setStep('firm');
      }
    }
  }, [navigate]);

  // ============================================
  // SIGN UP
  // ============================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Signing up with:', { email: authData.email, firstName: authData.firstName });

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password,
          firstName: authData.firstName,
          lastName: authData.lastName
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }

      const data = await response.json();
      console.log('Signup successful:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setStep('firm');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Logging in with:', { email: authData.email });

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      if (data.user.firmId) {
        navigate('/dashboard');
      } else {
        setStep('firm');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CREATE FIRM
  // ============================================
  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      console.log('Creating firm with:', firmData);

      const response = await fetch(`${API_URL}/api/firm/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(firmData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create firm');
      }

      const data = await response.json();
      console.log('Firm created:', data);

      // Update user data
      const updatedUser = { ...user, firmId: data.firm.id };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setStep('complete');
    } catch (error: any) {
      console.error('Create firm error:', error);
      setError(error.message || 'Failed to create firm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // AUTH STEP (LOGIN/SIGNUP)
  // ============================================
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to CASESTACK
            </h1>
            <p className="text-gray-600">
              {authMode === 'signup' ? 'Create your account to get started' : 'Sign in to your account'}
            </p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={authMode === 'signup' ? handleSignUp : handleLogin}>
              {authMode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={authData.firstName}
                        onChange={(e) => setAuthData({ ...authData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={authData.lastName}
                        onChange={(e) => setAuthData({ ...authData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {authMode === 'signup' 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Secure</p>
            </div>
            <div>
              <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Fast</p>
            </div>
            <div>
              <Sparkles className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">AI-Powered</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // FIRM SETUP STEP
  // ============================================
  if (step === 'firm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Setup Your Firm
            </h1>
            <p className="text-gray-600">
              Tell us about your firm to get started
            </p>
          </div>

          {/* Firm Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateFirm}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={firmData.name}
                  onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Accounting LLP"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={firmData.email}
                  onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@acme.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={firmData.phone}
                  onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={firmData.address}
                  onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St, City, Country"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={firmData.website}
                  onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://acme.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : (
                  <>
                    Create Firm
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPLETE STEP
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          All Set! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your firm has been created successfully
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

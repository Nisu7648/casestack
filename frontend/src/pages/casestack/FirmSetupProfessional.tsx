import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowRight, Check, Sparkles, Shield, Zap, TrendingUp, Users, Eye, EyeOff } from 'lucide-react';

// ============================================
// MODERN SPLIT-SCREEN LOGIN/SIGNUP
// With email verification & password reset
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'https://casestack-backend.onrender.com';

export default function FirmSetupProfessional() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'auth' | 'firm' | 'complete'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if coming from verification
      if (location.state?.verified) {
        setStep('firm');
        return;
      }
      
      // Check if email is verified
      if (!parsedUser.isVerified) {
        navigate('/verify-email', { state: { email: parsedUser.email } });
        return;
      }
      
      if (parsedUser.firmId) {
        navigate('/dashboard');
      } else {
        setStep('firm');
      }
    }
  }, [navigate, location]);

  // ============================================
  // SIGN UP
  // ============================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('token', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      
      // Redirect to email verification
      navigate('/verify-email', { state: { email: data.user.email } });
    } catch (error: any) {
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

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if email verification is required
        if (errorData.verificationRequired) {
          navigate('/verify-email', { state: { email: authData.email } });
          return;
        }
        
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('token', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      
      if (data.user.firmId) {
        navigate('/dashboard');
      } else {
        setStep('firm');
      }
    } catch (error: any) {
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

      const response = await fetch(`${API_URL}/api/firm/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(firmData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create firm');
      }

      const data = await response.json();
      const updatedUser = { ...user, firmId: data.firm.id };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setStep('complete');
    } catch (error: any) {
      setError(error.message || 'Failed to create firm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // AUTH STEP - MODERN SPLIT SCREEN
  // ============================================
  if (step === 'auth') {
    return (
      <div className="min-h-screen flex">
        {/* LEFT SIDE - BRANDING */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">CASESTACK</span>
            </div>

            {/* Main message */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Modern Case<br />Management<br />for Professionals
              </h1>
              <p className="text-xl text-white/90 max-w-md">
                Streamline your workflow with AI-powered tools designed for accounting firms and legal practices.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="relative z-10 grid grid-cols-2 gap-6">
            {[
              { icon: Zap, text: 'Lightning Fast' },
              { icon: Shield, text: 'Bank-Level Security' },
              { icon: Users, text: 'Team Collaboration' },
              { icon: TrendingUp, text: 'Real-time Analytics' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - AUTH FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CASESTACK</span>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex gap-2 mb-8 bg-white rounded-xl p-1 shadow-sm">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setError('');
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {authMode === 'signup' 
                  ? 'Start your 14-day free trial today' 
                  : 'Sign in to continue to your dashboard'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={authMode === 'signup' ? handleSignUp : handleLogin} className="space-y-5">
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={authData.firstName}
                        onChange={(e) => setAuthData({ ...authData, firstName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={authData.lastName}
                        onChange={(e) => setAuthData({ ...authData, lastName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    minLength={authMode === 'signup' ? 8 : 6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {authMode === 'signup' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {authMode === 'login' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Social proof */}
            {authMode === 'signup' && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Trusted by 1,000+ firms worldwide
                </p>
                <div className="flex justify-center gap-8 opacity-50">
                  <div className="text-2xl font-bold text-gray-400">ACME</div>
                  <div className="text-2xl font-bold text-gray-400">CORP</div>
                  <div className="text-2xl font-bold text-gray-400">LEGAL</div>
                </div>
              </div>
            )}
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
        <div className="max-w-3xl w-full">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                <Check className="w-5 h-5" />
              </div>
              <div className="w-16 h-1 bg-blue-600"></div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold">
                3
              </div>
            </div>
            <p className="text-center text-gray-600">Step 2 of 3: Setup Your Firm</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tell Us About Your Firm
              </h1>
              <p className="text-gray-600">
                This helps us personalize your experience
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateFirm} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firmData.name}
                  onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Acme Accounting LLP"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={firmData.email}
                    onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="contact@acme.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={firmData.phone}
                    onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={firmData.address}
                  onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="123 Main Street, City, Country"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={firmData.website}
                  onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="https://acme.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
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
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-green-500 rounded-full opacity-20 animate-ping"></div>
          </div>
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl">
            <Check className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          You're All Set! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your firm has been created successfully.<br />
          Let's start managing your cases!
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">AI-Powered</p>
          </div>
          <div>
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Secure</p>
          </div>
          <div>
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Fast</p>
          </div>
        </div>
      </div>
    </div>
  );
}

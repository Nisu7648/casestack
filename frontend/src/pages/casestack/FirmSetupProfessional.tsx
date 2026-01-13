import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Mail, Check, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

// ============================================
// PROFESSIONAL FIRM SETUP WITH GOOGLE SIGN-IN
// Beautiful, modern UI with smooth animations
// ============================================

export default function FirmSetupProfessional() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'auth' | 'firm' | 'complete'>('auth');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
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
  // GOOGLE SIGN-IN
  // ============================================
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Initialize Google Sign-In
      // @ts-ignore
      const google = window.google;
      
      if (!google) {
        alert('Google Sign-In not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      // This will be handled by Google OAuth
      // For now, show manual sign-in option
      setStep('firm');
      setLoading(false);
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Failed to sign in with Google');
      setLoading(false);
    }
  };

  // ============================================
  // EMAIL SIGN-IN
  // ============================================
  const handleEmailSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      if (data.user.firmId) {
        navigate('/dashboard');
      } else {
        setStep('firm');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CREATE FIRM
  // ============================================
  const handleCreateFirm = async () => {
    if (!firmData.name) {
      alert('Please enter your firm name');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/firm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(firmData)
      });

      if (!response.ok) throw new Error('Failed to create firm');

      const data = await response.json();
      
      // Update user data
      const updatedUser = { ...user, firmId: data.firm.id };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setStep('complete');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Create firm error:', error);
      alert('Failed to create firm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER AUTH SCREEN
  // ============================================
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to CASESTACK
            </h1>
            <p className="text-gray-600">
              Professional case management for modern firms
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-semibold text-gray-700">
                Continue with Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Sign-In Form */}
            <EmailSignInForm onSubmit={handleEmailSignIn} loading={loading} />
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Secure</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Fast</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-2">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">AI-Powered</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER FIRM SETUP SCREEN
  // ============================================
  if (step === 'firm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Account</span>
              </div>
              <div className="w-16 h-0.5 bg-blue-600"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Firm Setup</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Complete</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Set Up Your Firm
            </h1>
            <p className="text-gray-600">
              Tell us about your firm to get started
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="space-y-6">
              {/* Firm Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Firm Name *
                </label>
                <input
                  type="text"
                  value={firmData.name}
                  onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  placeholder="e.g., Smith & Associates"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Firm Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={firmData.email}
                    onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                    placeholder="contact@yourfirm.com"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={firmData.phone}
                  onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={firmData.address}
                  onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  placeholder="123 Main Street, City, State, ZIP"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={firmData.website}
                  onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                  placeholder="https://yourfirm.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setStep('auth')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleCreateFirm}
                disabled={loading || !firmData.name}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Creating...'
                ) : (
                  <>
                    Create Firm
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>You can update these details later in settings</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER COMPLETION SCREEN
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-2xl animate-bounce">
            <Check className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 All Set!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your firm has been created successfully
        </p>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-700">Invite your team members</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Create your first case</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">Explore AI-powered features</span>
            </div>
          </div>
        </div>

        {/* Redirect Message */}
        <p className="text-sm text-gray-500">
          Redirecting to dashboard in 3 seconds...
        </p>
      </div>
    </div>
  );
}

// ============================================
// EMAIL SIGN-IN FORM COMPONENT
// ============================================
function EmailSignInForm({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void, loading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </form>
  );
}

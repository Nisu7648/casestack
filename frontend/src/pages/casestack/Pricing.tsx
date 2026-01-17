import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Globe, Users, Database, Zap, Shield, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://casestack-backend.onrender.com';

// Country list with codes
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' }
];

interface Plan {
  id: string;
  name: string;
  maxUsers: number;
  maxCases: number;
  maxStorage: number;
  features: string[];
}

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [userCount, setUserCount] = useState(5);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [pricing, setPricing] = useState<any>(null);
  const [calculations, setCalculations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Fetch plans
  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch pricing when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchPricing();
    }
  }, [selectedCountry]);

  // Calculate costs when inputs change
  useEffect(() => {
    if (pricing && Object.keys(plans).length > 0) {
      calculateAllPlans();
    }
  }, [pricing, plans, userCount, billingCycle]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/subscription/pricing/${selectedCountry}`);
      const data = await response.json();
      if (data.success) {
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllPlans = async () => {
    const newCalculations: Record<string, any> = {};

    for (const [planId, plan] of Object.entries(plans)) {
      try {
        // Check if user count exceeds plan limit
        if (plan.maxUsers !== -1 && userCount > plan.maxUsers) {
          newCalculations[planId] = {
            error: `Maximum ${plan.maxUsers} users`
          };
          continue;
        }

        const response = await fetch(`${API_URL}/api/subscription/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryCode: selectedCountry,
            planId,
            userCount
          })
        });

        const data = await response.json();
        if (data.success) {
          newCalculations[planId] = data.calculation;
        }
      } catch (error) {
        console.error(`Failed to calculate ${planId}:`, error);
      }
    }

    setCalculations(newCalculations);
  };

  const handleSelectPlan = (planId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/setup', { 
        state: { 
          returnTo: '/pricing',
          selectedPlan: planId,
          selectedCountry,
          userCount,
          billingCycle
        } 
      });
      return;
    }

    navigate('/checkout', {
      state: {
        planId,
        countryCode: selectedCountry,
        userCount,
        billingCycle,
        calculation: calculations[planId]
      }
    });
  };

  const getPlanIcon = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'starter': return Users;
      case 'professional': return TrendingUp;
      case 'enterprise': return Sparkles;
      default: return Database;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'starter': return 'from-blue-600 to-cyan-600';
      case 'professional': return 'from-purple-600 to-pink-600';
      case 'enterprise': return 'from-orange-600 to-red-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your firm. Pay per user, cancel anytime.
          </p>

          {/* Country Selector */}
          <div className="inline-flex items-center gap-3 bg-white rounded-xl p-2 shadow-lg">
            <Globe className="w-5 h-5 text-gray-400 ml-2" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent font-medium text-gray-900 cursor-pointer"
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-2xl mx-auto mb-12 space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-1 shadow-lg inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 15%
                </span>
              </button>
            </div>
          </div>

          {/* User Count Slider */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Number of Users
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{userCount}</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={userCount}
              onChange={(e) => setUserCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1 user</span>
              <span>50 users</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([planId, plan]) => {
            const calc = calculations[planId];
            const Icon = getPlanIcon(planId);
            const isPopular = planId.toLowerCase() === 'professional';

            return (
              <div
                key={planId}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${
                  isPopular ? 'ring-4 ring-purple-600 relative' : ''
                }`}
              >
                {isPopular && (
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 font-medium text-sm">
                    ⭐ MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getPlanColor(planId)} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        {plan.maxUsers === -1 ? 'Unlimited' : `Up to ${plan.maxUsers}`} users
                      </p>
                    </div>
                  </div>

                  {/* Pricing */}
                  {calc && !calc.error ? (
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {billingCycle === 'monthly' ? calc.monthly.formatted : calc.yearly.formatted}
                        </span>
                        <span className="text-gray-500">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {calc.symbol}{calc.pricePerUser} per user/{billingCycle === 'monthly' ? 'month' : 'year'}
                      </p>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          Save {calc.yearly.savingsFormatted} per year
                        </p>
                      )}
                    </div>
                  ) : calc?.error ? (
                    <div className="mb-6">
                      <p className="text-red-600 font-medium">{calc.error}</p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(planId)}
                    disabled={calc?.error}
                    className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need to Succeed
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Bank-Level Security',
                description: 'Your data is encrypted and protected with enterprise-grade security'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Optimized performance ensures your team works without delays'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Work together seamlessly with real-time updates and notifications'
              },
              {
                icon: Database,
                title: 'Unlimited Storage',
                description: 'Store all your case files, documents, and data without limits'
              },
              {
                icon: TrendingUp,
                title: 'Advanced Analytics',
                description: 'Get insights into your firm\'s performance with detailed reports'
              },
              {
                icon: Globe,
                title: 'Global Support',
                description: '24/7 customer support in multiple languages and time zones'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Our team is here to help you choose the right plan
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}

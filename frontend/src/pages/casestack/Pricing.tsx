import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Globe, Users, Database, Zap, Shield, TrendingUp, ArrowRight, Sparkles, Crown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://casestack-backend.onrender.com';

interface Country {
  code: string;
  country: string;
  currency: string;
  symbol: string;
  price: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  features: string[];
  limits: {
    users: number;
    cases: number;
    storage: number;
  };
}

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState('GB');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [countries, setCountries] = useState<Country[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch plan and countries
  useEffect(() => {
    fetchPlan();
    fetchCountries();
  }, []);

  // Calculate cost when inputs change
  useEffect(() => {
    if (selectedCountry) {
      calculateCost();
    }
  }, [selectedCountry, billingCycle]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/plan`);
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/countries/all`);
      const data = await response.json();
      if (data.success) {
        setCountries(data.countries);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const calculateCost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/subscription/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: selectedCountry,
          billingCycle
        })
      });

      const data = await response.json();
      if (data.success) {
        setCalculation(data.calculation);
      }
    } catch (error) {
      console.error('Failed to calculate cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/setup', { 
        state: { 
          returnTo: '/pricing',
          selectedCountry,
          billingCycle
        } 
      });
      return;
    }

    navigate('/checkout', {
      state: {
        countryCode: selectedCountry,
        billingCycle,
        calculation
      }
    });
  };

  if (loading && !calculation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  const currentPrice = billingCycle === 'monthly' 
    ? calculation?.monthly?.formatted 
    : calculation?.yearly?.formatted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            <span>One Plan, All Features, Fair Pricing</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Professional Case Management
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete solution for law firms. Priced fairly based on your country's economy.
          </p>

          {/* Country Selector */}
          <div className="inline-flex items-center gap-3 bg-white rounded-xl p-2 shadow-lg">
            <Globe className="w-5 h-5 text-gray-400 ml-2" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent font-medium text-gray-900 cursor-pointer"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.country} ({country.symbol}{country.price})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
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

        {/* Main Pricing Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-600 relative">
            {/* Popular Badge */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-3 font-bold text-lg">
              ⭐ COMPLETE SOLUTION - ALL FEATURES INCLUDED
            </div>

            <div className="p-12">
              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {plan?.name}
                </h2>
                <p className="text-lg text-gray-600">
                  {plan?.description}
                </p>
              </div>

              {/* Pricing */}
              {calculation && (
                <div className="text-center mb-10">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-bold text-gray-900">
                      {currentPrice}
                    </span>
                    <span className="text-2xl text-gray-500">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    For your entire firm • Unlimited everything
                  </p>
                  {billingCycle === 'yearly' && calculation.yearly && (
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                      <span className="font-medium">
                        Save {calculation.yearly.savingsFormatted} per year (15% discount)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handleSelectPlan}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-10"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-6 h-6" />
              </button>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                {plan?.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why Fair Pricing */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Why Country-Based Pricing?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fair & Accessible</h3>
              <p className="text-gray-600">
                Pricing adjusted to your country's economy and cost of living. Everyone gets the same features.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Hidden Costs</h3>
              <p className="text-gray-600">
                One price for unlimited users, cases, and storage. No per-user fees or surprise charges.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-600 to-red-600 rounded-2xl mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Features</h3>
              <p className="text-gray-600">
                Every customer gets the complete solution with all features, regardless of country.
              </p>
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-white mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">
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
                title: 'Unlimited Users',
                description: 'Add your entire team without worrying about per-user costs'
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
                title: '24/7 Support',
                description: 'Customer support available around the clock in multiple languages'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Tiers Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Pricing Tiers by Region
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🏆 Premium Markets</h3>
              <p className="text-sm text-gray-600 mb-3">Switzerland, Norway, Luxembourg, Iceland</p>
              <p className="text-2xl font-bold text-purple-600">CHF 95 - kr 850</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-3">💼 High-Income Markets</h3>
              <p className="text-sm text-gray-600 mb-3">US, UK, Australia, Canada, EU</p>
              <p className="text-2xl font-bold text-blue-600">$75 - £78 - €72</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🌍 Emerging Markets</h3>
              <p className="text-sm text-gray-600 mb-3">India, Brazil, South Africa, etc.</p>
              <p className="text-2xl font-bold text-green-600">₹4,800 - R$320</p>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-6">
            All tiers include the exact same features. Pricing varies only by country's economy.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Our team is here to help you get started
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}

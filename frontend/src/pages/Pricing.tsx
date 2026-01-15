import React, { useState } from 'react';
import { Check, Zap, Users, TrendingUp, Shield, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Pricing: React.FC = () => {
  const [userCount, setUserCount] = useState(5);
  
  const pricePerUser = 78;
  const monthlyTotal = userCount * pricePerUser;
  const annualTotal = monthlyTotal * 12;
  
  // Competitor comparison
  const clioPrice = 349;
  const myCasePrice = 299;
  const savingsVsClio = ((clioPrice - pricePerUser) / clioPrice * 100).toFixed(0);
  const savingsVsMyCase = ((myCasePrice - pricePerUser) / myCasePrice * 100).toFixed(0);

  const features = [
    'Unlimited Cases',
    'Unlimited Storage',
    'AI Case Assistant',
    'Predictive Analytics',
    'Risk Assessment',
    'Smart Recommendations',
    'Workflow Automation',
    'Video Meetings',
    'Email Integration',
    'Voice Commands',
    'Client Portal',
    'Contract Management',
    'E-Signatures',
    'Advanced Reporting',
    'API Access',
    'White Label',
    'Priority Support',
    'Custom Integrations',
    'SSO & SAML',
    'Audit Logs'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Simple, Transparent Pricing
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              One Plan.
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Everything Included.
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No tiers, no limits, no surprises. Just $78 per user per month with all features included.
          </p>
        </div>

        {/* Main Pricing Card */}
        <div className="max-w-4xl mx-auto mb-16 animate-scale-in">
          <Card variant="glass" className="overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">CaseStack Pro</h2>
                  <p className="text-purple-100">All features. Unlimited everything.</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">${pricePerUser}</div>
                  <div className="text-purple-100">per user/month</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <label className="block text-sm font-medium mb-3">
                  How many users do you need?
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={userCount}
                  onChange={(e) => setUserCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-3xl font-bold">{userCount}</div>
                    <div className="text-sm text-purple-100">users</div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">${monthlyTotal.toLocaleString()}</div>
                    <div className="text-sm text-purple-100">per month</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-100">Annual billing</span>
                    <span className="font-bold">${annualTotal.toLocaleString()}/year</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    What's Included
                  </h3>
                  <div className="space-y-3">
                    {features.slice(0, 10).map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    And More...
                  </h3>
                  <div className="space-y-3">
                    {features.slice(10).map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="gradient" size="lg" fullWidth>
                  <Zap className="w-5 h-5" />
                  Start 14-Day Free Trial
                </Button>
                <Button variant="secondary" size="lg" fullWidth>
                  Schedule Demo
                </Button>
              </div>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                No credit card required • Cancel anytime • 14-day free trial
              </p>
            </div>
          </Card>
        </div>

        {/* Comparison */}
        <div className="max-w-5xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Compare & Save
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* CaseStack */}
            <Card variant="gradient" className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
              </div>
              <div className="p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">CaseStack</h3>
                <div className="text-4xl font-bold mb-4">${pricePerUser}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>All Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Unlimited Everything</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Clio */}
            <Card variant="default" className="opacity-75">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Clio</h3>
                <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">${clioPrice}</div>
                <div className="text-red-600 dark:text-red-400 font-bold mb-4">
                  {savingsVsClio}% more expensive
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Basic Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-red-500">✗</span>
                    <span>No AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-red-500">✗</span>
                    <span>Limited Storage</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* MyCase */}
            <Card variant="default" className="opacity-75">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">MyCase</h3>
                <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">${myCasePrice}</div>
                <div className="text-red-600 dark:text-red-400 font-bold mb-4">
                  {savingsVsMyCase}% more expensive
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Basic Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-red-500">✗</span>
                    <span>No AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-red-500">✗</span>
                    <span>Outdated UI</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-fade-in">
          <Card variant="glass" hover>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Scale Easily
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add or remove users anytime. Pay only for what you use.
              </p>
            </div>
          </Card>

          <Card variant="glass" hover>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Predictable Costs
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No hidden fees. No surprise charges. Simple pricing.
              </p>
            </div>
          </Card>

          <Card variant="glass" hover>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Enterprise Ready
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                SOC 2, GDPR compliant. Bank-level security included.
              </p>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-16 animate-fade-in">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          
          <Card variant="glass">
            <div className="p-8 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! Get 14 days free with full access to all features. No credit card required.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  Can I change my user count?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely. Add or remove users anytime. Your bill adjusts automatically with prorated charges.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We accept all major credit cards (Visa, Mastercard, Amex) via Stripe.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes. Cancel anytime with no penalties. Your data remains accessible for 30 days after cancellation.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

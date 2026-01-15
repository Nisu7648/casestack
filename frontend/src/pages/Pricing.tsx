import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface PricingData {
  price: number;
  currency: string;
  name: string;
}

interface CompetitorPricing {
  clio: number;
  mycase: number;
  practicepanther: number;
}

const Pricing: React.FC = () => {
  const [userCount, setUserCount] = useState(5);
  const [pricing, setPricing] = useState<PricingData>({ price: 78, currency: 'USD', name: 'United States' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch geo-based pricing
    fetch('/api/billing/pricing/geo')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPricing(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch pricing:', err))
      .finally(() => setLoading(false));
  }, []);

  const monthlyTotal = userCount * pricing.price;
  const annualTotal = monthlyTotal * 12;

  // Competitor pricing (in USD equivalent)
  const competitors: CompetitorPricing = {
    clio: 349,
    mycase: 299,
    practicepanther: 249
  };

  const savingsVsClio = Math.round(((competitors.clio - pricing.price) / competitors.clio) * 100);
  const savingsVsMyCase = Math.round(((competitors.mycase - pricing.price) / competitors.mycase) * 100);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded mb-6">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Simple, Transparent Pricing
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
            One Plan.
            <br />
            Everything Included.
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {pricing.currency} {pricing.price} per user per month. All features. No limits. No surprises.
          </p>
        </div>

        {/* Main Pricing Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="border-2 border-black dark:border-white bg-white dark:bg-black">
            
            {/* Header */}
            <div className="bg-black dark:bg-white p-8 text-white dark:text-black">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">CaseStack Pro</h2>
                  <p className="text-gray-300 dark:text-gray-700">All features. Unlimited everything.</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">{pricing.currency} {pricing.price}</div>
                  <div className="text-gray-300 dark:text-gray-700">per user/month</div>
                </div>
              </div>
              
              {/* User Calculator */}
              <div className="bg-white/10 dark:bg-black/10 border border-white/20 dark:border-black/20 p-6">
                <label className="block text-sm font-medium mb-3">
                  How many users do you need?
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={userCount}
                  onChange={(e) => setUserCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 dark:bg-black/20 rounded appearance-none cursor-pointer"
                />
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-3xl font-bold">{userCount}</div>
                    <div className="text-sm text-gray-300 dark:text-gray-700">users</div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{pricing.currency} {monthlyTotal.toLocaleString()}</div>
                    <div className="text-sm text-gray-300 dark:text-gray-700">per month</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 dark:border-black/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 dark:text-gray-700">Annual billing</span>
                    <span className="font-bold">{pricing.currency} {annualTotal.toLocaleString()}/year</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="p-8">
              <h3 className="font-bold text-lg mb-6 text-black dark:text-white">
                Everything Included
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white dark:text-black" />
                    </div>
                    <span className="text-gray-900 dark:text-gray-100">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <button className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 px-6 border-2 border-black dark:border-white hover:bg-gray-900 dark:hover:bg-gray-100">
                  Start 14-Day Free Trial
                </button>
                <button className="w-full bg-white dark:bg-black text-black dark:text-white font-bold py-4 px-6 border-2 border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900">
                  Schedule Demo
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                No credit card required • Cancel anytime • 14-day free trial
              </p>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">
            Compare & Save
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* CaseStack */}
            <div className="border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black p-6 relative">
              <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold mb-2">CaseStack</h3>
              <div className="text-4xl font-bold mb-4">{pricing.currency} {pricing.price}</div>
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

            {/* Clio */}
            <div className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-6">
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">Clio</h3>
              <div className="text-4xl font-bold mb-2 text-black dark:text-white">USD {competitors.clio}</div>
              <div className="text-red-600 dark:text-red-400 font-bold mb-4">
                {savingsVsClio}% more expensive
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Basic Features</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span>No AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span>Limited Storage</span>
                </div>
              </div>
            </div>

            {/* MyCase */}
            <div className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-6">
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">MyCase</h3>
              <div className="text-4xl font-bold mb-2 text-black dark:text-white">USD {competitors.mycase}</div>
              <div className="text-red-600 dark:text-red-400 font-bold mb-4">
                {savingsVsMyCase}% more expensive
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Basic Features</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span>No AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span>Outdated UI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">
            Frequently Asked Questions
          </h2>
          
          <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-8 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2 text-black dark:text-white">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Get 14 days free with full access to all features. No credit card required.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2 text-black dark:text-white">
                Can I change my user count?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Absolutely. Add or remove users anytime. Your bill adjusts automatically with prorated charges.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2 text-black dark:text-white">
                Why is pricing different per country?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We use geo-based pricing to ensure fair, affordable access based on local purchasing power and market conditions.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2 text-black dark:text-white">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes. Cancel anytime with no penalties. Your data remains accessible for 30 days after cancellation.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;

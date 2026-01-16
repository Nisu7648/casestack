import React, { useState } from 'react';
import { Check, Globe, TrendingUp, Users, Shield, Zap } from 'lucide-react';

// ============================================
// SIMPLE COUNTRY-BASED PRICING
// Monthly pricing only - NO DISCOUNTS
// ============================================

interface PricingTier {
  country: string;
  currency: string;
  symbol: string;
  pricePerUser: number;
  region: string;
}

const PRICING_TIERS: PricingTier[] = [
  // HIGH-COST COUNTRIES
  { country: 'Switzerland', currency: 'CHF', symbol: 'CHF', pricePerUser: 85, region: 'Europe (High)' },
  { country: 'Norway', currency: 'NOK', symbol: 'kr', pricePerUser: 850, region: 'Europe (High)' },
  { country: 'Denmark', currency: 'DKK', symbol: 'kr', pricePerUser: 550, region: 'Europe (High)' },
  { country: 'Sweden', currency: 'SEK', symbol: 'kr', pricePerUser: 850, region: 'Europe (High)' },
  
  // MEDIUM-HIGH COUNTRIES
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', pricePerUser: 68, region: 'Europe (Medium)' },
  { country: 'United States', currency: 'USD', symbol: '$', pricePerUser: 75, region: 'North America' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', pricePerUser: 95, region: 'North America' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', pricePerUser: 110, region: 'Oceania' },
  { country: 'New Zealand', currency: 'NZD', symbol: 'NZ$', pricePerUser: 115, region: 'Oceania' },
  
  // MEDIUM COUNTRIES (EU)
  { country: 'Germany', currency: 'EUR', symbol: '€', pricePerUser: 65, region: 'Europe (Medium)' },
  { country: 'France', currency: 'EUR', symbol: '€', pricePerUser: 65, region: 'Europe (Medium)' },
  { country: 'Netherlands', currency: 'EUR', symbol: '€', pricePerUser: 65, region: 'Europe (Medium)' },
  { country: 'Belgium', currency: 'EUR', symbol: '€', pricePerUser: 65, region: 'Europe (Medium)' },
  { country: 'Austria', currency: 'EUR', symbol: '€', pricePerUser: 65, region: 'Europe (Medium)' },
  { country: 'Ireland', currency: 'EUR', symbol: '€', pricePerUser: 65, region: 'Europe (Medium)' },
  { country: 'Italy', currency: 'EUR', symbol: '€', pricePerUser: 58, region: 'Europe (Medium)' },
  { country: 'Spain', currency: 'EUR', symbol: '€', pricePerUser: 55, region: 'Europe (Medium)' },
  
  // LOWER-COST COUNTRIES
  { country: 'India', currency: 'INR', symbol: '₹', pricePerUser: 1499, region: 'Asia (Low)' },
  { country: 'Pakistan', currency: 'PKR', symbol: 'Rs', pricePerUser: 4500, region: 'Asia (Low)' },
  { country: 'Bangladesh', currency: 'BDT', symbol: '৳', pricePerUser: 1800, region: 'Asia (Low)' },
  { country: 'Philippines', currency: 'PHP', symbol: '₱', pricePerUser: 950, region: 'Asia (Low)' },
  { country: 'Indonesia', currency: 'IDR', symbol: 'Rp', pricePerUser: 285000, region: 'Asia (Low)' },
  { country: 'Vietnam', currency: 'VND', symbol: '₫', pricePerUser: 450000, region: 'Asia (Low)' },
  { country: 'Thailand', currency: 'THB', symbol: '฿', pricePerUser: 650, region: 'Asia (Low)' },
  
  // MEDIUM-LOW COUNTRIES
  { country: 'Singapore', currency: 'SGD', symbol: 'S$', pricePerUser: 85, region: 'Asia (Medium)' },
  { country: 'Hong Kong', currency: 'HKD', symbol: 'HK$', pricePerUser: 580, region: 'Asia (Medium)' },
  { country: 'Japan', currency: 'JPY', symbol: '¥', pricePerUser: 8500, region: 'Asia (Medium)' },
  { country: 'South Korea', currency: 'KRW', symbol: '₩', pricePerUser: 85000, region: 'Asia (Medium)' },
  { country: 'Malaysia', currency: 'MYR', symbol: 'RM', pricePerUser: 280, region: 'Asia (Medium)' },
  
  // MIDDLE EAST
  { country: 'UAE', currency: 'AED', symbol: 'AED', pricePerUser: 275, region: 'Middle East' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', pricePerUser: 280, region: 'Middle East' },
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', pricePerUser: 270, region: 'Middle East' },
  
  // AFRICA
  { country: 'South Africa', currency: 'ZAR', symbol: 'R', pricePerUser: 1200, region: 'Africa' },
  { country: 'Nigeria', currency: 'NGN', symbol: '₦', pricePerUser: 32000, region: 'Africa' },
  { country: 'Kenya', currency: 'KES', symbol: 'KSh', pricePerUser: 8500, region: 'Africa' },
  
  // LATIN AMERICA
  { country: 'Brazil', currency: 'BRL', symbol: 'R$', pricePerUser: 350, region: 'Latin America' },
  { country: 'Mexico', currency: 'MXN', symbol: 'MX$', pricePerUser: 1350, region: 'Latin America' },
  { country: 'Argentina', currency: 'ARS', symbol: 'ARS', pricePerUser: 65000, region: 'Latin America' },
  { country: 'Chile', currency: 'CLP', symbol: 'CLP', pricePerUser: 62000, region: 'Latin America' },
];

const PricingPage: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [pricing, setPricing] = useState<PricingTier | null>(null);
  const [userCount, setUserCount] = useState<number>(5);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter countries based on search
  const filteredCountries = PRICING_TIERS.filter(tier =>
    tier.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group countries by region
  const groupedCountries = filteredCountries.reduce((acc, tier) => {
    if (!acc[tier.region]) {
      acc[tier.region] = [];
    }
    acc[tier.region].push(tier);
    return acc;
  }, {} as Record<string, PricingTier[]>);

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    const selectedPricing = PRICING_TIERS.find(t => t.country === country);
    setPricing(selectedPricing || null);
  };

  // Calculate total
  const monthlyTotal = pricing ? pricing.pricePerUser * userCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">
              Simple, Fair Pricing
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              Pay what's fair for your location
            </p>
            <p className="text-lg text-blue-200">
              {pricing?.symbol}{pricing?.pricePerUser.toLocaleString() || '...'} per user per month
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Country Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Select Your Country
            </h2>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search for your country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
            />
          </div>

          {/* Country List by Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedCountries).map(([region, countries]) => (
              <div key={region} className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                  {region}
                </h3>
                {countries.map((tier) => (
                  <button
                    key={tier.country}
                    onClick={() => handleCountrySelect(tier.country)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedCountry === tier.country
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{tier.country}</div>
                    <div className="text-sm text-gray-600">
                      {tier.symbol}{tier.pricePerUser.toLocaleString()}/user/month
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Calculator */}
        {pricing && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Your Pricing for {pricing.country}
            </h2>

            {/* User Count Selector */}
            <div className="mb-8">
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Number of Users
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={userCount}
                  onChange={(e) => setUserCount(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-3xl font-bold text-blue-600 min-w-[80px] text-right">
                  {userCount}
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>1 user</span>
                <span>50 users</span>
              </div>
            </div>

            {/* Pricing Display */}
            <div className="border-2 border-blue-600 rounded-xl p-8 bg-blue-50">
              <div className="text-center">
                <div className="text-sm text-blue-600 uppercase tracking-wide mb-2 font-semibold">
                  Monthly Plan
                </div>
                <div className="text-6xl font-bold text-gray-900 mb-4">
                  {pricing.symbol}{monthlyTotal.toLocaleString()}
                </div>
                <div className="text-xl text-gray-600 mb-6">
                  per month for {userCount} {userCount === 1 ? 'user' : 'users'}
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex justify-between max-w-md mx-auto">
                    <span>Price per user:</span>
                    <span className="font-medium">{pricing.symbol}{pricing.pricePerUser.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between max-w-md mx-auto">
                    <span>Number of users:</span>
                    <span className="font-medium">{userCount}</span>
                  </div>
                  <div className="flex justify-between max-w-md mx-auto pt-2 border-t text-lg font-bold text-gray-900">
                    <span>Total per month:</span>
                    <span>{pricing.symbol}{monthlyTotal.toLocaleString()}</span>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Included */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Everything Included
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Unlimited Cases', desc: 'Manage unlimited cases and clients' },
              { icon: Shield, title: 'Bank-Level Security', desc: 'Enterprise-grade encryption' },
              { icon: Zap, title: 'AI-Powered Analysis', desc: 'Automated document processing' },
              { icon: TrendingUp, title: 'Advanced Reports', desc: 'Real-time analytics & insights' },
              { icon: Globe, title: 'Multi-Language', desc: 'Support for 20+ languages' },
              { icon: Check, title: '24/7 Support', desc: 'Priority email & chat support' },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-gray-600 mb-6">
            Start your free 14-day trial today. No credit card required.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

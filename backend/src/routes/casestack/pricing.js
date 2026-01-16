const express = require('express');
const router = express.Router();

// ============================================
// COUNTRY-BASED PRICING API
// Dynamic pricing based on location
// ============================================

const PRICING_TIERS = [
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

// ============================================
// 1. GET ALL COUNTRIES WITH PRICING
// ============================================
router.get('/countries', (req, res) => {
  try {
    // Group by region
    const grouped = PRICING_TIERS.reduce((acc, tier) => {
      if (!acc[tier.region]) {
        acc[tier.region] = [];
      }
      acc[tier.region].push(tier);
      return acc;
    }, {});

    res.json({
      success: true,
      total: PRICING_TIERS.length,
      countries: PRICING_TIERS,
      grouped
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Failed to get countries' });
  }
});

// ============================================
// 2. GET PRICING FOR SPECIFIC COUNTRY
// ============================================
router.get('/country/:country', (req, res) => {
  try {
    const { country } = req.params;
    
    const pricing = PRICING_TIERS.find(
      t => t.country.toLowerCase() === country.toLowerCase()
    );

    if (!pricing) {
      return res.status(404).json({ 
        error: 'Country not found',
        message: 'Pricing not available for this country'
      });
    }

    res.json({
      success: true,
      pricing
    });
  } catch (error) {
    console.error('Get country pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// ============================================
// 3. CALCULATE PRICING
// ============================================
router.post('/calculate', (req, res) => {
  try {
    const { country, userCount = 1, billingCycle = 'monthly' } = req.body;

    if (!country) {
      return res.status(400).json({ error: 'Country is required' });
    }

    const pricing = PRICING_TIERS.find(
      t => t.country.toLowerCase() === country.toLowerCase()
    );

    if (!pricing) {
      return res.status(404).json({ error: 'Country not found' });
    }

    // Calculate monthly
    const monthlyPerUser = pricing.pricePerUser;
    const monthlyTotal = monthlyPerUser * userCount;

    // Calculate yearly (with 15% discount)
    const yearlyTotal = monthlyTotal * 12;
    const yearlyDiscount = yearlyTotal * 0.15;
    const yearlyFinal = yearlyTotal - yearlyDiscount;
    const yearlyMonthly = yearlyFinal / 12;

    res.json({
      success: true,
      country: pricing.country,
      currency: pricing.currency,
      symbol: pricing.symbol,
      userCount,
      monthly: {
        perUser: monthlyPerUser,
        total: monthlyTotal,
        formatted: `${pricing.symbol}${monthlyTotal.toLocaleString()}`
      },
      yearly: {
        perUser: Math.round(yearlyMonthly),
        total: Math.round(yearlyFinal),
        discount: Math.round(yearlyDiscount),
        savings: '15%',
        formatted: `${pricing.symbol}${Math.round(yearlyFinal).toLocaleString()}`
      }
    });
  } catch (error) {
    console.error('Calculate pricing error:', error);
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// ============================================
// 4. COMPARE PRICING ACROSS COUNTRIES
// ============================================
router.post('/compare', (req, res) => {
  try {
    const { countries, userCount = 1 } = req.body;

    if (!countries || !Array.isArray(countries)) {
      return res.status(400).json({ error: 'Countries array is required' });
    }

    const comparison = countries.map(country => {
      const pricing = PRICING_TIERS.find(
        t => t.country.toLowerCase() === country.toLowerCase()
      );

      if (!pricing) return null;

      const monthlyTotal = pricing.pricePerUser * userCount;
      const yearlyTotal = monthlyTotal * 12;
      const yearlyDiscount = yearlyTotal * 0.15;
      const yearlyFinal = yearlyTotal - yearlyDiscount;

      return {
        country: pricing.country,
        currency: pricing.currency,
        symbol: pricing.symbol,
        region: pricing.region,
        monthly: monthlyTotal,
        yearly: Math.round(yearlyFinal),
        formatted: {
          monthly: `${pricing.symbol}${monthlyTotal.toLocaleString()}`,
          yearly: `${pricing.symbol}${Math.round(yearlyFinal).toLocaleString()}`
        }
      };
    }).filter(Boolean);

    res.json({
      success: true,
      userCount,
      comparison
    });
  } catch (error) {
    console.error('Compare pricing error:', error);
    res.status(500).json({ error: 'Failed to compare pricing' });
  }
});

// ============================================
// 5. GET PRICING BY REGION
// ============================================
router.get('/region/:region', (req, res) => {
  try {
    const { region } = req.params;
    
    const countries = PRICING_TIERS.filter(
      t => t.region.toLowerCase().includes(region.toLowerCase())
    );

    if (countries.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.json({
      success: true,
      region,
      count: countries.length,
      countries
    });
  } catch (error) {
    console.error('Get region pricing error:', error);
    res.status(500).json({ error: 'Failed to get region pricing' });
  }
});

// ============================================
// 6. SEARCH COUNTRIES
// ============================================
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({
        success: true,
        results: PRICING_TIERS
      });
    }

    const results = PRICING_TIERS.filter(tier =>
      tier.country.toLowerCase().includes(q.toLowerCase()) ||
      tier.region.toLowerCase().includes(q.toLowerCase())
    );

    res.json({
      success: true,
      query: q,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Search countries error:', error);
    res.status(500).json({ error: 'Failed to search countries' });
  }
});

// ============================================
// 7. TEST ENDPOINT
// ============================================
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Pricing API working',
    totalCountries: PRICING_TIERS.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

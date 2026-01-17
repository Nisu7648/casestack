// ============================================
// SUBSCRIPTION SERVICE
// Single-tier pricing with country-specific rates
// Based on per capita income and cost of living
// ============================================

// Country-specific pricing based on economy, luxury, and per capita income
const COUNTRY_PRICING = {
  // Tier 1: Premium Markets (High income, high cost of living)
  CH: { currency: 'CHF', symbol: 'CHF', price: 95, country: 'Switzerland' },
  NO: { currency: 'NOK', symbol: 'kr', price: 850, country: 'Norway' },
  LU: { currency: 'EUR', symbol: '€', price: 85, country: 'Luxembourg' },
  IS: { currency: 'ISK', symbol: 'kr', price: 11000, country: 'Iceland' },
  
  // Tier 2: High-Income Markets
  US: { currency: 'USD', symbol: '$', price: 75, country: 'United States' },
  GB: { currency: 'GBP', symbol: '£', price: 78, country: 'United Kingdom' },
  AU: { currency: 'AUD', symbol: 'A$', price: 110, country: 'Australia' },
  CA: { currency: 'CAD', symbol: 'C$', price: 95, country: 'Canada' },
  DK: { currency: 'DKK', symbol: 'kr', price: 520, country: 'Denmark' },
  SE: { currency: 'SEK', symbol: 'kr', price: 780, country: 'Sweden' },
  NL: { currency: 'EUR', symbol: '€', price: 72, country: 'Netherlands' },
  AT: { currency: 'EUR', symbol: '€', price: 70, country: 'Austria' },
  FI: { currency: 'EUR', symbol: '€', price: 68, country: 'Finland' },
  BE: { currency: 'EUR', symbol: '€', price: 68, country: 'Belgium' },
  
  // Tier 3: Upper-Middle Income Markets
  DE: { currency: 'EUR', symbol: '€', price: 65, country: 'Germany' },
  FR: { currency: 'EUR', symbol: '€', price: 65, country: 'France' },
  IT: { currency: 'EUR', symbol: '€', price: 60, country: 'Italy' },
  ES: { currency: 'EUR', symbol: '€', price: 58, country: 'Spain' },
  IE: { currency: 'EUR', symbol: '€', price: 72, country: 'Ireland' },
  NZ: { currency: 'NZD', symbol: 'NZ$', price: 115, country: 'New Zealand' },
  SG: { currency: 'SGD', symbol: 'S$', price: 98, country: 'Singapore' },
  HK: { currency: 'HKD', symbol: 'HK$', price: 580, country: 'Hong Kong' },
  JP: { currency: 'JPY', symbol: '¥', price: 10500, country: 'Japan' },
  KR: { currency: 'KRW', symbol: '₩', price: 88000, country: 'South Korea' },
  AE: { currency: 'AED', symbol: 'د.إ', price: 270, country: 'UAE' },
  SA: { currency: 'SAR', symbol: 'ر.س', price: 275, country: 'Saudi Arabia' },
  QA: { currency: 'QAR', symbol: 'ر.ق', price: 270, country: 'Qatar' },
  
  // Tier 4: Middle Income Markets
  PT: { currency: 'EUR', symbol: '€', price: 52, country: 'Portugal' },
  GR: { currency: 'EUR', symbol: '€', price: 48, country: 'Greece' },
  PL: { currency: 'PLN', symbol: 'zł', price: 240, country: 'Poland' },
  CZ: { currency: 'CZK', symbol: 'Kč', price: 1350, country: 'Czech Republic' },
  IL: { currency: 'ILS', symbol: '₪', price: 260, country: 'Israel' },
  ZA: { currency: 'ZAR', symbol: 'R', price: 1100, country: 'South Africa' },
  BR: { currency: 'BRL', symbol: 'R$', price: 320, country: 'Brazil' },
  MX: { currency: 'MXN', symbol: 'Mex$', price: 1250, country: 'Mexico' },
  CL: { currency: 'CLP', symbol: '$', price: 58000, country: 'Chile' },
  AR: { currency: 'ARS', symbol: '$', price: 62000, country: 'Argentina' },
  TR: { currency: 'TRY', symbol: '₺', price: 2100, country: 'Turkey' },
  MY: { currency: 'MYR', symbol: 'RM', price: 320, country: 'Malaysia' },
  TH: { currency: 'THB', symbol: '฿', price: 2400, country: 'Thailand' },
  
  // Tier 5: Lower-Middle Income Markets
  CN: { currency: 'CNY', symbol: '¥', price: 480, country: 'China' },
  RU: { currency: 'RUB', symbol: '₽', price: 6500, country: 'Russia' },
  IN: { currency: 'INR', symbol: '₹', price: 4800, country: 'India' },
  ID: { currency: 'IDR', symbol: 'Rp', price: 950000, country: 'Indonesia' },
  PH: { currency: 'PHP', symbol: '₱', price: 3200, country: 'Philippines' },
  VN: { currency: 'VND', symbol: '₫', price: 1450000, country: 'Vietnam' },
  EG: { currency: 'EGP', symbol: 'E£', price: 2800, country: 'Egypt' },
  NG: { currency: 'NGN', symbol: '₦', price: 92000, country: 'Nigeria' },
  KE: { currency: 'KES', symbol: 'KSh', price: 7500, country: 'Kenya' },
  PK: { currency: 'PKR', symbol: 'Rs', price: 16500, country: 'Pakistan' },
  BD: { currency: 'BDT', symbol: '৳', price: 6500, country: 'Bangladesh' },
  LK: { currency: 'LKR', symbol: 'Rs', price: 21000, country: 'Sri Lanka' },
  
  // Tier 6: Emerging Markets
  UA: { currency: 'UAH', symbol: '₴', price: 2600, country: 'Ukraine' },
  RO: { currency: 'RON', symbol: 'lei', price: 280, country: 'Romania' },
  BG: { currency: 'BGN', symbol: 'лв', price: 110, country: 'Bulgaria' },
  RS: { currency: 'RSD', symbol: 'дин', price: 6500, country: 'Serbia' },
  
  // Default (USD - Medium tier)
  DEFAULT: { currency: 'USD', symbol: '$', price: 75, country: 'International' }
};

// Single plan with all features
const PLAN = {
  id: 'professional',
  name: 'Professional',
  description: 'Complete case management solution for law firms',
  features: [
    'Unlimited users',
    'Unlimited cases',
    'Unlimited storage',
    'Advanced case management',
    'Document management',
    'Client portal',
    'Time tracking & billing',
    'Calendar & scheduling',
    'Task management',
    'Email integration',
    'Custom workflows',
    'Advanced reporting & analytics',
    'Audit logs & compliance',
    'Role-based access control',
    'API access',
    'Mobile app (iOS & Android)',
    'Priority email support',
    '24/7 customer support',
    'Regular updates',
    'Data encryption & security',
    'Multi-language support',
    'Custom integrations',
    'Dedicated account manager',
    'Training & onboarding'
  ],
  limits: {
    users: -1,      // Unlimited
    cases: -1,      // Unlimited
    storage: -1     // Unlimited
  }
};

// In-memory subscription storage
const subscriptions = new Map();

class SubscriptionService {
  // Get pricing for country
  static getPricingForCountry(countryCode) {
    const pricing = COUNTRY_PRICING[countryCode?.toUpperCase()] || COUNTRY_PRICING.DEFAULT;
    return pricing;
  }

  // Get all supported countries grouped by tier
  static getSupportedCountries() {
    const tiers = {
      premium: [],
      high: [],
      upperMiddle: [],
      middle: [],
      lowerMiddle: [],
      emerging: []
    };

    const premiumCodes = ['CH', 'NO', 'LU', 'IS'];
    const highCodes = ['US', 'GB', 'AU', 'CA', 'DK', 'SE', 'NL', 'AT', 'FI', 'BE'];
    const upperMiddleCodes = ['DE', 'FR', 'IT', 'ES', 'IE', 'NZ', 'SG', 'HK', 'JP', 'KR', 'AE', 'SA', 'QA'];
    const middleCodes = ['PT', 'GR', 'PL', 'CZ', 'IL', 'ZA', 'BR', 'MX', 'CL', 'AR', 'TR', 'MY', 'TH'];
    const lowerMiddleCodes = ['CN', 'RU', 'IN', 'ID', 'PH', 'VN', 'EG', 'NG', 'KE', 'PK', 'BD', 'LK'];
    const emergingCodes = ['UA', 'RO', 'BG', 'RS'];

    Object.entries(COUNTRY_PRICING).forEach(([code, data]) => {
      if (code === 'DEFAULT') return;
      
      const country = { code, ...data };
      
      if (premiumCodes.includes(code)) tiers.premium.push(country);
      else if (highCodes.includes(code)) tiers.high.push(country);
      else if (upperMiddleCodes.includes(code)) tiers.upperMiddle.push(country);
      else if (middleCodes.includes(code)) tiers.middle.push(country);
      else if (lowerMiddleCodes.includes(code)) tiers.lowerMiddle.push(country);
      else if (emergingCodes.includes(code)) tiers.emerging.push(country);
    });

    return tiers;
  }

  // Get all countries as flat list
  static getAllCountries() {
    return Object.entries(COUNTRY_PRICING)
      .filter(([code]) => code !== 'DEFAULT')
      .map(([code, data]) => ({
        code,
        ...data
      }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }

  // Calculate subscription cost
  static calculateCost(countryCode, billingCycle = 'monthly') {
    const pricing = this.getPricingForCountry(countryCode);
    
    const monthlyPrice = pricing.price;
    const yearlyPrice = Math.round(monthlyPrice * 12 * 0.85); // 15% discount
    const savings = Math.round(monthlyPrice * 12 - yearlyPrice);

    return {
      plan: PLAN.name,
      country: pricing.country,
      currency: pricing.currency,
      symbol: pricing.symbol,
      monthly: {
        price: monthlyPrice,
        formatted: `${pricing.symbol}${monthlyPrice.toLocaleString()}`
      },
      yearly: {
        price: yearlyPrice,
        formatted: `${pricing.symbol}${yearlyPrice.toLocaleString()}`,
        savings: savings,
        savingsFormatted: `${pricing.symbol}${savings.toLocaleString()}`,
        savingsPercent: 15
      }
    };
  }

  // Create subscription
  static createSubscription(firmId, data) {
    const { countryCode, billingCycle, paymentMethod } = data;

    const cost = this.calculateCost(countryCode, billingCycle);

    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firmId,
      plan: PLAN,
      pricing: cost,
      billingCycle, // 'monthly' or 'yearly'
      countryCode,
      status: 'active', // active, cancelled, suspended, expired
      paymentMethod, // card, bank_transfer, etc.
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    subscriptions.set(subscription.id, subscription);
    
    // Also store by firmId for quick lookup
    const firmSubs = this.getSubscriptionsByFirm(firmId);
    firmSubs.push(subscription.id);
    subscriptions.set(`firm_${firmId}`, firmSubs);

    return subscription;
  }

  // Get subscription by ID
  static getSubscription(subscriptionId) {
    return subscriptions.get(subscriptionId);
  }

  // Get subscriptions by firm
  static getSubscriptionsByFirm(firmId) {
    return subscriptions.get(`firm_${firmId}`) || [];
  }

  // Get active subscription for firm
  static getActiveSubscription(firmId) {
    const subIds = this.getSubscriptionsByFirm(firmId);
    
    for (const subId of subIds) {
      const sub = subscriptions.get(subId);
      if (sub && sub.status === 'active') {
        return sub;
      }
    }
    
    return null;
  }

  // Update subscription
  static updateSubscription(subscriptionId, updates) {
    const subscription = subscriptions.get(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Recalculate cost if billing cycle changed
    if (updates.billingCycle) {
      const cost = this.calculateCost(
        subscription.countryCode,
        updates.billingCycle
      );
      updates.pricing = cost;
    }

    Object.assign(subscription, updates, { updatedAt: new Date() });
    subscriptions.set(subscriptionId, subscription);
    
    return subscription;
  }

  // Cancel subscription
  static cancelSubscription(subscriptionId, immediate = false) {
    const subscription = subscriptions.get(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (immediate) {
      subscription.status = 'cancelled';
      subscription.currentPeriodEnd = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    subscription.updatedAt = new Date();
    subscriptions.set(subscriptionId, subscription);
    
    return subscription;
  }

  // Reactivate subscription
  static reactivateSubscription(subscriptionId) {
    const subscription = subscriptions.get(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.status = 'active';
    subscription.cancelAtPeriodEnd = false;
    subscription.updatedAt = new Date();
    
    subscriptions.set(subscriptionId, subscription);
    
    return subscription;
  }

  // Get plan details
  static getPlan() {
    return PLAN;
  }

  // Process subscription renewal
  static processRenewal(subscriptionId) {
    const subscription = subscriptions.get(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check if should cancel
    if (subscription.cancelAtPeriodEnd) {
      subscription.status = 'cancelled';
      subscription.updatedAt = new Date();
      subscriptions.set(subscriptionId, subscription);
      return { renewed: false, cancelled: true };
    }

    // Renew subscription
    const daysToAdd = subscription.billingCycle === 'yearly' ? 365 : 30;
    subscription.currentPeriodStart = subscription.currentPeriodEnd;
    subscription.currentPeriodEnd = new Date(
      subscription.currentPeriodEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );
    subscription.updatedAt = new Date();
    
    subscriptions.set(subscriptionId, subscription);
    
    return { renewed: true, subscription };
  }
}

module.exports = SubscriptionService;

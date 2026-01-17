// ============================================
// SUBSCRIPTION SERVICE
// Country-based pricing with currency support
// ============================================

// Pricing tiers per user per month
const PRICING_TIERS = {
  // United States & Canada
  US: { currency: 'USD', symbol: '$', price: 68 },
  CA: { currency: 'CAD', symbol: 'C$', price: 92 },
  
  // United Kingdom & Europe
  GB: { currency: 'GBP', symbol: '£', price: 54 },
  EU: { currency: 'EUR', symbol: '€', price: 63 },
  DE: { currency: 'EUR', symbol: '€', price: 63 },
  FR: { currency: 'EUR', symbol: '€', price: 63 },
  IT: { currency: 'EUR', symbol: '€', price: 63 },
  ES: { currency: 'EUR', symbol: '€', price: 63 },
  NL: { currency: 'EUR', symbol: '€', price: 63 },
  
  // Asia Pacific
  AU: { currency: 'AUD', symbol: 'A$', price: 102 },
  NZ: { currency: 'NZD', symbol: 'NZ$', price: 110 },
  SG: { currency: 'SGD', symbol: 'S$', price: 92 },
  HK: { currency: 'HKD', symbol: 'HK$', price: 530 },
  JP: { currency: 'JPY', symbol: '¥', price: 10200 },
  
  // India & South Asia
  IN: { currency: 'INR', symbol: '₹', price: 5700 },
  PK: { currency: 'PKR', symbol: 'Rs', price: 19000 },
  BD: { currency: 'BDT', symbol: '৳', price: 7500 },
  
  // Middle East
  AE: { currency: 'AED', symbol: 'د.إ', price: 250 },
  SA: { currency: 'SAR', symbol: 'ر.س', price: 255 },
  
  // Africa
  ZA: { currency: 'ZAR', symbol: 'R', price: 1250 },
  NG: { currency: 'NGN', symbol: '₦', price: 105000 },
  KE: { currency: 'KES', symbol: 'KSh', price: 8800 },
  
  // Latin America
  BR: { currency: 'BRL', symbol: 'R$', price: 340 },
  MX: { currency: 'MXN', symbol: 'Mex$', price: 1360 },
  AR: { currency: 'ARS', symbol: '$', price: 68000 },
  
  // Default (USD)
  DEFAULT: { currency: 'USD', symbol: '$', price: 68 }
};

// Subscription plans
const PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    maxUsers: 5,
    maxCases: 100,
    maxStorage: 10, // GB
    features: [
      'Up to 5 users',
      '100 active cases',
      '10 GB storage',
      'Basic case management',
      'Email support',
      'Mobile app access'
    ]
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    maxUsers: 20,
    maxCases: 500,
    maxStorage: 50, // GB
    features: [
      'Up to 20 users',
      '500 active cases',
      '50 GB storage',
      'Advanced case management',
      'Priority email support',
      'Mobile app access',
      'Custom workflows',
      'Advanced reporting',
      'API access'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    maxUsers: -1, // Unlimited
    maxCases: -1, // Unlimited
    maxStorage: -1, // Unlimited
    features: [
      'Unlimited users',
      'Unlimited cases',
      'Unlimited storage',
      'Full case management suite',
      '24/7 priority support',
      'Mobile app access',
      'Custom workflows',
      'Advanced reporting',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'White-label options'
    ]
  }
};

// In-memory subscription storage
const subscriptions = new Map();

class SubscriptionService {
  // Get pricing for country
  static getPricingForCountry(countryCode) {
    const pricing = PRICING_TIERS[countryCode?.toUpperCase()] || PRICING_TIERS.DEFAULT;
    return pricing;
  }

  // Calculate subscription cost
  static calculateCost(countryCode, planId, userCount) {
    const pricing = this.getPricingForCountry(countryCode);
    const plan = PLANS[planId.toUpperCase()];
    
    if (!plan) {
      throw new Error('Invalid plan');
    }

    // Check user limit
    if (plan.maxUsers !== -1 && userCount > plan.maxUsers) {
      throw new Error(`Plan ${plan.name} supports maximum ${plan.maxUsers} users`);
    }

    const monthlyTotal = pricing.price * userCount;
    const yearlyTotal = monthlyTotal * 12 * 0.85; // 15% discount for yearly

    return {
      plan: plan.name,
      currency: pricing.currency,
      symbol: pricing.symbol,
      pricePerUser: pricing.price,
      userCount,
      monthly: {
        perUser: pricing.price,
        total: monthlyTotal,
        formatted: `${pricing.symbol}${monthlyTotal.toLocaleString()}`
      },
      yearly: {
        perUser: Math.round(pricing.price * 12 * 0.85),
        total: Math.round(yearlyTotal),
        formatted: `${pricing.symbol}${Math.round(yearlyTotal).toLocaleString()}`,
        savings: Math.round(monthlyTotal * 12 - yearlyTotal),
        savingsFormatted: `${pricing.symbol}${Math.round(monthlyTotal * 12 - yearlyTotal).toLocaleString()}`
      }
    };
  }

  // Create subscription
  static createSubscription(firmId, data) {
    const { countryCode, planId, userCount, billingCycle, paymentMethod } = data;

    const cost = this.calculateCost(countryCode, planId, userCount);
    const plan = PLANS[planId.toUpperCase()];

    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firmId,
      plan: {
        id: planId.toLowerCase(),
        name: plan.name,
        maxUsers: plan.maxUsers,
        maxCases: plan.maxCases,
        maxStorage: plan.maxStorage,
        features: plan.features
      },
      pricing: cost,
      billingCycle, // 'monthly' or 'yearly'
      userCount,
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

    // Recalculate cost if user count or plan changed
    if (updates.userCount || updates.planId) {
      const newUserCount = updates.userCount || subscription.userCount;
      const newPlanId = updates.planId || subscription.plan.id;
      
      const cost = this.calculateCost(
        subscription.countryCode,
        newPlanId,
        newUserCount
      );
      
      updates.pricing = cost;
      
      if (updates.planId) {
        const plan = PLANS[updates.planId.toUpperCase()];
        updates.plan = {
          id: updates.planId.toLowerCase(),
          name: plan.name,
          maxUsers: plan.maxUsers,
          maxCases: plan.maxCases,
          maxStorage: plan.maxStorage,
          features: plan.features
        };
      }
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

  // Check if firm can add more users
  static canAddUsers(firmId, additionalUsers) {
    const subscription = this.getActiveSubscription(firmId);
    
    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const plan = subscription.plan;
    
    // Unlimited users
    if (plan.maxUsers === -1) {
      return { allowed: true };
    }

    const newTotal = subscription.userCount + additionalUsers;
    
    if (newTotal > plan.maxUsers) {
      return {
        allowed: false,
        reason: `Plan ${plan.name} supports maximum ${plan.maxUsers} users. You currently have ${subscription.userCount} users.`,
        currentUsers: subscription.userCount,
        maxUsers: plan.maxUsers,
        requestedUsers: newTotal
      };
    }

    return { allowed: true };
  }

  // Check if firm can add more cases
  static canAddCases(firmId, additionalCases, currentCases) {
    const subscription = this.getActiveSubscription(firmId);
    
    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const plan = subscription.plan;
    
    // Unlimited cases
    if (plan.maxCases === -1) {
      return { allowed: true };
    }

    const newTotal = currentCases + additionalCases;
    
    if (newTotal > plan.maxCases) {
      return {
        allowed: false,
        reason: `Plan ${plan.name} supports maximum ${plan.maxCases} cases. You currently have ${currentCases} cases.`,
        currentCases,
        maxCases: plan.maxCases,
        requestedCases: newTotal
      };
    }

    return { allowed: true };
  }

  // Get all plans
  static getAllPlans() {
    return PLANS;
  }

  // Get plan details
  static getPlan(planId) {
    return PLANS[planId.toUpperCase()];
  }

  // Get all supported countries
  static getSupportedCountries() {
    return Object.keys(PRICING_TIERS)
      .filter(key => key !== 'DEFAULT')
      .map(code => ({
        code,
        ...PRICING_TIERS[code]
      }));
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

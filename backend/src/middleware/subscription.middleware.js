// Subscription & Billing Middleware
// Single plan: $78 per user per month

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// PRICING MODEL
// ============================================
const PRICING = {
  PRICE_PER_USER: 78, // $78 per user per month
  CURRENCY: 'USD',
  BILLING_INTERVAL: 'month',
  
  // Free trial
  TRIAL_DAYS: 14,
  
  // All features included
  FEATURES: {
    unlimitedCases: true,
    unlimitedStorage: true,
    aiAssistant: true,
    workflows: true,
    videoMeetings: true,
    emailIntegration: true,
    voiceCommands: true,
    clientPortal: true,
    contractManagement: true,
    advancedReporting: true,
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
    customIntegrations: true,
    sso: true,
    auditLogs: true,
  }
};

// ============================================
// CHECK SUBSCRIPTION STATUS
// ============================================
const checkSubscription = async (req, res, next) => {
  try {
    const { firmId } = req.user;
    
    // Get firm with user count
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        _count: {
          select: {
            users: true,
          }
        }
      }
    });
    
    if (!firm) {
      return res.status(404).json({
        success: false,
        error: 'Firm not found'
      });
    }
    
    const userCount = firm._count.users;
    const monthlyAmount = userCount * PRICING.PRICE_PER_USER;
    
    // Check if in trial period
    const trialEndsAt = firm.trialEndsAt ? new Date(firm.trialEndsAt) : null;
    const isInTrial = trialEndsAt && trialEndsAt > new Date();
    
    // Check if subscription is active
    if (!isInTrial && firm.subscriptionStatus !== 'ACTIVE') {
      return res.status(402).json({
        success: false,
        error: 'Subscription expired. Please update your payment method.',
        code: 'SUBSCRIPTION_EXPIRED',
        billing: {
          userCount,
          pricePerUser: PRICING.PRICE_PER_USER,
          monthlyAmount,
          currency: PRICING.CURRENCY
        }
      });
    }
    
    // Attach subscription info to request
    req.subscription = {
      userCount,
      pricePerUser: PRICING.PRICE_PER_USER,
      monthlyAmount,
      isInTrial,
      trialEndsAt,
      features: PRICING.FEATURES,
      billing: {
        nextBillingDate: firm.subscriptionRenewsAt,
        amount: monthlyAmount,
        currency: PRICING.CURRENCY
      }
    };
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify subscription'
    });
  }
};

// ============================================
// CHECK USER LIMIT (BEFORE ADDING NEW USER)
// ============================================
const checkUserLimit = async (req, res, next) => {
  try {
    const { firmId } = req.user;
    
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    const currentUsers = firm._count.users;
    const newUserCount = currentUsers + 1;
    const newMonthlyAmount = newUserCount * PRICING.PRICE_PER_USER;
    
    // Check if in trial
    const trialEndsAt = firm.trialEndsAt ? new Date(firm.trialEndsAt) : null;
    const isInTrial = trialEndsAt && trialEndsAt > new Date();
    
    // If not in trial, check payment method
    if (!isInTrial && !firm.stripeCustomerId) {
      return res.status(402).json({
        success: false,
        error: 'Please add a payment method before adding more users.',
        code: 'PAYMENT_METHOD_REQUIRED',
        billing: {
          currentUsers,
          newUserCount,
          pricePerUser: PRICING.PRICE_PER_USER,
          currentMonthly: currentUsers * PRICING.PRICE_PER_USER,
          newMonthly: newMonthlyAmount,
          additionalCost: PRICING.PRICE_PER_USER
        }
      });
    }
    
    // Attach billing info for confirmation
    req.newUserBilling = {
      currentUsers,
      newUserCount,
      pricePerUser: PRICING.PRICE_PER_USER,
      newMonthlyAmount,
      additionalCost: PRICING.PRICE_PER_USER
    };
    
    next();
  } catch (error) {
    console.error('User limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify user limit'
    });
  }
};

// ============================================
// CALCULATE BILLING AMOUNT
// ============================================
const calculateBilling = async (firmId) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    const userCount = firm._count.users;
    const monthlyAmount = userCount * PRICING.PRICE_PER_USER;
    const annualAmount = monthlyAmount * 12;
    
    // Calculate proration if mid-cycle
    const now = new Date();
    const renewsAt = firm.subscriptionRenewsAt ? new Date(firm.subscriptionRenewsAt) : null;
    let proratedAmount = monthlyAmount;
    
    if (renewsAt && renewsAt > now) {
      const daysInMonth = 30;
      const daysRemaining = Math.ceil((renewsAt - now) / (1000 * 60 * 60 * 24));
      proratedAmount = (monthlyAmount / daysInMonth) * daysRemaining;
    }
    
    return {
      userCount,
      pricePerUser: PRICING.PRICE_PER_USER,
      monthlyAmount,
      annualAmount,
      proratedAmount: Math.round(proratedAmount * 100) / 100,
      currency: PRICING.CURRENCY,
      nextBillingDate: renewsAt
    };
  } catch (error) {
    console.error('Calculate billing error:', error);
    throw error;
  }
};

// ============================================
// GET SUBSCRIPTION INFO
// ============================================
const getSubscriptionInfo = async (req, res) => {
  try {
    const { firmId } = req.user;
    
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        _count: {
          select: { users: true }
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });
    
    const billing = await calculateBilling(firmId);
    
    // Check trial status
    const trialEndsAt = firm.trialEndsAt ? new Date(firm.trialEndsAt) : null;
    const isInTrial = trialEndsAt && trialEndsAt > new Date();
    const trialDaysRemaining = isInTrial 
      ? Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))
      : 0;
    
    res.json({
      success: true,
      data: {
        pricing: {
          model: 'Per User',
          pricePerUser: PRICING.PRICE_PER_USER,
          currency: PRICING.CURRENCY,
          billingInterval: PRICING.BILLING_INTERVAL
        },
        trial: {
          isActive: isInTrial,
          endsAt: trialEndsAt,
          daysRemaining: trialDaysRemaining
        },
        subscription: {
          status: firm.subscriptionStatus || 'TRIAL',
          userCount: billing.userCount,
          monthlyAmount: billing.monthlyAmount,
          annualAmount: billing.annualAmount,
          nextBillingDate: billing.nextBillingDate,
          nextBillingAmount: billing.monthlyAmount
        },
        features: PRICING.FEATURES,
        users: firm.users,
        paymentMethod: {
          hasPaymentMethod: !!firm.stripeCustomerId,
          lastFour: firm.stripePaymentMethodLast4 || null
        }
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription info'
    });
  }
};

// ============================================
// START FREE TRIAL
// ============================================
const startFreeTrial = async (firmId) => {
  try {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + PRICING.TRIAL_DAYS);
    
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        trialStartedAt: new Date()
      }
    });
    
    return {
      success: true,
      trialEndsAt,
      trialDays: PRICING.TRIAL_DAYS
    };
  } catch (error) {
    console.error('Start trial error:', error);
    throw error;
  }
};

// ============================================
// UPDATE USER COUNT (WEBHOOK HANDLER)
// ============================================
const updateUserCount = async (firmId) => {
  try {
    const billing = await calculateBilling(firmId);
    
    // If has Stripe subscription, update it
    const firm = await prisma.firm.findUnique({
      where: { id: firmId }
    });
    
    if (firm.stripeSubscriptionId) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Update subscription quantity
      await stripe.subscriptions.update(firm.stripeSubscriptionId, {
        items: [{
          id: firm.stripeSubscriptionItemId,
          quantity: billing.userCount
        }],
        proration_behavior: 'always_invoice'
      });
    }
    
    return billing;
  } catch (error) {
    console.error('Update user count error:', error);
    throw error;
  }
};

// ============================================
// USAGE TRACKING
// ============================================
const trackUsage = async (firmId, type, metadata = {}) => {
  try {
    await prisma.usageLog.create({
      data: {
        firmId,
        type,
        metadata,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
};

// ============================================
// GET PRICING INFO (PUBLIC)
// ============================================
const getPricingInfo = (req, res) => {
  res.json({
    success: true,
    data: {
      model: 'Simple Per-User Pricing',
      pricePerUser: PRICING.PRICE_PER_USER,
      currency: PRICING.CURRENCY,
      billingInterval: PRICING.BILLING_INTERVAL,
      trialDays: PRICING.TRIAL_DAYS,
      features: PRICING.FEATURES,
      examples: [
        {
          users: 1,
          monthly: PRICING.PRICE_PER_USER,
          annual: PRICING.PRICE_PER_USER * 12,
          savings: 0
        },
        {
          users: 5,
          monthly: PRICING.PRICE_PER_USER * 5,
          annual: PRICING.PRICE_PER_USER * 5 * 12,
          savings: 0
        },
        {
          users: 10,
          monthly: PRICING.PRICE_PER_USER * 10,
          annual: PRICING.PRICE_PER_USER * 10 * 12,
          savings: 0
        },
        {
          users: 20,
          monthly: PRICING.PRICE_PER_USER * 20,
          annual: PRICING.PRICE_PER_USER * 20 * 12,
          savings: 0
        }
      ],
      comparison: {
        clio: {
          pricePerUser: 349,
          savings: ((349 - PRICING.PRICE_PER_USER) / 349 * 100).toFixed(0) + '%',
          savingsAmount: 349 - PRICING.PRICE_PER_USER
        },
        myCase: {
          pricePerUser: 299,
          savings: ((299 - PRICING.PRICE_PER_USER) / 299 * 100).toFixed(0) + '%',
          savingsAmount: 299 - PRICING.PRICE_PER_USER
        }
      }
    }
  });
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  PRICING,
  checkSubscription,
  checkUserLimit,
  calculateBilling,
  getSubscriptionInfo,
  startFreeTrial,
  updateUserCount,
  trackUsage,
  getPricingInfo,
};

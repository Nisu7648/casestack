// Subscription & Billing Middleware
// Enforce plan limits and monetization

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// SUBSCRIPTION PLANS
// ============================================
const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      users: 1,
      cases: 50,
      storage: 1024 * 1024 * 100, // 100MB
      aiCredits: 10,
      features: {
        basicCases: true,
        basicTasks: true,
        basicDocuments: true,
        aiAssistant: false,
        workflows: false,
        videoMeetings: false,
        whiteLabel: false,
        apiAccess: false,
        prioritySupport: false,
      }
    }
  },
  
  STARTER: {
    name: 'Starter',
    price: 49,
    limits: {
      users: 5,
      cases: 500,
      storage: 1024 * 1024 * 1024 * 5, // 5GB
      aiCredits: 100,
      features: {
        basicCases: true,
        basicTasks: true,
        basicDocuments: true,
        aiAssistant: true,
        workflows: true,
        videoMeetings: false,
        whiteLabel: false,
        apiAccess: false,
        prioritySupport: false,
      }
    }
  },
  
  PROFESSIONAL: {
    name: 'Professional',
    price: 99,
    limits: {
      users: 20,
      cases: -1, // Unlimited
      storage: 1024 * 1024 * 1024 * 50, // 50GB
      aiCredits: 1000,
      features: {
        basicCases: true,
        basicTasks: true,
        basicDocuments: true,
        aiAssistant: true,
        workflows: true,
        videoMeetings: true,
        whiteLabel: true,
        apiAccess: true,
        prioritySupport: true,
      }
    }
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    limits: {
      users: -1, // Unlimited
      cases: -1, // Unlimited
      storage: -1, // Unlimited
      aiCredits: -1, // Unlimited
      features: {
        basicCases: true,
        basicTasks: true,
        basicDocuments: true,
        aiAssistant: true,
        workflows: true,
        videoMeetings: true,
        whiteLabel: true,
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: true,
        dedicatedSupport: true,
        sla: true,
      }
    }
  }
};

// ============================================
// CHECK SUBSCRIPTION STATUS
// ============================================
const checkSubscription = async (req, res, next) => {
  try {
    const { firmId } = req.user;
    
    // Get firm with subscription info
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
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
    
    // Get subscription plan (default to FREE if not set)
    const planName = firm.subscriptionPlan || 'FREE';
    const plan = PLANS[planName];
    
    // Check if subscription is active
    if (firm.subscriptionStatus !== 'ACTIVE' && planName !== 'FREE') {
      return res.status(402).json({
        success: false,
        error: 'Subscription expired. Please update your payment method.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    
    // Attach plan info to request
    req.subscription = {
      plan: planName,
      limits: plan.limits,
      usage: {
        users: firm._count.users,
        cases: firm._count.cases,
        aiCredits: firm.aiCredits || 0,
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
// CHECK FEATURE ACCESS
// ============================================
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const { plan, limits } = req.subscription;
      
      if (!limits.features[featureName]) {
        return res.status(403).json({
          success: false,
          error: `This feature requires ${getMinimumPlan(featureName)} plan or higher`,
          code: 'FEATURE_NOT_AVAILABLE',
          upgrade: {
            feature: featureName,
            minimumPlan: getMinimumPlan(featureName),
            currentPlan: plan
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Feature check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify feature access'
      });
    }
  };
};

// ============================================
// CHECK USAGE LIMITS
// ============================================
const checkLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const { limits, usage } = req.subscription;
      const limit = limits[limitType];
      const current = usage[limitType];
      
      // -1 means unlimited
      if (limit === -1) {
        return next();
      }
      
      if (current >= limit) {
        return res.status(403).json({
          success: false,
          error: `${limitType} limit reached. Upgrade your plan for more.`,
          code: 'LIMIT_REACHED',
          upgrade: {
            limitType,
            current,
            limit,
            nextPlan: getNextPlan(req.subscription.plan)
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Limit check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify usage limits'
      });
    }
  };
};

// ============================================
// CONSUME AI CREDITS
// ============================================
const consumeAICredits = (credits = 1) => {
  return async (req, res, next) => {
    try {
      const { firmId } = req.user;
      const { limits, usage } = req.subscription;
      
      // Unlimited credits
      if (limits.aiCredits === -1) {
        return next();
      }
      
      // Check if enough credits
      if (usage.aiCredits < credits) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient AI credits. Upgrade your plan or purchase more credits.',
          code: 'INSUFFICIENT_CREDITS',
          upgrade: {
            required: credits,
            available: usage.aiCredits,
            nextPlan: getNextPlan(req.subscription.plan)
          }
        });
      }
      
      // Deduct credits
      await prisma.firm.update({
        where: { id: firmId },
        data: {
          aiCredits: {
            decrement: credits
          }
        }
      });
      
      next();
    } catch (error) {
      console.error('AI credits error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process AI credits'
      });
    }
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMinimumPlan(featureName) {
  for (const [planName, plan] of Object.entries(PLANS)) {
    if (plan.limits.features[featureName]) {
      return planName;
    }
  }
  return 'ENTERPRISE';
}

function getNextPlan(currentPlan) {
  const planOrder = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return planOrder[currentIndex + 1] || 'ENTERPRISE';
}

// ============================================
// USAGE TRACKING
// ============================================
const trackUsage = async (firmId, type, amount = 1) => {
  try {
    await prisma.usageLog.create({
      data: {
        firmId,
        type,
        amount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
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
          select: {
            users: true,
            cases: true,
          }
        }
      }
    });
    
    const planName = firm.subscriptionPlan || 'FREE';
    const plan = PLANS[planName];
    
    res.json({
      success: true,
      data: {
        currentPlan: planName,
        status: firm.subscriptionStatus || 'ACTIVE',
        limits: plan.limits,
        usage: {
          users: firm._count.users,
          cases: firm._count.cases,
          aiCredits: firm.aiCredits || 0,
        },
        billing: {
          amount: plan.price,
          currency: 'USD',
          interval: 'month',
          nextBillingDate: firm.subscriptionRenewsAt,
        },
        availablePlans: Object.entries(PLANS).map(([name, p]) => ({
          name,
          price: p.price,
          limits: p.limits,
          isCurrent: name === planName
        }))
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
// EXPORTS
// ============================================
module.exports = {
  PLANS,
  checkSubscription,
  requireFeature,
  checkLimit,
  consumeAICredits,
  trackUsage,
  getSubscriptionInfo,
};

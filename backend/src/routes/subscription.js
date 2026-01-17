const express = require('express');
const router = express.Router();
const SubscriptionService = require('../services/subscriptionService');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// SUBSCRIPTION ROUTES
// Country-based pricing & plan management
// ============================================

// Get pricing for country
router.get('/pricing/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const pricing = SubscriptionService.getPricingForCountry(countryCode);
    
    res.json({
      success: true,
      countryCode: countryCode.toUpperCase(),
      pricing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate subscription cost
router.post('/calculate', (req, res) => {
  try {
    const { countryCode, planId, userCount } = req.body;
    
    if (!countryCode || !planId || !userCount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: countryCode, planId, userCount'
      });
    }

    const cost = SubscriptionService.calculateCost(countryCode, planId, userCount);
    
    res.json({
      success: true,
      calculation: cost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all plans
router.get('/plans', (req, res) => {
  try {
    const plans = SubscriptionService.getAllPlans();
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific plan
router.get('/plans/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const plan = SubscriptionService.getPlan(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      plan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get supported countries
router.get('/countries', (req, res) => {
  try {
    const countries = SubscriptionService.getSupportedCountries();
    
    res.json({
      success: true,
      countries
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Create subscription (Protected)
router.post('/create', authenticateToken, (req, res) => {
  try {
    const { countryCode, planId, userCount, billingCycle, paymentMethod } = req.body;
    const firmId = req.user.firmId;
    
    if (!firmId) {
      return res.status(400).json({
        success: false,
        error: 'User must be associated with a firm'
      });
    }

    if (!countryCode || !planId || !userCount || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: countryCode, planId, userCount, billingCycle'
      });
    }

    // Check if firm already has active subscription
    const existingSub = SubscriptionService.getActiveSubscription(firmId);
    if (existingSub) {
      return res.status(400).json({
        success: false,
        error: 'Firm already has an active subscription'
      });
    }

    const subscription = SubscriptionService.createSubscription(firmId, {
      countryCode,
      planId,
      userCount,
      billingCycle,
      paymentMethod: paymentMethod || 'card'
    });
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get firm's active subscription (Protected)
router.get('/active', authenticateToken, (req, res) => {
  try {
    const firmId = req.user.firmId;
    
    if (!firmId) {
      return res.status(400).json({
        success: false,
        error: 'User must be associated with a firm'
      });
    }

    const subscription = SubscriptionService.getActiveSubscription(firmId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get subscription by ID (Protected)
router.get('/:subscriptionId', authenticateToken, (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = SubscriptionService.getSubscription(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check if user has access to this subscription
    if (subscription.firmId !== req.user.firmId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update subscription (Protected)
router.put('/:subscriptionId', authenticateToken, (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = SubscriptionService.getSubscription(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check if user has access
    if (subscription.firmId !== req.user.firmId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updates = req.body;
    const updatedSubscription = SubscriptionService.updateSubscription(subscriptionId, updates);
    
    res.json({
      success: true,
      subscription: updatedSubscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel subscription (Protected)
router.post('/:subscriptionId/cancel', authenticateToken, (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { immediate } = req.body;
    
    const subscription = SubscriptionService.getSubscription(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check if user has access
    if (subscription.firmId !== req.user.firmId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const cancelledSubscription = SubscriptionService.cancelSubscription(
      subscriptionId,
      immediate || false
    );
    
    res.json({
      success: true,
      subscription: cancelledSubscription,
      message: immediate 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at the end of current period'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Reactivate subscription (Protected)
router.post('/:subscriptionId/reactivate', authenticateToken, (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = SubscriptionService.getSubscription(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check if user has access
    if (subscription.firmId !== req.user.firmId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const reactivatedSubscription = SubscriptionService.reactivateSubscription(subscriptionId);
    
    res.json({
      success: true,
      subscription: reactivatedSubscription,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Check if can add users (Protected)
router.post('/check/users', authenticateToken, (req, res) => {
  try {
    const firmId = req.user.firmId;
    const { additionalUsers } = req.body;
    
    if (!firmId) {
      return res.status(400).json({
        success: false,
        error: 'User must be associated with a firm'
      });
    }

    if (!additionalUsers || additionalUsers < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid additionalUsers value'
      });
    }

    const result = SubscriptionService.canAddUsers(firmId, additionalUsers);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Check if can add cases (Protected)
router.post('/check/cases', authenticateToken, (req, res) => {
  try {
    const firmId = req.user.firmId;
    const { additionalCases, currentCases } = req.body;
    
    if (!firmId) {
      return res.status(400).json({
        success: false,
        error: 'User must be associated with a firm'
      });
    }

    if (!additionalCases || additionalCases < 1 || currentCases === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid additionalCases or currentCases value'
      });
    }

    const result = SubscriptionService.canAddCases(firmId, additionalCases, currentCases);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

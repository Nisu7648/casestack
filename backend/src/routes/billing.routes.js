// Billing Routes
// Subscription and payment endpoints with geo-based pricing

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { getSubscriptionInfo, getPricingInfo } = require('../middleware/subscription.middleware');
const { getPricingForCountry, detectCountryFromIP } = require('../config/geo-pricing');

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/billing/pricing - Get pricing information (public)
router.get('/pricing', getPricingInfo);

// GET /api/billing/pricing/geo - Get geo-based pricing
router.get('/pricing/geo', async (req, res) => {
  try {
    // Get IP from request
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
                req.headers['x-real-ip'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress;
    
    // Detect country from IP
    const countryCode = await detectCountryFromIP(ip);
    
    // Get pricing for country
    const pricing = getPricingForCountry(countryCode);
    
    res.json({
      success: true,
      data: pricing,
      country: countryCode
    });
  } catch (error) {
    console.error('Geo pricing error:', error);
    res.json({
      success: true,
      data: { price: 78, currency: 'USD', name: 'Default' },
      country: 'US'
    });
  }
});

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================

// GET /api/billing/subscription - Get subscription info
router.get('/subscription', getSubscriptionInfo);

// POST /api/billing/subscription - Create subscription
router.post('/subscription', billingController.createSubscription);

// PUT /api/billing/payment-method - Update payment method
router.put('/payment-method', billingController.updatePaymentMethod);

// DELETE /api/billing/subscription - Cancel subscription
router.delete('/subscription', billingController.cancelSubscription);

// POST /api/billing/subscription/reactivate - Reactivate subscription
router.post('/subscription/reactivate', billingController.reactivateSubscription);

// GET /api/billing/history - Get billing history
router.get('/history', billingController.getBillingHistory);

// ============================================
// WEBHOOK ROUTE (Stripe)
// ============================================

// POST /api/billing/webhook - Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

module.exports = router;

// Billing Routes
// Subscription and payment endpoints

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { getSubscriptionInfo, getPricingInfo } = require('../middleware/subscription.middleware');

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/billing/pricing - Get pricing information (public)
router.get('/pricing', getPricingInfo);

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

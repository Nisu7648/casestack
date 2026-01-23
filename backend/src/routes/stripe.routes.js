const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const stripeService = require('../config/stripe');

const prisma = new PrismaClient();

/**
 * Get pricing plans
 */
router.get('/pricing', async (req, res) => {
  try {
    const { country = 'US' } = req.query;

    const plans = Object.values(stripeService.PRICING_PLANS).map(plan => {
      const pricing = stripeService.calculatePrice(plan.id, country);
      return {
        ...plan,
        pricing
      };
    });

    res.json({
      success: true,
      data: {
        plans,
        country,
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing'
    });
  }
});

/**
 * Create checkout session
 */
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { planId, country } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = req.user.firm.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(
        req.user.email,
        req.user.firm.name,
        {
          firmId: req.user.firmId,
          userId: req.user.id
        }
      );

      stripeCustomerId = customer.id;

      // Save customer ID to database
      await prisma.firm.update({
        where: { id: req.user.firmId },
        data: { stripeCustomerId }
      });
    }

    // Calculate price based on country
    const pricing = stripeService.calculatePrice(planId, country || 'US');

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      stripeCustomerId,
      pricing.stripePriceId, // You'll need to create these in Stripe dashboard
      `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.FRONTEND_URL}/billing/cancel`,
      {
        firmId: req.user.firmId,
        planId,
        country: country || 'US'
      }
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

/**
 * Create billing portal session
 */
router.post('/create-portal-session', authenticate, async (req, res) => {
  try {
    const stripeCustomerId = req.user.firm.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const session = await stripeService.createBillingPortalSession(
      stripeCustomerId,
      `${process.env.FRONTEND_URL}/billing`
    );

    res.json({
      success: true,
      data: {
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session'
    });
  }
});

/**
 * Get subscription status
 */
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.user.firmId },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true
      }
    });

    if (!firm.stripeSubscriptionId) {
      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          status: 'none'
        }
      });
    }

    // Get subscription from Stripe
    const subscription = await stripeService.getSubscription(firm.stripeSubscriptionId);

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        status: subscription.status,
        plan: firm.subscriptionPlan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription'
    });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel-subscription', authenticate, async (req, res) => {
  try {
    const firm = await prisma.firm.findUnique({
      where: { id: req.user.firmId }
    });

    if (!firm.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel subscription at period end
    const subscription = await stripeService.cancelSubscription(firm.stripeSubscriptionId);

    // Update database
    await prisma.firm.update({
      where: { id: req.user.firmId },
      data: {
        subscriptionStatus: 'canceling',
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
      }
    });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      data: {
        endsAt: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

/**
 * Get billing history
 */
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const stripeCustomerId = req.user.firm.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          invoices: []
        }
      });
    }

    const invoices = await stripeService.listInvoices(stripeCustomerId, 20);

    res.json({
      success: true,
      data: {
        invoices: invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          paidAt: invoice.status_transitions.paid_at 
            ? new Date(invoice.status_transitions.paid_at * 1000) 
            : null,
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url
        }))
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices'
    });
  }
});

/**
 * Webhook handler for Stripe events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Handle checkout completed
 */
async function handleCheckoutCompleted(session) {
  const firmId = session.metadata.firmId;
  const planId = session.metadata.planId;

  await prisma.firm.update({
    where: { id: firmId },
    data: {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: 'active',
      subscriptionPlan: planId,
      billingEnabled: true
    }
  });

  console.log(`Checkout completed for firm ${firmId}`);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const firmId = subscription.metadata.firmId;

  await prisma.firm.update({
    where: { id: firmId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    }
  });

  console.log(`Subscription created for firm ${firmId}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const firmId = subscription.metadata.firmId;

  await prisma.firm.update({
    where: { id: firmId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    }
  });

  console.log(`Subscription updated for firm ${firmId}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  const firmId = subscription.metadata.firmId;

  await prisma.firm.update({
    where: { id: firmId },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: new Date()
    }
  });

  console.log(`Subscription deleted for firm ${firmId}`);
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice) {
  console.log(`Invoice paid: ${invoice.id}`);
  // You can add logic here to send receipt emails, etc.
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);
  // You can add logic here to notify the customer, etc.
}

module.exports = router;

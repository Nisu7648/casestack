// Billing Controller
// Handle subscription and payment operations

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PRICING, calculateBilling, updateUserCount } = require('../middleware/subscription.middleware');

// ============================================
// CREATE SUBSCRIPTION
// ============================================
exports.createSubscription = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const { firmId, userId } = req.user;
    
    // Get firm and user count
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        _count: { select: { users: true } }
      }
    });
    
    const userCount = firm._count.users;
    const monthlyAmount = userCount * PRICING.PRICE_PER_USER;
    
    // Create or get Stripe customer
    let customerId = firm.stripeCustomerId;
    
    if (!customerId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: firm.name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          firmId,
          userId
        }
      });
      
      customerId = customer.id;
    } else {
      // Attach payment method to existing customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }
    
    // Create price if not exists
    let priceId = process.env.STRIPE_PRICE_ID;
    
    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: PRICING.PRICE_PER_USER * 100, // Convert to cents
        currency: PRICING.CURRENCY.toLowerCase(),
        recurring: {
          interval: PRICING.BILLING_INTERVAL,
        },
        product_data: {
          name: 'CaseStack Pro',
          description: 'All-inclusive case management platform - $78 per user per month'
        },
      });
      
      priceId = price.id;
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
        quantity: userCount,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        firmId,
        userCount
      }
    });
    
    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Update firm
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionItemId: subscription.items.data[0].id,
        stripePriceId: priceId,
        stripePaymentMethodLast4: paymentMethod.card?.last4,
        subscriptionStatus: 'ACTIVE',
        subscriptionRenewsAt: new Date(subscription.current_period_end * 1000),
        trialEndsAt: null // End trial when subscription starts
      }
    });
    
    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status,
        userCount,
        monthlyAmount,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });
    
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// UPDATE PAYMENT METHOD
// ============================================
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const { firmId } = req.user;
    
    const firm = await prisma.firm.findUnique({
      where: { id: firmId }
    });
    
    if (!firm.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No customer found'
      });
    }
    
    // Attach new payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: firm.stripeCustomerId,
    });
    
    // Set as default
    await stripe.customers.update(firm.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Update firm
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        stripePaymentMethodLast4: paymentMethod.card?.last4
      }
    });
    
    res.json({
      success: true,
      message: 'Payment method updated successfully'
    });
    
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// CANCEL SUBSCRIPTION
// ============================================
exports.cancelSubscription = async (req, res) => {
  try {
    const { firmId } = req.user;
    const { immediate } = req.body; // Cancel immediately or at period end
    
    const firm = await prisma.firm.findUnique({
      where: { id: firmId }
    });
    
    if (!firm.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found'
      });
    }
    
    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.cancel(firm.stripeSubscriptionId);
      
      await prisma.firm.update({
        where: { id: firmId },
        data: {
          subscriptionStatus: 'CANCELLED',
          subscriptionRenewsAt: null
        }
      });
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(firm.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      
      await prisma.firm.update({
        where: { id: firmId },
        data: {
          subscriptionStatus: 'CANCELLING'
        }
      });
    }
    
    res.json({
      success: true,
      message: immediate 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will cancel at period end'
    });
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// REACTIVATE SUBSCRIPTION
// ============================================
exports.reactivateSubscription = async (req, res) => {
  try {
    const { firmId } = req.user;
    
    const firm = await prisma.firm.findUnique({
      where: { id: firmId }
    });
    
    if (!firm.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'No subscription found'
      });
    }
    
    // Remove cancellation
    await stripe.subscriptions.update(firm.stripeSubscriptionId, {
      cancel_at_period_end: false
    });
    
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        subscriptionStatus: 'ACTIVE'
      }
    });
    
    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
    
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// GET BILLING HISTORY
// ============================================
exports.getBillingHistory = async (req, res) => {
  try {
    const { firmId } = req.user;
    
    const firm = await prisma.firm.findUnique({
      where: { id: firmId }
    });
    
    if (!firm.stripeCustomerId) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: firm.stripeCustomerId,
      limit: 12 // Last 12 invoices
    });
    
    const history = invoices.data.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000),
      amount: invoice.total / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
      userCount: invoice.metadata?.userCount || 0
    }));
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// WEBHOOK HANDLER
// ============================================
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleSubscriptionUpdated(subscription) {
  const firmId = subscription.metadata.firmId;
  
  await prisma.firm.update({
    where: { id: firmId },
    data: {
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      subscriptionRenewsAt: new Date(subscription.current_period_end * 1000)
    }
  });
}

async function handleSubscriptionDeleted(subscription) {
  const firmId = subscription.metadata.firmId;
  
  await prisma.firm.update({
    where: { id: firmId },
    data: {
      subscriptionStatus: 'CANCELLED',
      subscriptionRenewsAt: null
    }
  });
}

async function handlePaymentSucceeded(invoice) {
  const firmId = invoice.metadata?.firmId;
  
  if (firmId) {
    // Log successful payment
    await prisma.paymentLog.create({
      data: {
        firmId,
        amount: invoice.total / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'SUCCESS',
        stripeInvoiceId: invoice.id,
        metadata: {
          userCount: invoice.metadata?.userCount
        }
      }
    });
  }
}

async function handlePaymentFailed(invoice) {
  const firmId = invoice.metadata?.firmId;
  
  if (firmId) {
    // Log failed payment
    await prisma.paymentLog.create({
      data: {
        firmId,
        amount: invoice.total / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'FAILED',
        stripeInvoiceId: invoice.id,
        metadata: {
          error: invoice.last_finalization_error?.message
        }
      }
    });
    
    // Update firm status
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        subscriptionStatus: 'PAST_DUE'
      }
    });
  }
}

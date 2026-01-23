const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Pricing plans configuration
const PRICING_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    basePrice: 29, // USD
    users: 5,
    features: [
      'Up to 5 users',
      'Unlimited cases',
      'Document management',
      'Time tracking',
      'Basic billing',
      'Email support'
    ]
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    basePrice: 79, // USD
    users: 20,
    features: [
      'Up to 20 users',
      'Everything in Starter',
      'Advanced reporting',
      'Client portal',
      'Custom templates',
      'Priority support',
      'API access'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: 199, // USD
    users: -1, // Unlimited
    features: [
      'Unlimited users',
      'Everything in Professional',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom training',
      'White-label option'
    ]
  }
};

// Country-based pricing multipliers (from your pricing system)
const COUNTRY_MULTIPLIERS = {
  // Tier 1: High-income countries (1.0x)
  US: 1.0, CA: 1.0, GB: 1.0, AU: 1.0, DE: 1.0, FR: 1.0, JP: 1.0,
  
  // Tier 2: Upper-middle income (0.7x)
  BR: 0.7, MX: 0.7, CN: 0.7, RU: 0.7, TR: 0.7, ZA: 0.7,
  
  // Tier 3: Lower-middle income (0.5x)
  IN: 0.5, PK: 0.5, BD: 0.5, NG: 0.5, PH: 0.5, EG: 0.5,
  
  // Tier 4: Low income (0.3x)
  KE: 0.3, GH: 0.3, UG: 0.3, TZ: 0.3, ET: 0.3
};

/**
 * Calculate price based on plan and country
 */
function calculatePrice(planId, countryCode) {
  const plan = PRICING_PLANS[planId.toUpperCase()];
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  const multiplier = COUNTRY_MULTIPLIERS[countryCode] || 1.0;
  const price = Math.round(plan.basePrice * multiplier);

  return {
    planId: plan.id,
    planName: plan.name,
    basePrice: plan.basePrice,
    countryCode,
    multiplier,
    finalPrice: price,
    currency: 'USD',
    features: plan.features
  };
}

/**
 * Create Stripe customer
 */
async function createCustomer(email, name, metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata
  });

  return customer;
}

/**
 * Create subscription
 */
async function createSubscription(customerId, priceId, metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata
  });

  return subscription;
}

/**
 * Create checkout session
 */
async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl, metadata = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata
  });

  return session;
}

/**
 * Create billing portal session
 */
async function createBillingPortalSession(customerId, returnUrl) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Update subscription
 */
async function updateSubscription(subscriptionId, priceId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
    proration_behavior: 'create_prorations',
  });

  return updatedSubscription;
}

/**
 * Get subscription details
 */
async function getSubscription(subscriptionId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Get customer details
 */
async function getCustomer(customerId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.retrieve(customerId);
  return customer;
}

/**
 * List invoices for customer
 */
async function listInvoices(customerId, limit = 10) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit
  });

  return invoices;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

module.exports = {
  stripe,
  PRICING_PLANS,
  COUNTRY_MULTIPLIERS,
  calculatePrice,
  createCustomer,
  createSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  updateSubscription,
  getSubscription,
  getCustomer,
  listInvoices,
  verifyWebhookSignature
};

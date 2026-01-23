# 💳 Stripe Integration Setup Guide

## **Complete Stripe Payment System for LegalStack**

---

## **OVERVIEW**

LegalStack uses Stripe for:
- Subscription billing ($29, $79, $199/month)
- Country-based fair pricing
- Automatic recurring payments
- Customer billing portal
- Invoice management
- Webhook event handling

---

## **STEP 1: CREATE STRIPE ACCOUNT**

### **1.1 Sign Up**
1. Go to [stripe.com](https://stripe.com)
2. Click "Start now" or "Sign up"
3. Enter your email and create password
4. Verify your email

### **1.2 Activate Account**
1. Complete business information
2. Add bank account details
3. Verify identity (for live mode)

**Note:** You can start with Test Mode immediately!

---

## **STEP 2: GET API KEYS**

### **2.1 Test Mode Keys** (Start here)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### **2.2 Live Mode Keys** (Later, when ready to launch)
1. Toggle to **Live Mode**
2. Go to **Developers** → **API keys**
3. Copy:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

---

## **STEP 3: CREATE PRODUCTS & PRICES**

### **3.1 Create Products**

#### **Starter Plan:**
1. Go to **Products** → **Add product**
2. Fill in:
   - **Name:** LegalStack Starter
   - **Description:** Perfect for small law firms (up to 5 users)
   - **Pricing model:** Recurring
   - **Price:** $29.00 USD
   - **Billing period:** Monthly
3. Click **Save product**
4. **Copy the Price ID** (starts with `price_`)

#### **Professional Plan:**
1. Click **Add product** again
2. Fill in:
   - **Name:** LegalStack Professional
   - **Description:** For growing law firms (up to 20 users)
   - **Pricing model:** Recurring
   - **Price:** $79.00 USD
   - **Billing period:** Monthly
3. Click **Save product**
4. **Copy the Price ID**

#### **Enterprise Plan:**
1. Click **Add product** again
2. Fill in:
   - **Name:** LegalStack Enterprise
   - **Description:** For large law firms (unlimited users)
   - **Pricing model:** Recurring
   - **Price:** $199.00 USD
   - **Billing period:** Monthly
3. Click **Save product**
4. **Copy the Price ID**

### **3.2 Update Backend Configuration**

Update `backend/src/config/stripe.js`:

```javascript
const PRICING_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    basePrice: 29,
    stripePriceId: 'price_XXXXXXXXXX', // Replace with your Price ID
    users: 5,
    features: [...]
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    basePrice: 79,
    stripePriceId: 'price_XXXXXXXXXX', // Replace with your Price ID
    users: 20,
    features: [...]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: 199,
    stripePriceId: 'price_XXXXXXXXXX', // Replace with your Price ID
    users: -1,
    features: [...]
  }
};
```

---

## **STEP 4: CONFIGURE WEBHOOKS**

### **4.1 Create Webhook Endpoint**

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL:** `https://legalstack-backend.onrender.com/api/stripe/webhook`
   - **Description:** LegalStack subscription events
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**

### **4.2 Get Webhook Secret**

1. Click on your newly created webhook
2. Click **Reveal** under "Signing secret"
3. **Copy the webhook secret** (starts with `whsec_`)

---

## **STEP 5: SET ENVIRONMENT VARIABLES**

### **5.1 Backend Environment Variables**

Add to your Render backend service:

```env
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Frontend URL (for redirects)
FRONTEND_URL=https://legalstack-frontend.onrender.com
```

### **5.2 Frontend Environment Variables**

Add to your Render frontend service:

```env
# Stripe Publishable Key (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## **STEP 6: TEST THE INTEGRATION**

### **6.1 Test Card Numbers**

Stripe provides test cards for different scenarios:

**Success:**
- `4242 4242 4242 4242` - Visa (succeeds)
- `5555 5555 5555 4444` - Mastercard (succeeds)

**Failure:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**3D Secure:**
- `4000 0025 0000 3155` - Requires authentication

**Use any:**
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## **PRICING STRUCTURE**

### **Base Prices (USD):**
- **Starter:** $29/month (up to 5 users)
- **Professional:** $79/month (up to 20 users)
- **Enterprise:** $199/month (unlimited users)

### **Country-Based Multipliers:**

**Tier 1 (1.0x):** US, CA, GB, AU, DE, FR, JP  
**Tier 2 (0.7x):** BR, MX, CN, RU, TR, ZA  
**Tier 3 (0.5x):** IN, PK, BD, NG, PH, EG  
**Tier 4 (0.3x):** KE, GH, UG, TZ, ET  

**Example:**
- US Starter: $29/month
- India Starter: $14.50/month (50% of base)
- Kenya Starter: $8.70/month (30% of base)

---

## **API ENDPOINTS**

### **Get Pricing:**
```
GET /api/stripe/pricing?country=US
```

### **Create Checkout Session:**
```
POST /api/stripe/create-checkout-session
{
  "planId": "starter",
  "country": "US"
}
```

### **Create Billing Portal Session:**
```
POST /api/stripe/create-portal-session
```

### **Get Subscription Status:**
```
GET /api/stripe/subscription
```

### **Cancel Subscription:**
```
POST /api/stripe/cancel-subscription
```

### **Get Billing History:**
```
GET /api/stripe/invoices
```

### **Webhook Handler:**
```
POST /api/stripe/webhook
```

---

## **WEBHOOK EVENTS HANDLED**

- `checkout.session.completed` - Subscription created
- `customer.subscription.created` - Subscription activated
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Payment successful
- `invoice.payment_failed` - Payment failed

---

## **SECURITY BEST PRACTICES**

### **1. Never Expose Secret Keys**
- Never commit secret keys to Git
- Use environment variables
- Rotate keys regularly

### **2. Verify Webhook Signatures**
- Always verify webhook signatures
- Use Stripe's webhook secret
- Reject invalid signatures

### **3. Use HTTPS**
- Always use HTTPS in production
- Stripe requires HTTPS for webhooks

### **4. Handle Errors Gracefully**
- Catch and log all errors
- Return appropriate error messages
- Don't expose sensitive information

---

**Stripe integration complete!** ✅  
**Ready to accept payments!** 💳

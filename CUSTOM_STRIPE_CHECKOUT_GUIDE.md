# Custom Stripe Checkout Guide

## Overview

I've created a custom checkout solution that gives you the same level of branding control as the X Premium example you showed. Here are your options:

## **Option 1: Enhanced Stripe Checkout (Quick)**

✅ **Already implemented** - Your existing checkout now has:
- Custom branding text
- Invoice customization
- Better messaging

**Pros:**
- Easy to implement
- Stripe handles all security
- Mobile-responsive by default
- PCI compliant

**Cons:**
- Limited customization
- Can't fully match your brand

## **Option 2: Custom Payment UI (Full Control)**

✅ **Fully implemented** - New custom checkout with:
- Branded left sidebar like X Premium
- Complete design control
- Custom pricing display
- Your brand colors and messaging

### **Files Created:**

1. **`/components/custom-checkout.tsx`** - Main custom checkout component
2. **`/app/checkout-custom/page.tsx`** - Custom checkout page
3. **`/app/api/stripe/create-payment-intent/route.ts`** - Payment intent API

### **Features:**

🎨 **Full Branding Control:**
- Custom left sidebar with your branding
- Your colors, fonts, and messaging
- Plan details and feature highlights
- Pricing breakdown with VAT

💳 **Secure Payment Processing:**
- Stripe Elements integration
- PCI compliant
- Multiple payment methods
- Real-time validation

📱 **Responsive Design:**
- Works on all devices
- Professional UI/UX
- Loading states and error handling

## **How to Use Custom Checkout**

### **1. Install Required Dependencies**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### **2. Update Your Pricing Page Links**

Change your pricing page buttons to use the custom checkout:

```tsx
// Instead of: /checkout?plan=pro&billing=monthly
// Use: /checkout-custom?plan=pro&billing=monthly
```

### **3. Configure Stripe Webhooks**

Add this event to your webhook configuration:
- `payment_intent.succeeded`

### **4. Set Required Environment Variables**

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## **Customization Options**

### **Brand Colors**
Update the colors in `components/custom-checkout.tsx`:

```tsx
// Current purple theme
className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900"

// Change to your brand colors
className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900"
```

### **Logo and Branding**
Replace the logo section:

```tsx
<div className="flex items-center space-x-3 mb-8">
  <img src="/your-logo.png" alt="Your Logo" className="w-10 h-10" />
  <div>
    <h1 className="text-2xl font-bold">Your Brand</h1>
    <p className="text-blue-200 text-sm">Your Tagline</p>
  </div>
</div>
```

### **Feature Highlights**
Customize the features display:

```tsx
{plan.features.map((feature, index) => (
  <div key={index} className="flex items-center space-x-3">
    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
    <span className="text-blue-100">{feature}</span>
  </div>
))}
```

### **Pricing Display**
Modify the pricing calculation:

```tsx
// Current VAT calculation (23% for Portugal)
const vatRate = 0.23

// Change for your country
const vatRate = 0.20 // 20% for UK
const vatRate = 0.19 // 19% for Germany
```

## **Advanced Customization**

### **Multi-step Checkout**
Add steps like billing info, confirmation, etc.:

```tsx
const [step, setStep] = useState(1)

// Step 1: Plan selection
// Step 2: Billing details
// Step 3: Payment
// Step 4: Confirmation
```

### **Coupon Codes**
Add discount code functionality:

```tsx
const [couponCode, setCouponCode] = useState('')
const [discount, setDiscount] = useState(0)

// Apply coupon logic
const applyCoupon = async () => {
  // Validate coupon with Stripe
  // Update pricing display
}
```

### **Multiple Payment Methods**
Configure different payment options:

```tsx
const paymentElementOptions = {
  layout: 'tabs',
  paymentMethodOrder: ['card', 'paypal', 'apple_pay', 'google_pay']
}
```

## **Testing**

### **Test the Custom Checkout:**

1. **Go to:** `/checkout-custom?plan=pro&billing=monthly`
2. **Use Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. **Check webhook events in Stripe Dashboard**
4. **Verify subscription creation in your database**

### **Test Different Scenarios:**

```bash
# Monthly billing
/checkout-custom?plan=base&billing=monthly

# Yearly billing (with discount)
/checkout-custom?plan=pro&billing=yearly

# Enterprise plan
/checkout-custom?plan=enterprise&billing=monthly
```

## **Production Deployment**

### **1. Switch to Live Keys**
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **2. Configure Live Webhooks**
- Use your production domain
- Same webhook events as test mode

### **3. Update Price IDs**
Replace test price IDs in `lib/subscription-plans.ts` with live ones.

## **Comparison: Standard vs Custom**

| Feature | Standard Checkout | Custom Checkout |
|---------|------------------|------------------|
| Setup Time | 5 minutes | 30 minutes |
| Customization | Limited | Full control |
| Branding | Basic | Complete |
| Mobile | Auto | Manual |
| Security | Stripe handles | Stripe Elements |
| Maintenance | None | Some |

## **Recommendations**

**Use Custom Checkout if you:**
- Want complete brand control
- Need specific UX flows
- Have design requirements
- Want to match competitor experiences (like X Premium)

**Use Standard Checkout if you:**
- Want quick implementation
- Don't need heavy customization
- Prefer Stripe to handle everything
- Have limited development resources

## **Next Steps**

1. **Test the custom checkout** at `/checkout-custom`
2. **Customize the branding** to match your brand
3. **Update your pricing page** links
4. **Configure production webhooks**
5. **Add any additional features** you need

The custom checkout gives you the same professional look as X Premium while maintaining all the security and reliability of Stripe's infrastructure!

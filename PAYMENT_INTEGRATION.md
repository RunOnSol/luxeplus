# Payment Integration Guide for LuxePlus

## Overview

LuxePlus supports three payment methods:
1. **Paystack** - Card and bank transfer payments
2. **Flutterwave** - Secure payment gateway
3. **WhatsApp** - Manual payment coordination

## Current Implementation

The checkout page allows users to select their preferred payment method. The order is created in the database with the selected payment method.

## To Implement Full Payment Processing

### 1. Paystack Integration

```bash
npm install @paystack/inline-js
```

Add to your checkout page:
```typescript
import PaystackPop from '@paystack/inline-js';

const paystackPopup = new PaystackPop();
paystackPopup.newTransaction({
  key: 'YOUR_PAYSTACK_PUBLIC_KEY',
  email: profile.email,
  amount: totalAmount * 100, // in kobo
  onSuccess: (transaction) => {
    // Handle successful payment
    updateOrderPaymentStatus(orderId, 'completed');
  },
  onCancel: () => {
    // Handle cancelled payment
  }
});
```

### 2. Flutterwave Integration

```bash
npm install flutterwave-react-v3
```

Add to your checkout page:
```typescript
import { FlutterWaveButton } from 'flutterwave-react-v3';

const fwConfig = {
  public_key: 'YOUR_FLUTTERWAVE_PUBLIC_KEY',
  tx_ref: Date.now(),
  amount: totalAmount,
  currency: 'NGN',
  customer: {
    email: profile.email,
    phonenumber: profile.phone,
    name: profile.full_name,
  },
  callback: (response) => {
    // Handle successful payment
    updateOrderPaymentStatus(orderId, 'completed');
  },
};

<FlutterWaveButton {...fwConfig} />
```

### 3. WhatsApp Integration

For WhatsApp payments, the order is marked as pending and can be completed through WhatsApp coordination:

```typescript
const whatsappMessage = `Hi, I would like to complete payment for order ${trackingNumber}. Total: ₦${totalAmount}`;
const whatsappUrl = `https://wa.me/YOUR_BUSINESS_NUMBER?text=${encodeURIComponent(whatsappMessage)}`;
window.open(whatsappUrl, '_blank');
```

## Environment Variables

Add these to your `.env` file:
```
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
VITE_WHATSAPP_BUSINESS_NUMBER=your_whatsapp_business_number
```

## Security Notes

- Never expose secret keys in the frontend
- Always verify payments on the server side
- Use webhooks to handle payment confirmations
- Implement proper error handling for failed payments

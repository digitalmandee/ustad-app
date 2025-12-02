# PayFast Payment Integration - Setup Guide

This document describes the PayFast payment integration setup for the ustaad-parent service.

## Environment Variables

Add the following environment variables to your `.env` or `develop.env` file:

```env
# PayFast Configuration
PAYFAST_MERCHANT_ID=102
PAYFAST_SECURED_KEY=your_secured_key_here
PAYFAST_ENV=UAT  # Use "UAT" for testing, "LIVE" for production
PAYFAST_CURRENCY_CODE=PKR
PAYFAST_MERCHANT_NAME=Your Merchant Name

# PayFast URLs (must be publicly accessible via HTTPS)
PAYFAST_SUCCESS_URL=https://your-frontend.com/payfast/success
PAYFAST_FAILURE_URL=https://your-frontend.com/payfast/failure
PAYFAST_CHECKOUT_URL=https://your-backend.com/api/v1/parent/payfast/ipn
```

### PayFast Environments

**UAT (Testing):**
- Get Access Token: `https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken`
- Post Transaction: `https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction`

**LIVE (Production):**
- Get Access Token: `https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken`
- Post Transaction: `https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction`

## API Endpoints

### 1. Initiate Subscription Payment
```
POST /api/v1/parent/payfast/subscription/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "monthly_plan_001",
  "amount": 1000.00,
  "customerEmail": "customer@example.com",
  "customerMobile": "03001234567",
  "offerId": "offer-uuid",
  "childName": "Child Name"
}
```

**Response:**
```json
{
  "success": true,
  "payfastUrl": "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction",
  "formFields": { ... },
  "basketId": "SUB-1735123456789-ABC123"
}
```

### 2. PayFast IPN (Webhook)
```
POST /api/v1/parent/payfast/ipn
Content-Type: application/x-www-form-urlencoded
```
This endpoint is called by PayFast server-to-server. No authentication required.

### 3. Get Subscription Status
```
GET /api/v1/parent/subscriptions/status?basketId=SUB-1735123456789-ABC123
Authorization: Bearer <token>
```

### 4. Manually Charge Recurring Subscription
```
POST /api/v1/parent/subscriptions/charge
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "subscription-uuid"
}
```

## Payment Flow

1. **Parent accepts offer** → `PATCH /api/v1/parent/offer/ACCEPTED/:offerId`
   - Creates subscription with status `CREATED`
   - Returns PayFast form data

2. **Client submits form to PayFast** → User completes payment on PayFast

3. **PayFast sends IPN** → `POST /api/v1/parent/payfast/ipn`
   - Validates payment
   - Activates subscription
   - Stores instrument token for recurring payments
   - Creates TutorSessions

4. **Recurring payments** → Automatically processed via cron job (hourly)
   - Finds subscriptions with `nextBillingDate <= now`
   - Charges using stored instrument token
   - Updates subscription billing dates

## Cron Jobs

The recurring payment cron job runs **hourly** at minute 0:
- Schedule: `0 * * * *`
- Processes all due subscriptions
- Creates invoices and charges payments

### Manual Trigger
```
POST /api/v1/cron/process-due
Authorization: Bearer <admin-token>
```

## Database Changes

The following fields were added to support PayFast:

### ParentSubscription
- `basketId` - PayFast basket ID
- `instrumentToken` - PayFast recurring payment token
- `nextBillingDate` - Next recurring charge date
- `lastPaymentDate` - Last successful payment date
- `lastPaymentAmount` - Last payment amount
- `failureCount` - Consecutive payment failures

### ParentTransaction
- `basketId` - PayFast basket ID
- `orderStatus` - PENDING, SUCCESS, or FAILED

### PaymentMethod
- `instrumentToken` - PayFast recurring token
- `paymentProvider` - STRIPE or PAYFAST

## Testing

For local testing, use ngrok to expose your IPN endpoint:

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Expose backend
ngrok http 301

# Update .env:
PAYFAST_CHECKOUT_URL=https://abc123.ngrok.io/api/v1/parent/payfast/ipn
```

## Notes

1. **IPN Endpoint Requirements:**
   - Must be publicly accessible (use ngrok for local testing)
   - Must use HTTPS
   - Must respond with `200 OK` within 30 seconds

2. **Subscription Suspension:**
   - Subscriptions are automatically suspended after 3 consecutive payment failures
   - Status changes to `EXPIRED`

3. **Idempotency:**
   - IPN handler is idempotent - duplicate IPNs are handled gracefully

4. **Payment Provider:**
   - The system supports both Stripe and PayFast
   - Payment provider is determined by the `paymentProvider` field in PaymentMethod


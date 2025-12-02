# PayFast Payment API - Endpoints Documentation

Complete API documentation for PayFast payment integration endpoints.

---

## Base URL
```
http://localhost:301/api/v1
```

**Note:** Replace `localhost:301` with your actual server URL in production.

---

## Authentication

All endpoints (except IPN webhook) require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Initiate PayFast Subscription Payment

Initiates a subscription payment and returns PayFast form data for client-side submission.

**Endpoint:**
```
POST /api/v1/parent/payfast/subscription/initiate
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "monthly_plan_001",
  "amount": 1000.00,
  "customerEmail": "customer@example.com",
  "customerMobile": "03001234567",
  "offerId": "offer-uuid-here",
  "childName": "Child Name"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `planId` | string | ✅ Yes | Subscription plan identifier |
| `amount` | number | ❌ No | Payment amount in PKR (defaults to 1000.00) |
| `customerEmail` | string | ❌ No | Customer email (defaults to user's email) |
| `customerMobile` | string | ❌ No | Customer mobile number (defaults to user's phone) |
| `offerId` | string | ❌ No | Offer ID if payment is for an accepted offer |
| `childName` | string | ❌ No | Child name for the subscription |

**Success Response (200):**
```json
{
  "success": true,
  "message": "PayFast subscription initiated successfully",
  "data": {
    "success": true,
    "payfastUrl": "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction",
    "formFields": {
      "MERCHANT_ID": "102",
      "MERCHANT_NAME": "Test Merchant",
      "TOKEN": "access_token_from_payfast",
      "BASKET_ID": "SUB-1735123456789-ABC123",
      "TXNAMT": "1000.00",
      "CURRENCY_CODE": "PKR",
      "ORDER_DATE": "2025-01-01 15:30:00",
      "TXNDESC": "Subscription purchase - Plan monthly_plan_001 for Child Name",
      "PROCCODE": "00",
      "TRAN_TYPE": "ECOMM_PURCHASE",
      "SUCCESS_URL": "https://your-frontend.com/payfast/success",
      "FAILURE_URL": "https://your-frontend.com/payfast/failure",
      "CHECKOUT_URL": "https://your-backend.com/api/v1/parent/payfast/ipn",
      "CUSTOMER_EMAIL_ADDRESS": "customer@example.com",
      "CUSTOMER_MOBILE_NO": "03001234567",
      "SIGNATURE": "random_hex_string",
      "VERSION": "MERCHANT-CART-0.1",
      "RECURRING_TXN": "TRUE"
    },
    "basketId": "SUB-1735123456789-ABC123",
    "transactionId": "transaction-uuid"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "planId is required"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Offer not found"
}
```

---

### 2. PayFast IPN Webhook (Instant Payment Notification)

Webhook endpoint called by PayFast server after payment processing. **No authentication required.**

**Endpoint:**
```
POST /api/v1/parent/payfast/ipn
```

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Request Body (from PayFast):**
```
basket_id=SUB-1735123456789-ABC123
&err_code=000
&err_msg=Success
&validation_hash=abc123...
&transaction_id=txn_123456
&transaction_amount=100000
&Instrument_token=token_xyz
&recurring_txn=TRUE
```

**IPN Parameters (PayFast sends):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `basket_id` or `BASKET_ID` | string | Order basket ID |
| `err_code` or `ERR_CODE` | string | Error code ("000" = success) |
| `err_msg` or `ERR_MSG` | string | Error message |
| `validation_hash` or `VALIDATION_HASH` | string | SHA256 hash for verification |
| `transaction_id` or `TRANSACTION_ID` | string | PayFast transaction ID |
| `transaction_amount` or `TRANSACTION_AMOUNT` | string | Transaction amount (in smallest currency unit) |
| `Instrument_token` or `instrument_token` | string | Recurring payment token (if recurring enabled) |
| `recurring_txn` or `RECURRING_TXN` | string | "TRUE" if recurring transaction |

**Response:**
```
HTTP/1.1 200 OK
OK
```

**Note:** This endpoint always returns `200 OK` immediately to prevent PayFast retries. Processing happens asynchronously.

**What this endpoint does:**
1. Validates the `validation_hash` using SHA256 formula
2. Updates transaction status (SUCCESS/FAILED)
3. If recurring enabled and token present:
   - Stores `Instrument_token` as payment method
   - Activates subscription (status → ACTIVE)
   - Sets `nextBillingDate` (+1 month)
4. Creates TutorSessions if payment successful
5. Updates tutor balance

---

### 3. Get Subscription Status

Check subscription/order status by basket ID.

**Endpoint:**
```
GET /api/v1/parent/subscriptions/status?basketId=SUB-1735123456789-ABC123
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `basketId` | string | ✅ Yes | The basket ID from initiate response |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subscription status retrieved successfully",
  "data": {
    "basketId": "SUB-1735123456789-ABC123",
    "orderStatus": "SUCCESS",
    "subscriptionStatus": "ACTIVE",
    "subscriptionId": "subscription-uuid",
    "transactionId": "txn_123456",
    "errorCode": null,
    "errorMessage": null,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "completedAt": "2025-01-01T12:05:00.000Z"
  }
}
```

**Order Status Values:**
- `PENDING`: Payment initiated, awaiting completion
- `SUCCESS`: Payment completed successfully
- `FAILED`: Payment failed or declined

**Subscription Status Values:**
- `ACTIVE`: Subscription is active and will be charged automatically
- `CREATED`: Subscription created but payment not confirmed yet
- `CANCELLED`: Subscription cancelled
- `EXPIRED`: Subscription expired/suspended (after 3 payment failures)
- `null`: No subscription created yet

**Error Response (400):**
```json
{
  "success": false,
  "message": "basketId is required"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Order not found"
}
```

---

### 4. Manually Charge Recurring Subscription

Manually trigger a recurring charge for an active subscription (for testing/admin use).

**Endpoint:**
```
POST /api/v1/parent/subscriptions/charge
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscriptionId": "subscription-uuid-here"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscriptionId` | string | ✅ Yes | Subscription ID to charge |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recurring charge initiated successfully",
  "data": {
    "success": true,
    "message": "Recurring charge initiated",
    "invoiceId": "invoice-uuid",
    "basketId": "RECUR-sub_123-1234567890-ABC",
    "result": {
      "success": true,
      "basketId": "RECUR-sub_123-1234567890-ABC",
      "response": { ... }
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "subscriptionId is required"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Subscription not found"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Subscription is not active. Current status: CANCELLED"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "No instrument token available for this subscription"
}
```

---

## Payment Flow Example

### Step 1: Client Initiates Payment

```javascript
// Client makes request
const response = await fetch('/api/v1/parent/payfast/subscription/initiate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    planId: 'monthly_plan_001',
    amount: 1000.00,
    offerId: 'offer-uuid',
    childName: 'John Doe'
  })
});

const data = await response.json();
// data.data.formFields contains all PayFast form fields
// data.data.payfastUrl contains PayFast URL
// data.data.basketId contains basket ID for status checking
```

### Step 2: Client Submits Form to PayFast

```html
<!-- Create and submit form to PayFast -->
<form id="payfastForm" method="POST" action="https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction">
  <input type="hidden" name="MERCHANT_ID" value="102">
  <input type="hidden" name="TOKEN" value="...">
  <input type="hidden" name="BASKET_ID" value="SUB-1735123456789-ABC123">
  <!-- ... all other formFields ... -->
</form>

<script>
  document.getElementById('payfastForm').submit();
</script>
```

### Step 3: User Completes Payment on PayFast

User is redirected to PayFast, enters payment details, and completes payment.

### Step 4: PayFast Redirects User

- **Success:** Redirects to `SUCCESS_URL`
- **Failure:** Redirects to `FAILURE_URL`

### Step 5: PayFast Sends IPN

PayFast sends IPN to `CHECKOUT_URL` (server-to-server).

### Step 6: Client Checks Status

```javascript
// Poll for payment status
const statusResponse = await fetch(
  `/api/v1/parent/subscriptions/status?basketId=SUB-1735123456789-ABC123`,
  {
    headers: {
      'Authorization': 'Bearer <token>'
    }
  }
);

const statusData = await statusResponse.json();
// statusData.data.orderStatus: "PENDING" | "SUCCESS" | "FAILED"
// statusData.data.subscriptionStatus: "ACTIVE" | "CREATED" | null
```

---

## Error Codes

### PayFast Error Codes
- `000`: Success
- `001`: Payment declined
- `002`: Insufficient funds
- `003`: Invalid card
- `004`: Expired card
- `005`: Transaction timeout

### Backend Error Codes
- `400`: Bad Request (missing parameters, validation errors)
- `401`: Unauthorized (missing/invalid JWT token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

---

## Notes

1. **IPN Endpoint Requirements:**
   - Must be publicly accessible (use ngrok for local testing)
   - Must use HTTPS in production
   - Must respond with `200 OK` within 30 seconds

2. **Recurring Payments:**
   - Automatically processed hourly via cron job
   - Subscriptions are suspended after 3 consecutive payment failures
   - Status changes to `EXPIRED` when suspended

3. **Basket ID Format:**
   - Initial payment: `SUB-{timestamp}-{random}`
   - Recurring payment: `RECUR-{subscriptionId}-{timestamp}-{random}`

4. **Transaction Amount:**
   - PayFast sends amount in smallest currency unit (e.g., 100000 = 1000.00 PKR)
   - Backend converts to decimal format

---

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

---

**Last Updated:** 2025-01-01


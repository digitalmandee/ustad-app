# PayFast Payment Integration - Backend APIs & Payment Flow

Complete documentation for PayFast subscription payment integration backend APIs and payment flow.

---

## 📋 Table of Contents

1. [Payment Flow Overview](#payment-flow-overview)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Payment Process Flow](#payment-process-flow)
4. [Recurring Payment Flow](#recurring-payment-flow)
5. [Data Structures](#data-structures)
6. [Error Handling](#error-handling)
7. [Environment Configuration](#environment-configuration)

---

## 🔄 Payment Flow Overview

The PayFast integration supports two types of payments:

1. **Initial Subscription Payment**: User subscribes to a plan (one-time payment that activates subscription)
2. **Recurring Payments**: Automatic monthly charges using stored payment tokens

### High-Level Flow Diagram

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. POST /api/payfast/subscription/initiate
     ▼
┌─────────┐
│ Backend │ ──► 2. GetAccessToken from PayFast
└────┬────┘
     │ 3. Return formFields + payfastUrl
     ▼
┌─────────┐
│ Client  │ ──► 4. POST form to PayFast PostTransaction
└────┬────┘
     │
     ▼
┌─────────┐
│ PayFast │ ──► 5. User completes payment
└────┬────┘
     │
     ├──► 6a. Redirect to SUCCESS_URL/FAILURE_URL
     │
     └──► 6b. Send IPN to CHECKOUT_URL
           │
           ▼
      ┌─────────┐
      │ Backend │ ──► 7. Validate hash, update DB, store token
      └────┬────┘
           │
           ▼
      ┌─────────┐
      │ Client  │ ──► 8. GET /api/subscriptions/status
      └─────────┘
```

---

## 🔌 Backend API Endpoints

### Base URL
```
http://localhost:3100
```

### 1. POST /api/payfast/subscription/initiate

Initiates a subscription payment. Creates an order and returns PayFast form data.

**Request:**
```http
POST /api/payfast/subscription/initiate
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "monthly_plan_001",
  "userId": "user_123",
  "amount": 1000.00,
  "customerEmail": "customer@example.com",
  "customerMobile": "03001234567"
}
```

**Request Parameters:**
- `planId` (required): Subscription plan identifier
- `userId` (optional): User identifier (defaults to 'user_123')
- `amount` (optional): Payment amount in PKR (defaults to 1000.00)
- `customerEmail` (optional): Customer email address
- `customerMobile` (optional): Customer mobile number

**Response (Success - 200):**
```json
{
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
    "TXNDESC": "Subscription purchase - Plan monthly_plan_001",
    "PROCCODE": "00",
    "TRAN_TYPE": "ECOMM_PURCHASE",
    "SUCCESS_URL": "https://your-frontend.com/payfast/success",
    "FAILURE_URL": "https://your-frontend.com/payfast/failure",
    "CHECKOUT_URL": "https://your-backend.com/api/payfast/ipn",
    "CUSTOMER_EMAIL_ADDRESS": "customer@example.com",
    "CUSTOMER_MOBILE_NO": "03001234567",
    "SIGNATURE": "random_hex_string",
    "VERSION": "MERCHANT-CART-0.1",
    "RECURRING_TXN": "TRUE"
  },
  "basketId": "SUB-1735123456789-ABC123"
}
```

**Response (Error - 400):**
```json
{
  "error": "planId is required"
}
```

**Response (Error - 500):**
```json
{
  "error": "Failed to initiate subscription",
  "message": "Error details"
}
```

---

### 2. POST /api/payfast/ipn

PayFast IPN (Instant Payment Notification) endpoint. Called by PayFast server-to-server after payment processing.

**⚠️ Important:** This endpoint must be publicly accessible via HTTPS (use ngrok for local testing).

**Request:**
```http
POST /api/payfast/ipn
Content-Type: application/x-www-form-urlencoded
```

**Request Parameters (from PayFast):**
- `basket_id` or `BASKET_ID`: Order basket ID
- `err_code` or `ERR_CODE`: Error code ("000" = success)
- `err_msg` or `ERR_MSG`: Error message
- `validation_hash` or `VALIDATION_HASH`: SHA256 hash for verification
- `transaction_id` or `TRANSACTION_ID`: PayFast transaction ID
- `transaction_amount` or `TRANSACTION_AMOUNT`: Transaction amount
- `Instrument_token` or `instrument_token`: Recurring payment token (if recurring enabled)
- `recurring_txn` or `RECURRING_TXN`: "TRUE" if recurring transaction

**Response:**
```http
HTTP/1.1 200 OK
OK
```

**What this endpoint does:**
1. Validates the `validation_hash` using SHA256 formula
2. Updates order status (SUCCESS/FAILED)
3. If recurring enabled and token present:
   - Stores `Instrument_token` as payment method
   - Creates/activates subscription
4. Logs IPN data to `data/ipn_log.json`
5. Always returns `200 OK` to prevent PayFast retries

**Validation Hash Formula:**
```
SHA256("{BASKET_ID}|{SECURED_KEY}|{MERCHANT_ID}|{ERR_CODE}")
```

---

### 3. GET /api/subscriptions/status

Check subscription/order status by basket ID.

**Request:**
```http
GET /api/subscriptions/status?basketId=SUB-1735123456789-ABC123
```

**Query Parameters:**
- `basketId` (required): The basket ID from initiate response

**Response (Success - 200):**
```json
{
  "basketId": "SUB-1735123456789-ABC123",
  "orderStatus": "SUCCESS",
  "subscriptionStatus": "ACTIVE",
  "subscriptionId": "sub_1735123456789",
  "transactionId": "txn_123456",
  "errorCode": null,
  "errorMessage": null,
  "createdAt": "2025-01-01T12:00:00.000Z",
  "completedAt": "2025-01-01T12:05:00.000Z"
}
```

**Order Status Values:**
- `PENDING`: Payment initiated, awaiting completion
- `SUCCESS`: Payment completed successfully
- `FAILED`: Payment failed or declined

**Subscription Status Values:**
- `ACTIVE`: Subscription is active and will be charged automatically
- `SUSPENDED`: Subscription suspended after 3 consecutive payment failures
- `CANCELLED`: Subscription cancelled (manual action)
- `null`: No subscription created yet

**Response (Error - 400):**
```json
{
  "error": "basketId is required"
}
```

**Response (Error - 404):**
```json
{
  "error": "Order not found"
}
```

---

### 4. POST /api/subscriptions/charge

Manually trigger a recurring charge for an active subscription (for testing).

**Request:**
```http
POST /api/subscriptions/charge
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscriptionId": "sub_1234567890"
}
```

**Request Parameters:**
- `subscriptionId` (required): Subscription ID to charge

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Recurring charge initiated",
  "invoiceId": "inv_1234567890",
  "basketId": "RECUR-sub_123-1234567890-ABC",
  "result": {
    "success": true,
    "basketId": "RECUR-sub_123-1234567890-ABC",
    "response": { ... }
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "subscriptionId is required"
}
```

**Response (Error - 404):**
```json
{
  "error": "Subscription not found"
}
```

**Response (Error - 400):**
```json
{
  "error": "Subscription is not active",
  "status": "SUSPENDED"
}
```

**Response (Error - 400):**
```json
{
  "error": "No instrument token available for this subscription"
}
```

---

### 5. GET /api/subscriptions/:subscriptionId

Get subscription details with related invoices.

**Request:**
```http
GET /api/subscriptions/sub_1234567890
```

**Response (Success - 200):**
```json
{
  "subscription": {
    "id": "sub_123",
    "userId": "user_123",
    "planId": "monthly_plan",
    "status": "ACTIVE",
    "amount": 1000.00,
    "currency": "PKR",
    "instrumentToken": "token_xyz",
    "paymentMethodId": "pm_123",
    "basketId": "SUB-1234567890-ABC",
    "activatedAt": "2025-01-01T12:00:00.000Z",
    "nextBillingDate": "2025-02-01T12:00:00.000Z",
    "lastPaymentDate": "2025-01-01T12:05:00.000Z",
    "lastPaymentAmount": 1000.00,
    "failureCount": 0
  },
  "invoices": [
    {
      "id": "inv_123",
      "subscriptionId": "sub_123",
      "basketId": "RECUR-sub_123-1234567890-ABC",
      "amount": 1000.00,
      "currency": "PKR",
      "status": "PAID",
      "createdAt": "2025-01-01T12:00:00.000Z",
      "paidAt": "2025-01-01T12:05:00.000Z",
      "transactionId": "txn_123"
    }
  ]
}
```

**Response (Error - 404):**
```json
{
  "error": "Subscription not found"
}
```

---

### 6. GET /api/subscriptions

List all subscriptions.

**Request:**
```http
GET /api/subscriptions
```

**Response (Success - 200):**
```json
{
  "count": 5,
  "subscriptions": [
    {
      "id": "sub_123",
      "userId": "user_123",
      "planId": "monthly_plan",
      "status": "ACTIVE",
      "amount": 1000.00,
      "currency": "PKR",
      "instrumentToken": "token_xyz",
      "nextBillingDate": "2025-02-01T12:00:00.000Z",
      ...
    },
    ...
  ]
}
```

---

### 7. POST /api/cron/process-due

Manually trigger the cron job to process due subscriptions (for testing).

**Request:**
```http
POST /api/cron/process-due
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Due subscriptions processed",
  "result": {
    "processed": 2,
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

**What this endpoint does:**
1. Finds all active subscriptions where `nextBillingDate <= now`
2. Creates invoices for each due subscription
3. Charges each subscription using stored `Instrument_token`
4. Updates subscription `nextBillingDate` after successful charge

**Note:** This also runs automatically via cron:
- Hourly: `0 * * * *` (every hour at minute 0)
- Daily: `0 2 * * *` (every day at 2:00 AM)

---

### 8. GET /api/ipn/log

View IPN (Instant Payment Notification) log entries.

**Request:**
```http
GET /api/ipn/log?limit=50
```

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 50, max: 1000)

**Response (Success - 200):**
```json
{
  "total": 150,
  "showing": 50,
  "entries": [
    {
      "timestamp": "2025-01-01T12:05:00.000Z",
      "data": {
        "basket_id": "SUB-1234567890-ABC",
        "err_code": "000",
        "transaction_id": "txn_123",
        ...
      }
    },
    ...
  ]
}
```

---

### 9. GET /health

Health check endpoint with statistics.

**Request:**
```http
GET /health
```

**Response (Success - 200):**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "subscriptions": 5,
  "invoices": 10,
  "orders": 15
}
```

---

## 💳 Payment Process Flow

### Step-by-Step: Initial Subscription Payment

#### Step 1: Client Initiates Payment

**Client Request:**
```javascript
POST /api/payfast/subscription/initiate
{
  "planId": "monthly_plan_001",
  "userId": "user_123",
  "amount": 1000.00,
  "customerEmail": "customer@example.com",
  "customerMobile": "03001234567"
}
```

**Backend Actions:**
1. Validates `planId` is provided
2. Generates unique `BASKET_ID` (format: `SUB-{timestamp}-{random}`)
3. Creates order record with status `PENDING`
4. Calls PayFast `GetAccessToken` API
5. Prepares PayFast form fields with `RECURRING_TXN: "TRUE"`
6. Returns form data to client

**Backend Response:**
```json
{
  "success": true,
  "payfastUrl": "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction",
  "formFields": { ... },
  "basketId": "SUB-1735123456789-ABC123"
}
```

#### Step 2: Client Submits Form to PayFast

**Client Action:**
- Creates HTML form with all `formFields`
- POSTs form to `payfastUrl` (PayFast PostTransaction endpoint)
- User is redirected to PayFast payment page

**PayFast Actions:**
- Displays payment page
- User enters payment details
- User completes payment (OTP/3DS if required)

#### Step 3: PayFast Processes Payment

**PayFast Actions:**
1. Processes payment
2. Redirects user to:
   - `SUCCESS_URL` if payment successful (err_code = "000")
   - `FAILURE_URL` if payment failed (err_code ≠ "000")
3. Sends IPN to `CHECKOUT_URL` (server-to-server)

#### Step 4: Backend Receives IPN

**IPN Request to Backend:**
```http
POST /api/payfast/ipn
basket_id=SUB-1735123456789-ABC123
&err_code=000
&validation_hash=abc123...
&transaction_id=txn_123
&Instrument_token=token_xyz
&recurring_txn=TRUE
```

**Backend Actions:**
1. **Validates Hash:**
   ```javascript
   calculatedHash = SHA256(`${basketId}|${SECURED_KEY}|${MERCHANT_ID}|${errCode}`)
   if (calculatedHash !== receivedHash) {
     return 400 // Invalid
   }
   ```

2. **Updates Order:**
   - Sets `order.status = "SUCCESS"` (if err_code = "000")
   - Stores `transactionId`
   - Sets `completedAt` timestamp

3. **If Recurring Enabled:**
   - Stores `Instrument_token` as payment method
   - Creates subscription with status `ACTIVE`
   - Sets `nextBillingDate` (typically +1 month)
   - Links subscription to order

4. **Logs IPN:**
   - Saves IPN data to `data/ipn_log.json`

5. **Responds:**
   - Always returns `200 OK` to PayFast

#### Step 5: Client Checks Status

**Client Request:**
```http
GET /api/subscriptions/status?basketId=SUB-1735123456789-ABC123
```

**Backend Response:**
```json
{
  "basketId": "SUB-1735123456789-ABC123",
  "orderStatus": "SUCCESS",
  "subscriptionStatus": "ACTIVE",
  "subscriptionId": "sub_1735123456789",
  "transactionId": "txn_123"
}
```

**Client Actions:**
- Shows success message
- Activates subscription features
- Displays subscription details

---

## 🔁 Recurring Payment Flow

### Automatic Recurring Charges

Recurring charges are processed automatically via cron jobs or manually via API.

#### Step 1: Cron Job Triggers (Automatic)

**Cron Schedule:**
- Hourly: `0 * * * *` (every hour at minute 0)
- Daily: `0 2 * * *` (every day at 2:00 AM)

**Cron Job Actions:**
1. Finds all subscriptions where:
   - `status = "ACTIVE"`
   - `nextBillingDate <= now`
   - `instrumentToken` exists

2. For each due subscription:
   - Creates invoice with status `PENDING`
   - Generates recurring basket ID: `RECUR-{subscriptionId}-{timestamp}-{random}`
   - Calls `chargeRecurringPayment()`

#### Step 2: Charge Recurring Payment

**Backend Actions:**
1. Gets `ACCESS_TOKEN` from PayFast
2. Prepares charge request with:
   - `INSTRUMENT_TOKEN`: Stored token from initial payment
   - `BASKET_ID`: New recurring basket ID
   - `TXNAMT`: Subscription amount
   - `RECURRING_TXN: "TRUE"`

3. POSTs to PayFast token charge endpoint
4. Updates invoice status to `PROCESSING`

#### Step 3: PayFast Processes Charge

**PayFast Actions:**
- Charges using stored token
- Sends IPN to `CHECKOUT_URL`

#### Step 4: Backend Receives Recurring IPN

**IPN Request:**
```http
POST /api/payfast/ipn
basket_id=RECUR-sub_123-1234567890-ABC
&err_code=000
&transaction_id=txn_456
```

**Backend Actions:**
1. Identifies recurring charge (basket ID starts with "RECUR-")
2. Finds invoice by `basketId`
3. If success (err_code = "000"):
   - Updates invoice: `status = "PAID"`
   - Updates subscription:
     - `nextBillingDate = nextBillingDate + 1 month`
     - `lastPaymentDate = now`
     - `lastPaymentAmount = invoice.amount`
     - `failureCount = 0`
4. If failed (err_code ≠ "000"):
   - Updates invoice: `status = "FAILED"`
   - Increments subscription `failureCount`
   - If `failureCount >= 3`:
     - Sets subscription `status = "SUSPENDED"`

#### Step 5: Manual Recurring Charge (Testing)

**Client Request:**
```http
POST /api/subscriptions/charge
{
  "subscriptionId": "sub_1234567890"
}
```

**Backend Actions:**
- Same as automatic flow, but triggered manually
- Useful for testing recurring payments

---

## 📊 Data Structures

### Order Object
```json
{
  "basketId": "SUB-1735123456789-ABC123",
  "userId": "user_123",
  "planId": "monthly_plan_001",
  "amount": 1000.00,
  "currency": "PKR",
  "status": "PENDING" | "SUCCESS" | "FAILED",
  "transactionId": "txn_123",
  "subscriptionId": "sub_123",
  "errorCode": "001",
  "errorMessage": "Payment declined",
  "createdAt": "2025-01-01T12:00:00.000Z",
  "completedAt": "2025-01-01T12:05:00.000Z",
  "failedAt": "2025-01-01T12:05:00.000Z",
  "ipnData": { ... }
}
```

### Subscription Object
```json
{
  "id": "sub_1735123456789",
  "userId": "user_123",
  "planId": "monthly_plan_001",
  "status": "ACTIVE" | "SUSPENDED" | "CANCELLED",
  "amount": 1000.00,
  "currency": "PKR",
  "instrumentToken": "token_xyz",
  "paymentMethodId": "pm_123",
  "basketId": "SUB-1735123456789-ABC123",
  "activatedAt": "2025-01-01T12:00:00.000Z",
  "nextBillingDate": "2025-02-01T12:00:00.000Z",
  "lastPaymentDate": "2025-01-01T12:05:00.000Z",
  "lastPaymentAmount": 1000.00,
  "lastInvoiceId": "inv_123",
  "failureCount": 0
}
```

### Invoice Object
```json
{
  "id": "inv_1735123456789",
  "subscriptionId": "sub_123",
  "userId": "user_123",
  "planId": "monthly_plan_001",
  "basketId": "RECUR-sub_123-1234567890-ABC",
  "amount": 1000.00,
  "currency": "PKR",
  "status": "PENDING" | "PROCESSING" | "PAID" | "FAILED",
  "transactionId": "txn_456",
  "createdAt": "2025-01-01T12:00:00.000Z",
  "dueDate": "2025-02-01T12:00:00.000Z",
  "paidAt": "2025-01-01T12:05:00.000Z",
  "failedAt": "2025-01-01T12:05:00.000Z",
  "errorCode": "001",
  "errorMessage": "Payment declined",
  "chargeInitiatedAt": "2025-01-01T12:00:00.000Z",
  "failureReason": "Insufficient funds"
}
```

### Payment Method Object
```json
{
  "id": "pm_1735123456789",
  "userId": "user_123",
  "instrumentToken": "token_xyz",
  "paymentType": "payfast_recurring",
  "basketId": "SUB-1735123456789-ABC123",
  "createdAt": "2025-01-01T12:00:00.000Z"
}
```

---

## ⚠️ Error Handling

### Common Error Codes

**Backend Errors:**
- `400 Bad Request`: Missing required parameters
- `404 Not Found`: Resource not found (order, subscription, etc.)
- `500 Internal Server Error`: Server error

**PayFast Error Codes:**
- `000`: Success
- `001`: Payment declined
- `002`: Insufficient funds
- `003`: Invalid card
- `004`: Expired card
- `005`: Transaction timeout
- (See PayFast documentation for complete list)

### Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

### IPN Validation Failures

If IPN validation hash fails:
- Request is rejected with `400 Bad Request`
- IPN is still logged for debugging
- Order/subscription status is NOT updated

---

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```env
# PayFast Configuration
PAYFAST_MERCHANT_ID=102
PAYFAST_SECURED_KEY=zWHjBp2AlttNu1sK
PAYFAST_ENV=UAT
PAYFAST_CURRENCY_CODE=PKR
PAYFAST_MERCHANT_NAME=Your Merchant Name

# PayFast URLs
PAYFAST_SUCCESS_URL=https://your-frontend.com/payfast/success
PAYFAST_FAILURE_URL=https://your-frontend.com/payfast/failure
PAYFAST_CHECKOUT_URL=https://your-backend.com/api/payfast/ipn

# Server Configuration
PORT=3100
```

### PayFast Environments

**UAT (Testing):**
- Get Access Token: `https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken`
- Post Transaction: `https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction`

**LIVE (Production):**
- Get Access Token: `https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken`
- Post Transaction: `https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction`

Set `PAYFAST_ENV=UAT` for testing or `PAYFAST_ENV=LIVE` for production.

### IPN Endpoint Requirements

The IPN endpoint (`/api/payfast/ipn`) must be:
- ✅ Publicly accessible (use ngrok for local testing)
- ✅ Using HTTPS
- ✅ Able to receive POST requests
- ✅ Responding with `200 OK` within 30 seconds

**Local Testing with ngrok:**
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Expose backend
ngrok http 3100

# Update .env:
PAYFAST_CHECKOUT_URL=https://abc123.ngrok.io/api/payfast/ipn
```

---

## 📝 Notes

1. **Data Persistence**: All data is stored in JSON files in the `data/` directory:
   - `data/orders.json`
   - `data/subscriptions.json`
   - `data/invoices.json`
   - `data/payment_methods.json`
   - `data/ipn_log.json`

2. **Validation Hash**: Always validate IPN hash before trusting payment data.

3. **Idempotency**: IPN handler is idempotent - duplicate IPNs are handled gracefully.

4. **Subscription Suspension**: Subscriptions are automatically suspended after 3 consecutive payment failures.

5. **Cron Jobs**: Recurring charges run automatically via cron. Manual trigger available via `/api/cron/process-due`.

6. **Testing**: Use PayFast UAT environment for testing. Test card numbers available in PayFast documentation.

---

## 🔗 Related Files

- `server.js` - Main backend server file
- `test-payment.html` - HTML test interface
- `payfastFlow.md` - Detailed PayFast integration flow
- `README.md` - Project setup and usage guide
- `TESTING.md` - Testing instructions

---

**Last Updated:** 2025-01-01


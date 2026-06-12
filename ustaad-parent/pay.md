# PayFast Pakistan (gopayfast.com) — Tokenization & Instruments Integration Guide

> **Source:** Official PayFast docs at https://gopayfast.com/docs  
> **Date of research:** June 2026  
> **Your integration:** `apipxy.apps.net.pk:8443/api` (live tokenization base URL)

---

## 🚨 Critical Finding — Why Your Instruments Flow Is Broken

The PayFast official docs state this **explicitly** for two key APIs:

> **"Add Permanent Payment Instrument"** — _"Currently this API is not available due to some bank/scheme level constraints."_

> **"Fetch Permanent Instrument Token (GET /user/instruments)"** — _"Currently this API is not available due to some bank/scheme level constraints."_

> **"Initiate Recurring Transaction (POST /transaction/recurring)"** — _"Currently this API is not available due to some bank/scheme level constraints."_

**This means the entire Flow B in your code (tokenized recurring charges) relies on APIs that PayFast themselves have disabled.** This is why `getListsOfInstruments()` returns empty or fails — there are no stored instruments because you cannot add them through the API either.

---

## The Two Flows — What Actually Works

### Flow A — Hosted Checkout with `RECURRING_TXN=TRUE` (Works)

This is your `initiateSubscription()` function. It redirects the customer to PayFast's hosted page, they enter card details there, and PayFast handles tokenization internally. After a successful transaction, PayFast sends an **IPN (Instant Payment Notification)** webhook to your `CHECKOUT_URL`. That IPN response is where you receive the `instrument_token`.

**You are currently not capturing the instrument token from the IPN callback.** This is the root cause.

### Flow B — Recurring API Charges (Partially Disabled)

The `POST /transaction/recurring` endpoint and `POST /user/instruments` are both marked unavailable due to bank/scheme constraints. You cannot use these right now with standard credentials.

---

## The Correct Flow to Get Instruments Working

```
Step 1: Customer completes checkout via hosted form (your Flow A) ✅
         └─ RECURRING_TXN = "TRUE" must be set (you have this)

Step 2: PayFast sends IPN webhook to your CHECKOUT_URL  ⬅ YOU MUST IMPLEMENT THIS
         └─ The IPN payload contains `instrument_token`
         └─ Store this token against the customer in your DB

Step 3: For future charges, call POST /transaction/recurring/otp  ✅ (works)
         └─ Uses the stored instrument_token

Step 4: Customer receives OTP from their bank → you collect it

Step 5: Call POST /transaction/recurring  ⚠️ (listed as unavailable)
         └─ If this still fails, you must go through hosted checkout again
```

---

## What Your Code Is Doing Wrong

| Issue                                                        | Location in Your Code     | Fix                                                                               |
| ------------------------------------------------------------ | ------------------------- | --------------------------------------------------------------------------------- |
| Calling `GET /user/instruments` expecting saved cards        | `getListsOfInstruments()` | This API is disabled. Instruments must come from IPN webhook after first checkout |
| No IPN handler implemented                                   | Missing entirely          | Add an IPN endpoint at your `CHECKOUT_URL`                                        |
| `CHECKOUT_URL` points to your backend but there's no handler | `formFields.CHECKOUT_URL` | Build a POST endpoint that parses and stores the IPN data                         |
| `customer_ip` missing from tokenization API calls            | All Flow B functions      | This is a required field — its absence alone can cause failures                   |
| Missing `merCatCode` (Merchant Category Code)                | All transaction API calls | Required field per docs                                                           |
| `user_mobile_number` format may be wrong                     | `CUSTOMER_MOBILE`         | Format must be `92-3XXXXXXXXX` (e.g. `92-3243214234`) not raw digits              |

---

## IPN Webhook — What to Implement

PayFast POSTs to your `CHECKOUT_URL` after every transaction. Your backend must:

```js
// Express.js example
app.post(
  "/api/v1/parent/payfast/ipn",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const {
      BASKET_ID,
      TRANSACTION_ID,
      STATUS, // "PAID", "UNPAID", etc.
      instrument_token, // ← THIS IS THE KEY FIELD for recurring
      TXNAMT,
      CUSTOMER_MOBILE_NO,
    } = req.body;

    if (STATUS === "PAID" && instrument_token) {
      // Save instrument_token to your DB against the customer/mobile number
      await db.saveInstrumentToken(CUSTOMER_MOBILE_NO, instrument_token);
    }

    res.status(200).send("OK");
  }
);
```

---

## Full Correct API Reference

### Base URLs

| Environment     | Checkout API                                           | Tokenization API                         |
| --------------- | ------------------------------------------------------ | ---------------------------------------- |
| **UAT/Sandbox** | `https://ipguat.apps.net.pk/Ecommerce/api/Transaction` | `https://apipxyuat.apps.net.pk:8443/api` |
| **Live**        | `https://ipg1.apps.net.pk/Ecommerce/api/Transaction`   | `https://apipxy.apps.net.pk:8443/api`    |

---

### 1. Get Access Token

```
POST /token
Content-Type: application/x-www-form-urlencoded

merchant_id=<ID>
&secured_key=<KEY>
&grant_type=client_credentials
&customer_ip=<END_USER_IP>   ← REQUIRED, missing in your code
```

Response: `{ token, refresh_token, expiry }`

---

### 2. Get Available Banks

```
GET /list/banks
Authorization: Bearer <token>
```

---

### 3. Get Payment Instrument Types for a Bank

```
GET /list/instruments?bank_code=<code>
Authorization: Bearer <token>
```

Returns `bankInstruments: [{ id, name }]` — these are **payment type IDs** (card, wallet, account), NOT saved customer instruments.

---

### 4. Customer Account Validation (Get OTP before transaction)

```
POST /customer/validate
Authorization: Bearer <token>

basket_id, txnamt, customer_mobile_no (format: 92-3XXXXXXXXX),
customer_email_address, account_type_id, customer_ip,
order_date (YYYY-MM-DD HH:mm:ss)

# For card:
card_number, expiry_month, expiry_year, cvv
```

---

### 5. Get Temporary Transaction Token (for tokenized flow)

```
POST /transaction/token
Authorization: Bearer <token>

merchant_user_id, user_mobile_number, basket_id, txnamt,
account_type, customer_ip, order_date
+ card or bank fields
```

Returns: `instrument_token` (temporary), `transaction_id`, `otp_required`

---

### 6. Tokenized Transaction (uses temporary token)

```
POST /transaction/tokenized
Authorization: Bearer <token>

instrument_token, transaction_id, merchant_user_id, user_mobile_number,
basket_id, order_date, txndesc, txnamt, otp, customer_ip
```

---

### 7. Add Permanent Instrument ⚠️ CURRENTLY DISABLED

```
POST /user/instruments
```

> Docs note: _"Currently this API is not available due to some bank/scheme level constraints."_

---

### 8. OTP for Recurring Transaction

```
POST /transaction/recurring/otp
Authorization: Bearer <token>

instrument_token, merchant_user_id, user_mobile_number,
basket_id, txnamt, order_date, cvv, customer_ip
```

---

### 9. Initiate Recurring Transaction ⚠️ CURRENTLY DISABLED

```
POST /transaction/recurring
```

> Docs note: _"Currently this API is not available due to some bank/scheme level constraints."_

---

### 10. Fetch Stored Instruments ⚠️ CURRENTLY DISABLED

```
GET /user/instruments?merchant_user_id=...&user_mobile_number=...
```

> Docs note: _"Currently this API is not available due to some bank/scheme level constraints."_

---

## Secured Hash (Signature) for Tokenization APIs

Your checkout flow uses SHA256 over sorted fields. The tokenization APIs use a **different hash mechanism** — a `secured_hash` parameter computed by concatenating specific fields and hashing with a separate key provided by PayFast.

| API                             | Fields to Hash                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Temp Token (card)               | `merchant_user_id + user_mobile_number + card_number + expiry_month + expiry_year + cvv` |
| Temp Token (account/wallet)     | `merchant_user_id + user_mobile_number + account_number + cnic_number`                   |
| OTP for Recurring               | `instrument_token + merchant_user_id + user_mobile_number`                               |
| Initiate Recurring              | `instrument_token + merchant_user_id + user_mobile_number + txnamt + basket_id [+ otp]`  |
| Add Permanent Instrument (card) | `merchant_user_id + user_mobile_number + card_number + expiry_month + expiry_year + cvv` |
| Fetch Instruments               | `merchant_user_id + user_mobile_number`                                                  |

> **Note:** The hash key for tokenization APIs may differ from your `SECURED_KEY`. Contact PayFast support to confirm.

---

## Mobile Number Format

Your current code uses `"3243214234234"` — this is incorrect.

**Required format:** `92-3XXXXXXXXX`  
**Example:** `92-3001234567`

Fix in your code:

```js
// Wrong
const CUSTOMER_MOBILE = "3243214234234";

// Correct
const CUSTOMER_MOBILE = "92-3243214234";
```

---

## Error Codes Reference

| Code   | Meaning                                      |
| ------ | -------------------------------------------- |
| `00`   | Success                                      |
| `001`  | Pending                                      |
| `002`  | Timeout                                      |
| `55`   | Invalid OTP/PIN                              |
| `14`   | Incorrect details / Inactive card            |
| `54`   | Card expired                                 |
| `97`   | Insufficient balance                         |
| `75`   | Max PIN retries exceeded                     |
| `850`  | OTP not required (issuer manages OTP itself) |
| `851`  | OTP required for permanent token             |
| `9000` | Rejected by fraud system                     |

---

## Recommended Action Plan

1. **Contact PayFast support** at https://gopayfast.com and ask:

   - When will `POST /user/instruments` and `POST /transaction/recurring` be re-enabled?
   - Confirm the hash key for tokenization APIs
   - Ask if there's a working sandbox account for testing

2. **Implement the IPN webhook** at your `CHECKOUT_URL` to capture `instrument_token` after the first hosted checkout. This is the only currently working way to get an instrument token.

3. **Fix the mobile number format** — use `92-3XXXXXXXXX`.

4. **Add `customer_ip`** to all tokenization API calls (it's a required field you're missing).

5. **Until recurring API is re-enabled**, consider using the hosted checkout flow for each subscription charge, or re-initiating checkout with pre-filled customer data.

---

## Useful Links

- **PayFast Pakistan docs:** https://gopayfast.com/docs
- **PayFast signup:** https://getstarted.apps.net.pk/signup
- **Laravel SDK (community):** https://github.com/zfhassaan/payfast
- **PHP SDK (community):** https://packagist.org/packages/rarashed/payfast-sdk

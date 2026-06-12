# PayFast Payment Integration Working Flow

This document details the architecture, request life cycle, database design, and cron jobs for the PayFast subscription payment system in the `ustaad-parent` service.

---

## 🗺️ Architectural Overview

The system manages recurring payments (subscriptions) using PayFast's tokenized transaction APIs. The setup facilitates:
1. **Initial Subscription Initiation:** Collecting user credentials and generating secure checksum signatures to redirect parents to PayFast's payment gateway.
2. **Instant Payment Notification (IPN / Webhook):** Receiving server-to-server posts from PayFast to finalize transaction statuses, activate subscriptions, and secure tokens.
3. **Automated Recurring Billing:** Using a scheduler (cron job) to periodically charge parents using saved tokens.

---

## 🔄 Core Execution Flows

### 1. Subscription Initiation Flow
When a parent accepts a tutor's offer, a subscription is initiated.

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent Client
    participant Controller as Parent Controller
    participant Service as Parent Service
    participant PayFastSvc as PayFast Service
    participant DB as Database (Postgres)
    participant PFAPI as PayFast Gateway

    Parent->>Controller: Accept Offer (PATCH /offer/ACCEPTED/:offerId)
    Note over Controller: Or via direct /payfast/subscription/initiate
    Controller->>Service: initiatePayFastSubscription()
    Service->>PayFastSvc: initiateSubscription(details)
    PayFastSvc->>PFAPI: POST /GetAccessToken (merchant credentials)
    PFAPI-->>PayFastSvc: Return Access Token
    PayFastSvc->>PayFastSvc: Generate SHA256 Signature
    PayFastSvc-->>Service: Return checkoutUrl & formFields (with Signature)
    Service->>DB: Find/Create ParentSubscription (status: CREATED)
    Service->>DB: Create ParentTransaction (orderStatus: PENDING)
    Service-->>Controller: Return initiation payload
    Controller-->>Parent: Form HTML + Fields + Redirect URL
    Parent->>PFAPI: HTTP POST Submit form with payload
```

### 2. IPN Callback Handling (Webhook)
Once the parent executes the payment, PayFast calls the backend endpoint server-to-server.

```mermaid
sequenceDiagram
    autonumber
    participant PF as PayFast Server
    participant Controller as Parent Controller
    participant Service as Parent Service
    participant PayFastSvc as PayFast Service
    participant DB as Database (Postgres)
    participant Notify as Notification Engine

    PF->>Controller: POST /api/v1/parent/payfast/ipn (URL-encoded)
    Controller->>Service: handlePayFastIPN(payload)
    Service->>PayFastSvc: validateIPNHash(basketId, errCode, hash)
    alt Hash is Valid
        alt errCode === "000" (SUCCESS)
            alt Initial Payment
                Service->>DB: Update ParentTransaction (orderStatus: SUCCESS, status: paid)
                Service->>DB: Update ParentSubscription (status: ACTIVE, instrumentToken)
                Service->>DB: Create PaymentMethod (PAYFAST)
                Service->>DB: Update Offer (status: ACCEPTED)
                Service->>DB: Create TutorTransaction (status: PAID) & Credit Tutor Balance
                Service->>DB: Create TutorSessions (status: active)
                Service->>Notify: Send push notifications to Parent and Tutor
            else Recurring Payment (basketId starts with "RECUR-")
                Service->>DB: Update ParentTransaction (orderStatus: SUCCESS, status: paid)
                Service->>DB: Update ParentSubscription (nextBillingDate += 1 month)
                Service->>DB: Create TutorTransaction & Credit Tutor Balance
                Service->>DB: Create new active TutorSessions for the new billing cycle
                Service->>Notify: Send recurring payment success notification
            end
        else Payment Failed (errCode !== "000")
            Service->>DB: Update ParentTransaction (orderStatus: FAILED, status: failed)
            alt Initial Payment
                Service->>DB: Set ParentSubscription (status: CANCELLED)
            else Recurring Payment
                Service->>DB: Increment subscription failureCount
                alt failureCount >= 3
                    Service->>DB: Suspend Subscription (status: EXPIRED)
                end
            end
            Service->>Notify: Send payment failed notification
        end
    else Hash is Invalid
        Service-->>Controller: Return Validation Error
    end
    Controller-->>PF: Return 200 OK (immediately prevents retries)
```

### 3. Hourly Recurring Billing (Cron Job)
A cron job executes periodically to capture due payments using tokenized cards.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Cron Scheduler
    participant Service as Cron Service
    participant PayFastSvc as PayFast Service
    participant DB as Database (Postgres)
    participant PFAPI as PayFast Gateway

    Cron->>Service: Trigger hourly (0 * * * *)
    Service->>DB: Find active subscriptions (nextBillingDate <= now & instrumentToken !== null)
    loop For each due subscription
        Service->>DB: Generate basket ID (RECUR-xxx) & Create PENDING Transaction
        Service->>PayFastSvc: chargeRecurringPayment(instrumentToken, basketId, amount)
        PayFastSvc->>PFAPI: POST /PostTransaction (using Saved Instrument Token)
        PFAPI-->>PayFastSvc: Acknowledge execution request
        Note over PFAPI, Service: Outcome will be processed asynchronously by the IPN Webhook
    end
```

---

## 🗄️ Database Schema Entities & Mappings

The following tables and attributes support this workflow:

### 1. `ParentSubscription`
Tracks the lifecycle of the parent's subscription plan.
* `basketId` (string): The unique identifier generated for the transaction (e.g. `SUB-timestamp-rand` or `RECUR-timestamp-rand`).
* `instrumentToken` (string): Secured token stored from PayFast for authorizing subsequent recurring charges.
* `status` (enum): `CREATED`, `ACTIVE`, `CANCELLED`, `EXPIRED`.
* `nextBillingDate` (timestamp): Next billing day. Advanced by 1 month upon successful payment.
* `lastPaymentDate` (timestamp): When the last transaction succeeded.
* `lastPaymentAmount` (decimal): Real value processed.
* `failureCount` (integer): Tracked attempts. Increments on error, suspends user to `EXPIRED` if values reach $\ge 3$.

### 2. `ParentTransaction`
Logs checkout bills.
* `basketId` (string): Correlates transactions to subscriptions.
* `orderStatus` (enum): `PENDING`, `SUCCESS`, or `FAILED`.
* `status` (enum): `created`, `paid`, `failed`.
* `invoiceId` (string): Mapped to PayFast transaction reference after callback.

### 3. `PaymentMethod`
Saves authorized cards.
* `instrumentToken` (string): Used for tokenized charges.
* `paymentProvider` (string): Identifies `PAYFAST` or `STRIPE`.

---

## 📦 Key Component Reference

### 1. [`payfast.service.ts`](file:///Users/hamza/Downloads/work/ustad-app/ustaad-parent/src/services/payfast.service.ts)
* Low-level API adapter.
* Handles SHA256 checksum creation (`generateSignature`) and webhook validation (`validateIPNHash`).
* Implements direct HTTP requests to retrieve session tokens (`GetAccessToken` / `token`) and charge cards (`PostTransaction` / `transaction/recurring`).

### 2. [`parent.service.ts`](file:///Users/hamza/Downloads/work/ustad-app/ustaad-parent/src/modules/parent/parent.service.ts)
* High-level business logic processor.
* Implements `initiatePayFastSubscription()` to create records and setup payment variables.
* Implements `handlePayFastIPN()` to parse incoming webhook fields and delegate logic to `handleInitialPaymentIPN()` or `handleRecurringPaymentIPN()`.

### 3. [`cron.service.ts`](file:///Users/hamza/Downloads/work/ustad-app/ustaad-parent/src/services/cron.service.ts)
* Orchestrates background execution.
* Finds overdue active subscriptions using `processRecurringPayments()`.
* Calls `chargeRecurringSubscription()` to spawn automated transactions.

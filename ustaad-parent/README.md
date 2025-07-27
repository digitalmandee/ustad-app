# Ustaad Parent Service

This service handles parent-related operations including profile management, child management, and payment processing.

## Payment Method API Endpoints

The service provides comprehensive payment method management for parents using Stripe integration.

### Prerequisites

1. Parent must have a valid customer ID in Stripe
2. Valid JWT authentication token
3. Parent role authorization

### API Endpoints

#### 1. Create Payment Method
**POST** `/parent/payment-methods`

Creates a new payment method for the authenticated parent.

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "id": "uuid",
    "parentId": "uuid",
    "stripePaymentMethodId": "pm_1234567890abcdef",
    "cardBrand": "visa",
    "cardLast4": "4242",
    "cardExpMonth": 12,
    "cardExpYear": 2025,
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Get All Payment Methods
**GET** `/parent/payment-methods`

Retrieves all payment methods for the authenticated parent.

**Response:**
```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "parentId": "uuid",
      "stripePaymentMethodId": "pm_1234567890abcdef",
      "cardBrand": "visa",
      "cardLast4": "4242",
      "cardExpMonth": 12,
      "cardExpYear": 2025,
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 3. Get Single Payment Method
**GET** `/parent/payment-methods/:paymentMethodId`

Retrieves a specific payment method by ID.

**Response:**
```json
{
  "success": true,
  "message": "Payment method retrieved successfully",
  "data": {
    "id": "uuid",
    "parentId": "uuid",
    "stripePaymentMethodId": "pm_1234567890abcdef",
    "cardBrand": "visa",
    "cardLast4": "4242",
    "cardExpMonth": 12,
    "cardExpYear": 2025,
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4. Update Payment Method
**PUT** `/parent/payment-methods/:paymentMethodId`

Updates a payment method (currently supports setting as default).

**Request Body:**
```json
{
  "isDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment method updated successfully",
  "data": {
    "id": "uuid",
    "parentId": "uuid",
    "stripePaymentMethodId": "pm_1234567890abcdef",
    "cardBrand": "visa",
    "cardLast4": "4242",
    "cardExpMonth": 12,
    "cardExpYear": 2025,
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 5. Delete Payment Method
**DELETE** `/parent/payment-methods/:paymentMethodId`

Deletes a payment method from both Stripe and the local database.

**Response:**
```json
{
  "success": true,
  "message": "Payment method deleted successfully",
  "data": {
    "message": "Payment method deleted successfully"
  }
}
```

### Frontend Integration

To integrate with the frontend:

1. **Create Payment Method:**
   - Use Stripe Elements to collect card details
   - Create a payment method using `stripe.createPaymentMethod()`
   - Send the payment method ID to this API

2. **Example Frontend Code:**
```javascript
// Create payment method with Stripe
const { paymentMethod, error } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});

if (error) {
  console.error('Error:', error);
} else {
  // Send to backend
  const response = await fetch('/parent/payment-methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentMethodId: paymentMethod.id
    })
  });
}
```

### Error Handling

The API returns appropriate error messages for various scenarios:
- Parent profile not found
- Customer ID not found
- Payment method not found in Stripe
- Payment method already exists
- Invalid payment method ID

### Security

- All endpoints require JWT authentication
- All endpoints require PARENT role authorization
- Payment method IDs are validated against Stripe
- Only the authenticated parent can access their own payment methods
# Contract Termination & Completion API Endpoints

## Parent Endpoints

### 1. Get Active Contracts for Dispute
**Endpoint:** `GET /parent/contracts/active`

**Description:** Retrieves all active contracts that the parent can dispute. Returns contracts with status 'active' or 'pending_completion'.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20)

**Example Request:**
```
GET /parent/contracts/active?page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Active contracts retrieved successfully",
  "data": {
    "contracts": [
      {
        "id": "contract-uuid",
        "parentId": "parent-uuid",
        "tutorId": "tutor-uuid",
        "offerId": "offer-uuid",
        "status": "active",
        "amount": 500.00,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": null,
        "planType": "monthly",
        "stripeSubscriptionId": "sub_xxx",
        "disputeReason": null,
        "disputedBy": null,
        "disputedAt": null,
        "completedSessions": 12,
        "totalSessions": 20,
        "canDispute": true,
        "tutor": {
          "id": "tutor-uuid",
          "fullName": "Jane Tutor",
          "email": "tutor@example.com",
          "image": "https://example.com/image.jpg",
          "phone": "+1234567890"
        },
        "Offer": {
          "id": "offer-uuid",
          "childName": "Alice",
          "subject": "Mathematics",
          "amountMonthly": 500.00,
          "startDate": "2024-01-01",
          "startTime": "10:00:00",
          "endTime": "11:00:00",
          "daysOfWeek": ["monday", "wednesday", "friday"],
          "description": "Math tutoring for grade 5"
        },
        "reviews": [
          {
            "id": "review-uuid-1",
            "reviewerId": "parent-uuid",
            "reviewedId": "tutor-uuid",
            "reviewerRole": "PARENT",
            "rating": 4,
            "review": "Great tutor, very patient.",
            "reviewer": {
              "id": "parent-uuid",
              "fullName": "John Parent",
              "email": "parent@example.com",
              "image": "https://example.com/parent.jpg"
            },
            "reviewed": {
              "id": "tutor-uuid",
              "fullName": "Jane Tutor",
              "email": "tutor@example.com",
              "image": "https://example.com/tutor.jpg"
            },
            "createdAt": "2024-01-15T10:00:00Z",
            "updatedAt": "2024-01-15T10:00:00Z"
          }
        ],
        "hasParentReview": true,
        "hasTutorReview": false,
        "parentReview": {
          "id": "review-uuid-1",
          "reviewerId": "parent-uuid",
          "reviewedId": "tutor-uuid",
          "reviewerRole": "PARENT",
          "rating": 4,
          "review": "Great tutor, very patient.",
          "createdAt": "2024-01-15T10:00:00Z"
        },
        "tutorReview": null,
        "paymentRequests": [
          {
            "id": "payment-request-uuid",
            "amount": 250.00,
            "status": "REQUESTED",
            "createdAt": "2024-01-10T08:00:00Z",
            "updatedAt": "2024-01-10T08:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### 2. Terminate Contract (Dispute or Complete)
**Endpoint:** `POST /parent/contracts/:contractId/terminate`

**Description:** Allows a parent to either dispute or complete a contract. If status is "dispute", a reason is required and the contract is forwarded to admin. If status is "completed", the contract is marked as completed without requiring a reason.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `contractId` (string, required) - The ID of the contract to terminate

**Request Body for Dispute:**
```json
{
  "status": "dispute",
  "reason": "The tutor is not showing up on time and the teaching quality is not meeting expectations."
}
```

**Request Body for Complete:**
```json
{
  "status": "completed"
}
```

**Request Body Fields:**
- `status` (string, required) - Must be either `"dispute"` or `"completed"`
- `reason` (string, required if status is "dispute") - Cancellation reason (only required for dispute)

**Response (200 OK) - Dispute:**
```json
{
  "success": true,
  "message": "Contract terminated and forwarded to admin",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid",
      "offerId": "offer-uuid",
      "status": "dispute",
      "disputeReason": "The tutor is not showing up on time...",
      "disputedBy": "parent-uuid",
      "disputedAt": "2024-01-15T10:30:00Z",
      "endDate": "2024-01-15T10:30:00Z",
      "amount": 500.00,
      "startDate": "2024-01-01T00:00:00Z"
    },
    "completedSessions": 12,
    "message": "Contract has been disputed and forwarded to admin for review"
  }
}
```

**Response (200 OK) - Complete:**
```json
{
  "success": true,
  "message": "Contract marked as completed",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid",
      "offerId": "offer-uuid",
      "status": "completed",
      "endDate": "2024-01-15T10:30:00Z",
      "amount": 500.00,
      "startDate": "2024-01-01T00:00:00Z"
    },
    "completedSessions": 12,
    "message": "Contract has been marked as completed"
  }
}
```

**Error Responses:**
- `400 Bad Request` - If status is invalid, reason is missing (for dispute), or contract is already in a terminal state
- `404 Not Found` - If contract doesn't exist or doesn't belong to the parent

---

### 3. Submit Contract Rating
**Endpoint:** `POST /parent/contracts/:contractId/rating`

**Description:** Allows a parent to submit a rating for a completed contract. The contract will be marked as "completed" only when both parent and tutor have submitted their ratings.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `contractId` (string, required) - The ID of the contract to rate

**Request Body:**
```json
{
  "rating": 4,
  "review": "Great tutor, very patient and knowledgeable. My child made excellent progress."
}
```

**Request Body Fields:**
- `rating` (integer, required) - Rating from 1 to 5
- `review` (string, optional) - Text review/feedback

**Response (200 OK) - When only parent has rated:**
```json
{
  "success": true,
  "message": "Rating submitted. Waiting for tutor to rate.",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "status": "pending_completion",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid"
    },
    "message": "Rating submitted. Waiting for tutor to rate."
  }
}
```

**Response (200 OK) - When both parties have rated:**
```json
{
  "success": true,
  "message": "Contract completed! Both parties have rated.",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "status": "completed",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid",
      "endDate": "2024-01-15T10:30:00Z"
    },
    "message": "Contract completed! Both parties have rated."
  }
}
```

**Error Responses:**
- `400 Bad Request` - If rating is not between 1-5, or contract cannot be rated in current state
- `404 Not Found` - If contract doesn't exist
- `409 Conflict` - If parent has already rated this contract

---

## Tutor Endpoints

### 4. Get Active Contracts for Dispute
**Endpoint:** `GET /tutor/contracts/active`

**Description:** Retrieves all active contracts that the tutor can dispute. Returns contracts with status 'active' or 'pending_completion'.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20)

**Example Request:**
```
GET /tutor/contracts/active?page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Active contracts retrieved successfully",
  "data": {
    "contracts": [
      {
        "id": "contract-uuid",
        "parentId": "parent-uuid",
        "tutorId": "tutor-uuid",
        "offerId": "offer-uuid",
        "status": "active",
        "amount": 500.00,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": null,
        "planType": "monthly",
        "stripeSubscriptionId": "sub_xxx",
        "disputeReason": null,
        "disputedBy": null,
        "disputedAt": null,
        "completedSessions": 8,
        "totalSessions": 15,
        "canDispute": true,
        "parent": {
          "id": "parent-uuid",
          "fullName": "John Parent",
          "email": "parent@example.com",
          "image": "https://example.com/image.jpg",
          "phone": "+1234567890"
        },
        "Offer": {
          "id": "offer-uuid",
          "childName": "Alice",
          "subject": "Mathematics",
          "amountMonthly": 500.00,
          "startDate": "2024-01-01",
          "startTime": "10:00:00",
          "endTime": "11:00:00",
          "daysOfWeek": ["monday", "wednesday", "friday"],
          "description": "Math tutoring for grade 5"
        },
        "reviews": [
          {
            "id": "review-uuid-1",
            "reviewerId": "tutor-uuid",
            "reviewedId": "parent-uuid",
            "reviewerRole": "TUTOR",
            "rating": 5,
            "review": "Great parent, always punctual.",
            "reviewer": {
              "id": "tutor-uuid",
              "fullName": "Jane Tutor",
              "email": "tutor@example.com",
              "image": "https://example.com/tutor.jpg"
            },
            "reviewed": {
              "id": "parent-uuid",
              "fullName": "John Parent",
              "email": "parent@example.com",
              "image": "https://example.com/parent.jpg"
            },
            "createdAt": "2024-01-14T10:00:00Z",
            "updatedAt": "2024-01-14T10:00:00Z"
          }
        ],
        "hasParentReview": false,
        "hasTutorReview": true,
        "parentReview": null,
        "tutorReview": {
          "id": "review-uuid-1",
          "reviewerId": "tutor-uuid",
          "reviewedId": "parent-uuid",
          "reviewerRole": "TUTOR",
          "rating": 5,
          "review": "Great parent, always punctual.",
          "createdAt": "2024-01-14T10:00:00Z"
        },
        "paymentRequests": [
          {
            "id": "payment-request-uuid",
            "amount": 200.00,
            "status": "PAID",
            "createdAt": "2024-01-05T08:00:00Z",
            "updatedAt": "2024-01-05T09:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### 5. Terminate Contract (Dispute or Complete)
**Endpoint:** `POST /tutor/contracts/:contractId/terminate`

**Description:** Allows a tutor to either dispute or complete a contract. If status is "dispute", a reason is required and the contract is forwarded to admin. If status is "completed", the contract is marked as completed without requiring a reason.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `contractId` (string, required) - The ID of the contract to terminate

**Request Body for Dispute:**
```json
{
  "status": "dispute",
  "reason": "The parent is not paying on time and frequently cancels sessions without notice."
}
```

**Request Body for Complete:**
```json
{
  "status": "completed"
}
```

**Request Body Fields:**
- `status` (string, required) - Must be either `"dispute"` or `"completed"`
- `reason` (string, required if status is "dispute") - Cancellation reason (only required for dispute)

**Response (200 OK) - Dispute:**
```json
{
  "success": true,
  "message": "Contract terminated and forwarded to admin",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid",
      "offerId": "offer-uuid",
      "status": "dispute",
      "disputeReason": "The parent is not paying on time...",
      "disputedBy": "tutor-uuid",
      "disputedAt": "2024-01-15T10:30:00Z",
      "endDate": "2024-01-15T10:30:00Z",
      "amount": 500.00,
      "startDate": "2024-01-01T00:00:00Z"
    },
    "completedSessions": 8,
    "message": "Contract has been disputed and forwarded to admin for review"
  }
}
```

**Response (200 OK) - Complete:**
```json
{
  "success": true,
  "message": "Contract marked as completed",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid",
      "offerId": "offer-uuid",
      "status": "completed",
      "endDate": "2024-01-15T10:30:00Z",
      "amount": 500.00,
      "startDate": "2024-01-01T00:00:00Z"
    },
    "completedSessions": 8,
    "message": "Contract has been marked as completed"
  }
}
```

**Error Responses:**
- `400 Bad Request` - If status is invalid, reason is missing (for dispute), or contract is already in a terminal state
- `404 Not Found` - If contract doesn't exist or doesn't belong to the tutor

---

### 6. Submit Contract Rating
**Endpoint:** `POST /tutor/contracts/:contractId/rating`

**Description:** Allows a tutor to submit a rating for a completed contract. The contract will be marked as "completed" only when both parent and tutor have submitted their ratings.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `contractId` (string, required) - The ID of the contract to rate

**Request Body:**
```json
{
  "rating": 5,
  "review": "Great parent, always punctual and respectful. The child is eager to learn."
}
```

**Request Body Fields:**
- `rating` (integer, required) - Rating from 1 to 5
- `review` (string, optional) - Text review/feedback

**Response (200 OK) - When only tutor has rated:**
```json
{
  "success": true,
  "message": "Rating submitted. Waiting for parent to rate.",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "status": "pending_completion",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid"
    },
    "message": "Rating submitted. Waiting for parent to rate."
  }
}
```

**Response (200 OK) - When both parties have rated:**
```json
{
  "success": true,
  "message": "Contract completed! Both parties have rated.",
  "data": {
    "contract": {
      "id": "contract-uuid",
      "status": "completed",
      "parentId": "parent-uuid",
      "tutorId": "tutor-uuid",
      "endDate": "2024-01-15T10:30:00Z"
    },
    "message": "Contract completed! Both parties have rated."
  }
}
```

**Error Responses:**
- `400 Bad Request` - If rating is not between 1-5, or contract cannot be rated in current state
- `404 Not Found` - If contract doesn't exist
- `409 Conflict` - If tutor has already rated this contract

---

## Admin Endpoints

### 7. Get Disputed Contracts
**Endpoint:** `GET /admin/contracts/disputed`

**Description:** Retrieves a paginated list of all contracts in "dispute" status for admin review.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20)

**Example Request:**
```
GET /admin/contracts/disputed?page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Disputed contracts retrieved successfully",
  "data": {
    "items": [
      {
        "id": "contract-uuid-1",
        "parentId": "parent-uuid",
        "tutorId": "tutor-uuid",
        "offerId": "offer-uuid",
        "status": "dispute",
        "disputeReason": "The tutor is not showing up on time...",
        "disputedBy": "parent-uuid",
        "disputedAt": "2024-01-15T10:30:00Z",
        "amount": 500.00,
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-01-15T10:30:00Z",
        "completedSessions": 12,
        "disputedByUser": {
          "id": "parent-uuid",
          "fullName": "John Parent",
          "email": "parent@example.com",
          "role": "PARENT"
        },
        "parent": {
          "id": "parent-uuid",
          "fullName": "John Parent",
          "email": "parent@example.com",
          "phone": "+1234567890"
        },
        "tutor": {
          "id": "tutor-uuid",
          "fullName": "Jane Tutor",
          "email": "tutor@example.com",
          "phone": "+0987654321"
        },
        "Offer": {
          "id": "offer-uuid",
          "childName": "Alice",
          "subject": "Mathematics",
          "amountMonthly": 500.00
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### 8. Resolve Dispute
**Endpoint:** `PUT /admin/contracts/:contractId/resolve`

**Description:** Allows admin to resolve a disputed contract by setting a final status. If the contract is cancelled, a payment request is automatically created for the tutor's completed sessions.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `contractId` (string, required) - The ID of the disputed contract

**Request Body:**
```json
{
  "finalStatus": "cancelled",
  "adminNotes": "After reviewing the case, the contract is cancelled. Tutor will be paid for 12 completed sessions."
}
```

**Request Body Fields:**
- `finalStatus` (string, required) - One of: `"cancelled"`, `"active"`, `"completed"`
- `adminNotes` (string, optional) - Admin's notes about the resolution

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Dispute resolved successfully",
  "data": {
    "id": "contract-uuid",
    "parentId": "parent-uuid",
    "tutorId": "tutor-uuid",
    "offerId": "offer-uuid",
    "status": "cancelled",
    "disputeReason": "The tutor is not showing up on time...",
    "disputedBy": "parent-uuid",
    "disputedAt": "2024-01-15T10:30:00Z",
    "endDate": "2024-01-15T10:30:00Z",
    "amount": 500.00,
    "startDate": "2024-01-01T00:00:00Z",
    "parent": {
      "id": "parent-uuid",
      "fullName": "John Parent",
      "email": "parent@example.com"
    },
    "tutor": {
      "id": "tutor-uuid",
      "fullName": "Jane Tutor",
      "email": "tutor@example.com"
    },
    "Offer": {
      "id": "offer-uuid",
      "childName": "Alice",
      "subject": "Mathematics"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - If finalStatus is invalid or contract is not in dispute status
- `404 Not Found` - If contract doesn't exist

**Notes:**
- When `finalStatus` is `"cancelled"`, the system automatically:
  1. Calculates completed sessions
  2. Creates a payment request for the tutor
  3. Sets the payment request status to `REQUESTED`

---

## Common Error Response Format

```json
{
  "success": false,
  "errors": [
    {
      "message": "Error message here"
    }
  ]
}
```

---

## Status Flow

### Contract Status Values:
- `active` - Contract is active and ongoing
- `pending_completion` - Waiting for both parties to submit ratings
- `dispute` - Contract has been terminated and is under admin review
- `completed` - Both parties have submitted ratings
- `cancelled` - Contract has been cancelled (after admin resolution)
- `expired` - Contract has expired
- `created` - Contract has been created but not yet active

### Status Transitions:

**Termination Flow:**
```
active → dispute (when parent/tutor terminates)
```

**Completion Flow:**
```
active → pending_completion (when first party rates)
pending_completion → completed (when second party rates)
```

**Admin Resolution:**
```
dispute → cancelled | active | completed (admin decision)
```

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Authorization

- **Parent endpoints** - Require `PARENT` role
- **Tutor endpoints** - Require `TUTOR` role  
- **Admin endpoints** - Require `ADMIN` or `SUPER_ADMIN` role

---

## Example cURL Commands

### Parent Get Active Contracts:
```bash
curl -X GET "http://localhost:3000/parent/contracts/active?page=1&limit=20" \
  -H "Authorization: Bearer <jwt_token>"
```

### Parent Terminate Contract (Dispute):
```bash
curl -X POST http://localhost:3000/parent/contracts/contract-uuid/terminate \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "dispute",
    "reason": "The tutor is not meeting our expectations."
  }'
```

### Parent Complete Contract:
```bash
curl -X POST http://localhost:3000/parent/contracts/contract-uuid/terminate \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Parent Submit Rating:
```bash
curl -X POST http://localhost:3000/parent/contracts/contract-uuid/rating \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "review": "Good tutor overall."
  }'
```

### Tutor Get Active Contracts:
```bash
curl -X GET "http://localhost:3000/tutor/contracts/active?page=1&limit=20" \
  -H "Authorization: Bearer <jwt_token>"
```

### Tutor Terminate Contract (Dispute):
```bash
curl -X POST http://localhost:3000/tutor/contracts/contract-uuid/terminate \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "dispute",
    "reason": "Payment issues and frequent cancellations."
  }'
```

### Tutor Complete Contract:
```bash
curl -X POST http://localhost:3000/tutor/contracts/contract-uuid/terminate \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Admin Get Disputed Contracts:
```bash
curl -X GET "http://localhost:3000/admin/contracts/disputed?page=1&limit=20" \
  -H "Authorization: Bearer <jwt_token>"
```

### Admin Resolve Dispute:
```bash
curl -X PUT http://localhost:3000/admin/contracts/contract-uuid/resolve \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "finalStatus": "cancelled",
    "adminNotes": "Resolved after review."
  }'
```


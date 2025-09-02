# Admin APIs Documentation

## Base URL
All admin APIs are prefixed with `/admin`

## Authentication
All endpoints require JWT authentication with `SUPER_ADMIN` role.

**Headers Required:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Response Format
All responses follow this standardized format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...} // Optional data object
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    {
      "message": "Error description"
    }
  ],
  "data": null // Optional data object
}
```

---

## 1. Get Platform Statistics

**Endpoint:** `GET /admin/stats`

**Description:** Get overall platform statistics including total users, parents, tutors, subscriptions, transactions, and revenue. Optionally filter by time period.

**Query Parameters:**
- `days` (optional): Time period filter. Allowed values: `7`, `30`, or `90`

**Request Examples:**
```
# Get all-time statistics
GET /admin/stats
Authorization: Bearer <jwt_token>

# Get statistics for the last 7 days
GET /admin/stats?days=7
Authorization: Bearer <jwt_token>

# Get statistics for the last 30 days
GET /admin/stats?days=30
Authorization: Bearer <jwt_token>

# Get statistics for the last 90 days
GET /admin/stats?days=90
Authorization: Bearer <jwt_token>
```

**Response (All-time statistics):**
```json
{
  "success": true,
  "message": "stats fetched successfully",
  "data": {
    "totalUsers": 1250,
    "totalParents": 800,
    "totalTutors": 450,
    "totalSubscriptions": 320,
    "totalTransactions": 485,
    "totalRevenue": 15750.50,
    "period": "all time"
  }
}
```

**Response (7-day statistics):**
```json
{
  "success": true,
  "message": "stats fetched successfully",
  "data": {
    "totalUsers": 45,
    "totalParents": 28,
    "totalTutors": 17,
    "totalSubscriptions": 12,
    "totalTransactions": 18,
    "totalRevenue": 2150.00,
    "period": "7 days"
  }
}
```

**Error Response (Invalid days parameter):**
```json
{
  "success": false,
  "errors": [
    {
      "message": "Days parameter must be 7, 30, or 90"
    }
  ]
}
```

---

## 2. Get All Parents

**Endpoint:** `GET /admin/parents`

**Description:** Get a paginated list of all parents in the system.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Request:**
```
GET /admin/parents?page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "parents fetched successfully",
  "data": {
    "items": [
      {
        "id": "parent-uuid-1",
        "userId": "user-uuid-1",
        "customerId": "cus_stripe_customer_id",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "User": {
          "id": "user-uuid-1",
          "fullName": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "image": "https://example.com/profile.jpg",
          "role": "PARENT"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 800,
      "totalPages": 40,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 3. Get Parent by ID

**Endpoint:** `GET /admin/parents/:id`

**Description:** Get detailed information about a specific parent including their children, subscriptions, and transactions.

**Path Parameters:**
- `id`: Parent ID or User ID

**Request:**
```
GET /admin/parents/parent-uuid-1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "parent fetched successfully",
  "data": {
    "parent": {
      "id": "parent-uuid-1",
      "userId": "user-uuid-1",
      "customerId": "cus_stripe_customer_id",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "User": {
        "id": "user-uuid-1",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "image": "https://example.com/profile.jpg",
        "role": "PARENT"
      }
    },
    "children": [
      {
        "id": "child-uuid-1",
        "userId": "user-uuid-1",
        "name": "Emma Doe",
        "age": 12,
        "grade": "7th Grade",
        "subjects": ["Math", "Science"],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "subscriptions": [
      {
        "id": "subscription-uuid-1",
        "parentId": "user-uuid-1",
        "tutorId": "tutor-uuid-1",
        "offerId": "offer-uuid-1",
        "stripeSubscriptionId": "sub_stripe_subscription_id",
        "status": "active",
        "planType": "monthly",
        "startDate": "2024-01-15T00:00:00Z",
        "amount": 150.00,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "transactions": [
      {
        "id": "transaction-uuid-1",
        "parentId": "user-uuid-1",
        "subscriptionId": "subscription-uuid-1",
        "invoiceId": "in_stripe_invoice_id",
        "status": "created",
        "amount": 150.00,
        "childName": "Emma Doe",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Error Response (Parent Not Found):**
```json
{
  "success": true,
  "message": "parent not found",
  "data": null
}
```

---

## 4. Get All Tutors

**Endpoint:** `GET /admin/tutors`

**Description:** Get a paginated list of all tutors in the system.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Request:**
```
GET /admin/tutors?page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "tutors fetched successfully",
  "data": {
    "items": [
      {
        "id": "tutor-uuid-1",
        "userId": "user-uuid-2",
        "balance": 250.50,
        "subjects": ["Mathematics", "Physics"],
        "hourlyRate": 25.00,
        "bio": "Experienced math tutor with 5 years of teaching experience",
        "createdAt": "2024-01-10T09:15:00Z",
        "updatedAt": "2024-01-10T09:15:00Z",
        "User": {
          "id": "user-uuid-2",
          "fullName": "Jane Smith",
          "email": "jane@example.com",
          "phone": "+1987654321",
          "image": "https://example.com/tutor-profile.jpg",
          "role": "TUTOR"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 450,
      "totalPages": 23,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 5. Get Tutor by ID

**Endpoint:** `GET /admin/tutors/:id`

**Description:** Get detailed information about a specific tutor including their education, experience, and document paths.

**Path Parameters:**
- `id`: Tutor ID or User ID

**Request:**
```
GET /admin/tutors/tutor-uuid-1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "tutor fetched successfully",
  "data": {
    "tutor": {
      "id": "tutor-uuid-1",
      "userId": "user-uuid-2",
      "balance": 250.50,
      "subjects": ["Mathematics", "Physics"],
      "bankName": "ABC Bank",
      "accountNumber": "1234567890",
      "resumeUrl": "https://example.com/documents/resume-uuid-1.pdf",
      "idFrontUrl": "https://example.com/documents/id-front-uuid-1.jpg",
      "idBackUrl": "https://example.com/documents/id-back-uuid-1.jpg",
      "about": "Experienced math tutor with 5 years of teaching experience",
      "grade": "Masters",
      "createdAt": "2024-01-10T09:15:00Z",
      "updatedAt": "2024-01-10T09:15:00Z",
      "User": {
        "id": "user-uuid-2",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1987654321",
        "image": "https://example.com/tutor-profile.jpg",
        "role": "TUTOR"
      }
    },
    "education": [
      {
        "id": "education-uuid-1",
        "tutorId": "user-uuid-2",
        "institutionName": "University of Science",
        "degree": "Bachelor of Science",
        "fieldOfStudy": "Mathematics",
        "startDate": "2015-09-01",
        "endDate": "2019-06-30",
        "grade": "3.8 GPA",
        "createdAt": "2024-01-10T09:15:00Z",
        "updatedAt": "2024-01-10T09:15:00Z"
      }
    ],
    "experience": [
      {
        "id": "experience-uuid-1",
        "tutorId": "user-uuid-2",
        "title": "Math Tutor",
        "company": "Learning Center ABC",
        "startDate": "2019-07-01",
        "endDate": "2023-12-31",
        "description": "Provided one-on-one math tutoring for high school students",
        "createdAt": "2024-01-10T09:15:00Z",
        "updatedAt": "2024-01-10T09:15:00Z"
      }
    ],
    "documents": {
      "resume": "https://example.com/documents/resume-uuid-1.pdf",
      "idFront": "https://example.com/documents/id-front-uuid-1.jpg",
      "idBack": "https://example.com/documents/id-back-uuid-1.jpg"
    }
  }
}
```

**Error Response (Tutor Not Found):**
```json
{
  "success": true,
  "message": "tutor not found",
  "data": null
}
```

---

## 6. Get All Payment Requests

**Endpoint:** `GET /admin/payment-requests`

**Description:** Get all payment requests from tutors (TutorTransaction records).

**Request:**
```
GET /admin/payment-requests
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "payment requests fetched successfully",
  "data": [
    {
      "id": "payment-request-uuid-1",
      "tutorId": "user-uuid-2",
      "subscriptionId": "subscription-uuid-1",
      "status": "PENDING",
      "amount": 125.00,
      "createdAt": "2024-01-15T14:20:00Z",
      "updatedAt": "2024-01-15T14:20:00Z"
    },
    {
      "id": "payment-request-uuid-2",
      "tutorId": "user-uuid-3",
      "subscriptionId": "subscription-uuid-2",
      "status": "PAID",
      "amount": 200.00,
      "createdAt": "2024-01-14T11:30:00Z",
      "updatedAt": "2024-01-14T16:45:00Z"
    }
  ]
}
```

---

## 7. Get Payment Request by ID

**Endpoint:** `GET /admin/payment-requests/:id`

**Description:** Get a specific payment request by ID.

**Path Parameters:**
- `id`: Payment request ID (TutorTransaction ID)

**Request:**
```
GET /admin/payment-requests/payment-request-uuid-1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "payment request fetched successfully",
  "data": {
    "id": "payment-request-uuid-1",
    "tutorId": "user-uuid-2",
    "subscriptionId": "subscription-uuid-1",
    "status": "PENDING",
    "amount": 125.00,
    "createdAt": "2024-01-15T14:20:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  }
}
```

---

## 8. Update Payment Request Status

**Endpoint:** `PUT /admin/payment-requests/status`

**Description:** Update the status of a payment request.

**Request Body:**
```json
{
  "id": "payment-request-uuid-1",
  "status": "PAID"
}
```

**Available Status Values:**
- `PENDING`
- `REQUESTED`
- `PAID`
- `IN_REVIEW`
- `REJECTED`

**Request:**
```
PUT /admin/payment-requests/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "payment-request-uuid-1",
  "status": "PAID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "payment request status updated successfully",
  "data": {
    "id": "payment-request-uuid-1",
    "tutorId": "user-uuid-2",
    "subscriptionId": "subscription-uuid-1",
    "status": "PAID",
    "amount": 125.00,
    "createdAt": "2024-01-15T14:20:00Z",
    "updatedAt": "2024-01-15T16:30:00Z"
  }
}
```

---

## Error Handling

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (Invalid/Missing JWT)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (Validation errors)
- `500` - Internal Server Error

### Authentication Errors:
```json
{
  "success": false,
  "errors": [
    {
      "message": "Access denied. No token provided."
    }
  ]
}
```

### Authorization Errors:
```json
{
  "success": false,
  "errors": [
    {
      "message": "Access denied. Insufficient permissions."
    }
  ]
}
```

---

## 9. Admin User Management

### 9.1. Create Admin User

**Endpoint:** `POST /admin/users/create`

**Description:** Create a new admin user in the users table with ADMIN role.

**Request Body:**
```json
{
  "fullName": "John Admin",
  "email": "admin@example.com",
  "phone": "+1234567890",
  "password": "securePassword123"
}
```

**Required Fields:**
- `fullName`: Admin's full name
- `email`: Admin's email address (must be unique)
- `password`: Password (minimum 6 characters)

**Optional Fields:**
- `phone`: Admin's phone number

**Request:**
```bash
POST /admin/users/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fullName": "John Admin",
  "email": "admin@example.com",
  "phone": "+1234567890",
  "password": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "id": "admin-uuid-123",
    "fullName": "John Admin",
    "email": "admin@example.com",
    "phone": "+1234567890",
    "role": "ADMIN",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
```json
// Missing required fields
{
  "success": false,
  "errors": [
    {
      "message": "Full name, email, and password are required"
    }
  ]
}

// Invalid email format
{
  "success": false,
  "errors": [
    {
      "message": "Invalid email format"
    }
  ]
}

// Password too short
{
  "success": false,
  "errors": [
    {
      "message": "Password must be at least 6 characters long"
    }
  ]
}

// Email already exists
{
  "success": false,
  "errors": [
    {
      "message": "User with this email already exists"
    }
  ]
}
```

---

### 9.2. Get All Admin Users

**Endpoint:** `GET /admin/users/admins`

**Description:** Get a paginated list of all admin users (ADMIN and SUPER_ADMIN roles).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Request:**
```bash
GET /admin/users/admins?page=1&limit=10
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Admins fetched successfully",
  "data": {
    "items": [
      {
        "id": "admin-uuid-1",
        "fullName": "John Admin",
        "email": "admin@example.com",
        "phone": "+1234567890",
        "role": "ADMIN",
        "isVerified": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "super-admin-uuid-1",
        "fullName": "Super Admin",
        "email": "superadmin@example.com",
        "phone": "+1987654321",
        "role": "SUPER_ADMIN",
        "isVerified": true,
        "createdAt": "2024-01-10T09:15:00Z",
        "updatedAt": "2024-01-10T09:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

## Summary

The admin API provides 10 endpoints for managing the platform:

1. **Statistics** - Platform overview with time period filtering
2. **Parent Management** - List and view parent details
3. **Tutor Management** - List and view tutor details with document paths  
4. **Payment Management** - View and update payment requests
5. **Admin User Management** - Create and manage admin users

All endpoints require `SUPER_ADMIN` role authentication and return standardized JSON responses. The API supports pagination for list endpoints and provides detailed relational data for individual resource views.
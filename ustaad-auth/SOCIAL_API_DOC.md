# Social API Documentation (Reporting & Blocking)

This document outlines the API endpoints for user reporting and blocking implemented in the `ustaad-auth` service.

## 1. Report a User

**Endpoint**: `POST /api/v1/user/report`  
**Authentication**: Required (JWT)

### Request Body

```json
{
  "reportedId": "uuid-of-the-reported-user",
  "reason": "HARASSMENT",
  "description": "User was being very rude in the chat."
}
```

**Allowed Reasons**: `HARASSMENT`, `SPAM`, `INAPPROPRIATE_CONTENT`, `OTHER`

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User reported successfully",
  "data": {
    "id": "uuid-of-the-report",
    "reporterId": "uuid-of-current-user",
    "reportedId": "uuid-of-reported-user",
    "reason": "HARASSMENT",
    "description": "User was being very rude in the chat.",
    "status": "PENDING",
    "updatedAt": "2026-05-12T13:45:00.000Z",
    "createdAt": "2026-05-12T13:45:00.000Z"
  }
}
```

---

## 2. Block a User

**Endpoint**: `POST /api/v1/user/block`  
**Authentication**: Required (JWT)

### Request Body

```json
{
  "blockedId": "uuid-of-the-user-to-block"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "id": "uuid-of-the-block-record",
    "blockerId": "uuid-of-current-user",
    "blockedId": "uuid-of-target-user",
    "updatedAt": "2026-05-12T13:46:00.000Z",
    "createdAt": "2026-05-12T13:46:00.000Z"
  }
}
```

---

## 3. Unblock a User

**Endpoint**: `DELETE /api/v1/user/unblock/:userId`  
**Authentication**: Required (JWT)

### Path Parameters

- `userId`: UUID of the user to unblock.

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "success": true
  }
}
```

---

## 4. Get Blocked Users List

**Endpoint**: `GET /api/v1/user/blocks`  
**Authentication**: Required (JWT)

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Blocked users fetched successfully",
  "data": [
    {
      "id": "uuid-of-blocked-user",
      "firstName": "John",
      "lastName": "Doe",
      "image": "profile-pic-url-or-base64",
      "role": "TUTOR"
    }
  ]
}
```

## Error Responses

### Unauthorized (401)

If the JWT token is missing or invalid.

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Bad Request (400)

If trying to block/report yourself or missing required fields.

```json
{
  "success": false,
  "message": "You cannot block yourself"
}
```

### Not Found (404)

If the target user does not exist.

```json
{
  "success": false,
  "message": "User to block not found"
}
```

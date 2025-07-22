# Ustaad Notifications Service

A centralized notification service for the Ustaad platform using Firebase Cloud Messaging (FCM) for push notifications.

## 🚀 Features

- **Push Notifications**: Send notifications to Android, iOS, and Web devices
- **Device Token Management**: Register and manage device tokens
- **Notification History**: Track and retrieve notification history
- **Bulk Notifications**: Send notifications to multiple users
- **Notification Statistics**: Get notification analytics
- **Firebase Integration**: Seamless Firebase Admin SDK integration

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project with Cloud Messaging enabled

## 🛠️ Setup

### 1. Install Dependencies
```bash
cd ustaad-notifications
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3004
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ustaad_notifications
DB_USER=postgres
DB_PASSWORD=your_password

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration (if needed for authentication)
JWT_SECRET=your-jwt-secret-key

# Logging
LOG_LEVEL=info
```

### 3. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Cloud Messaging
4. Go to Project Settings > Service Accounts
5. Generate new private key
6. Download the JSON file and extract the required values

### 4. Database Setup
```sql
-- Create database
CREATE DATABASE ustaad_notifications;

-- Run migrations (if using Sequelize migrations)
npx sequelize-cli db:migrate
```

### 5. Start the Service
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📱 API Endpoints

### Send Notifications

#### Send Single Notification
```http
POST /api/v1/notifications/send
Content-Type: application/json

{
  "userId": "user-uuid",
  "type": "booking_confirmation",
  "title": "Booking Confirmed",
  "body": "Your tutoring session has been confirmed",
  "data": {
    "bookingId": "booking-uuid",
    "sessionTime": "2024-01-15T10:00:00Z"
  }
}
```

#### Send Bulk Notifications
```http
POST /api/v1/notifications/bulk
Content-Type: application/json

{
  "notifications": [
    {
      "userId": "user-uuid-1",
      "type": "session_reminder",
      "title": "Session Reminder",
      "body": "Your session starts in 30 minutes"
    },
    {
      "userId": "user-uuid-2",
      "type": "payment_received",
      "title": "Payment Received",
      "body": "Your payment has been processed"
    }
  ]
}
```

### Device Token Management

#### Register Device Token
```http
POST /api/v1/notifications/token/register
Content-Type: application/json

{
  "userId": "user-uuid",
  "deviceToken": "firebase-device-token",
  "deviceType": "android"
}
```

#### Unregister Device Token
```http
POST /api/v1/notifications/token/unregister
Content-Type: application/json

{
  "deviceToken": "firebase-device-token"
}
```

#### Get User Device Tokens
```http
GET /api/v1/notifications/token/user/:userId
```

### Notification History

#### Get Notification History
```http
GET /api/v1/notifications/history/:userId?limit=50
```

#### Mark Notification as Read
```http
PUT /api/v1/notifications/read/:notificationId
```

#### Get Notification Statistics
```http
GET /api/v1/notifications/stats/:userId
```

## 🔧 Integration with Other Services

### From ustaad-tutor
```typescript
// Send booking confirmation
const response = await fetch('http://localhost:3004/api/v1/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: tutorId,
    type: 'booking_confirmation',
    title: 'New Booking Request',
    body: `You have a new booking request from ${parentName}`,
    data: { bookingId, parentId, sessionTime }
  })
});
```

### From ustaad-parent
```typescript
// Send session reminder
const response = await fetch('http://localhost:3004/api/v1/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: parentId,
    type: 'session_reminder',
    title: 'Session Reminder',
    body: 'Your tutoring session starts in 30 minutes',
    data: { sessionId, tutorName, subject }
  })
});
```

### From ustaad-chat
```typescript
// Send new message notification
const response = await fetch('http://localhost:3004/api/v1/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: recipientId,
    type: 'new_message',
    title: 'New Message',
    body: `${senderName}: ${messagePreview}`,
    data: { conversationId, messageId }
  })
});
```

## 📊 Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  isRead BOOLEAN DEFAULT FALSE,
  sentAt TIMESTAMP DEFAULT NOW(),
  readAt TIMESTAMP,
  deviceToken VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  retryCount INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Device Tokens Table
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL,
  deviceToken VARCHAR(500) UNIQUE NOT NULL,
  deviceType VARCHAR(10) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  lastUsedAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## 🔍 Health Check

```http
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Notification service is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚨 Error Handling

The service includes comprehensive error handling for:
- Invalid Firebase credentials
- Invalid device tokens
- Database connection issues
- Malformed requests
- Rate limiting (can be added)

## 📈 Monitoring

- **Logs**: All operations are logged with timestamps
- **Statistics**: Track notification success/failure rates
- **Device Token Management**: Automatic cleanup of invalid tokens
- **Retry Logic**: Failed notifications can be retried

## 🔐 Security

- Environment-based configuration
- Input validation
- Error message sanitization
- CORS configuration
- Rate limiting (recommended for production)

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3004
CMD ["npm", "start"]
```

### Environment Variables
Make sure to set all required environment variables in your deployment environment.

## 📞 Support

For issues and questions:
1. Check the logs for detailed error messages
2. Verify Firebase configuration
3. Ensure database connectivity
4. Validate device token format

---

**Note**: This service is designed to be lightweight and focused on notification delivery. For complex business logic, integrate with the appropriate service (tutor, parent, chat) and use this service only for notification delivery. 
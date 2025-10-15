# Notification System Implementation Guide

## Overview

This document describes the comprehensive notification system implemented across the Ustaad platform. The system supports **push notifications** (Firebase), **in-app notifications**, and **real-time notifications** (Socket.IO).

---

## ✅ Implemented Features

### 1. **Enhanced Notification Types**

All notification types are defined in `shared/constant/enums.ts`:

```typescript
export enum NotificationType {
  // Chat
  NEW_MESSAGE = 'NEW_MESSAGE',
  
  // Offers
  OFFER_RECEIVED = 'OFFER_RECEIVED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  
  // Sessions
  SESSION_REMINDER = 'SESSION_REMINDER',
  SESSION_CANCELLED_BY_PARENT = 'SESSION_CANCELLED_BY_PARENT',
  SESSION_CANCELLED_BY_TUTOR = 'SESSION_CANCELLED_BY_TUTOR',
  
  // Session Details
  TUTOR_CHECKED_IN = 'TUTOR_CHECKED_IN',
  TUTOR_CHECKED_OUT = 'TUTOR_CHECKED_OUT',
  TUTOR_HOLIDAY = 'TUTOR_HOLIDAY',
  
  // Subscriptions
  SUBSCRIPTION_CANCELLED_BY_PARENT = 'SUBSCRIPTION_CANCELLED_BY_PARENT',
  SUBSCRIPTION_CANCELLED_BY_TUTOR = 'SUBSCRIPTION_CANCELLED_BY_TUTOR',
  
  // Reviews
  REVIEW_RECEIVED_TUTOR = 'REVIEW_RECEIVED_TUTOR',
  REVIEW_RECEIVED_CHILD = 'REVIEW_RECEIVED_CHILD',
}
```

### 2. **Enhanced Notification Model**

The `Notification` model (`shared/models/Notification.ts`) now includes:

- `type`: Notification type enum
- `relatedEntityId`: ID of related entity (offer, message, session, review)
- `relatedEntityType`: Type of entity (for deep linking)
- `actionUrl`: Deep link URL for mobile apps
- `metadata`: Additional contextual data

### 3. **Notification Service Functions**

Located in `shared/notification-service.ts`:

- `sendNotificationToUser()`: Send notification to a single user
- `sendNotificationToUsers()`: Send notification to multiple users
- `getUserNotifications()`: Get user's notifications with pagination
- `markNotificationAsRead()`: Mark specific notification as read
- `markAllNotificationsAsRead()`: Mark all user notifications as read
- `getUnreadNotificationCount()`: Get count of unread notifications

### 4. **Notification Triggers**

#### **Chat Service** (`ustaad-chat`)
- ✅ New message notifications (all message types: text, image, file, audio, offer)

#### **Parent Service** (`ustaad-parent`)
- ✅ Offer accepted/rejected notifications (sent to tutor)
- ✅ Subscription cancelled by parent (sent to tutor)
- ✅ Review submitted notifications (sent to tutor)
- ✅ **Session reminders** (10 minutes before session - sent to both tutor and parent)

#### **Tutor Service** (`ustaad-tutor`)
- ✅ Session check-in notifications (sent to parent)
- ✅ Session checkout notifications (sent to parent)
- ✅ Session cancelled by tutor (sent to parent)
- ✅ Tutor holiday/leave notifications (sent to parent)

### 5. **Session Reminder Cron Job**

Location: `ustaad-parent/src/services/session-reminder.service.ts`

- Runs every minute
- Checks for sessions starting in 10 minutes
- Sends notifications to both tutor and parent
- Prevents duplicate notifications using a cache
- Auto-clears cache daily

**Features:**
- Time-based matching with session schedule
- Day-of-week matching
- Duplicate prevention
- Automatic cache cleanup

### 6. **Notification Management API**

Location: `ustaad-parent/src/modules/notification/`

**Endpoints:**

```
GET    /api/v1/notifications                 - Get user notifications (paginated)
GET    /api/v1/notifications/unread-count    - Get unread count
PUT    /api/v1/notifications/:id/read        - Mark notification as read
PUT    /api/v1/notifications/mark-all-read   - Mark all as read
```

**Example Response:**

```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [
      {
        "id": "notif-uuid",
        "userId": "user-uuid",
        "type": "NEW_MESSAGE",
        "title": "John Doe",
        "body": "Hello, how are you?",
        "isRead": false,
        "relatedEntityId": "message-uuid",
        "relatedEntityType": "message",
        "actionUrl": "/chat/conv-uuid",
        "metadata": {
          "conversationId": "conv-uuid",
          "senderId": "sender-uuid",
          "senderName": "John Doe"
        },
        "createdAt": "2025-10-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 7. **Socket.IO Real-time Notifications**

Location: `ustaad-chat/src/loaders/socket.ts`

**Features:**
- User socket mapping (tracks connected users)
- Personal notification rooms (`user:{userId}`)
- Real-time notification emission
- Automatic cleanup on disconnect

**Functions:**
- `emitNotificationToUser(userId, notification)`: Emit to single user
- `emitNotificationToUsers(userIds, notification)`: Emit to multiple users

**Client Usage:**

```typescript
// Connect to Socket.IO
const socket = io('http://localhost:305', {
  auth: { token: 'your-jwt-token' }
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Update UI, show toast, etc.
});
```

---

## 📱 Notification Flow

### Example: Offer Accepted

1. **Parent accepts offer** via `PUT /api/v1/parent/offer/ACCEPTED/:offerId`
2. **Parent Service**:
   - Updates offer status in database
   - Calls `sendNotificationToUser()`
3. **Notification Service**:
   - Creates notification record in database
   - Retrieves tutor's device token
   - Sends Firebase push notification
   - Updates notification status
4. **Real-time (Optional)**:
   - If tutor is connected to Socket.IO
   - Emits `notification` event to tutor's socket
5. **Tutor receives**:
   - Push notification on device
   - Real-time notification if app is open
   - In-app notification visible via API

---

## 🔧 Configuration

### Environment Variables

Ensure these are set in each service's `develop.env`:

```env
# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Database
DB_NAME=ustaad
DB_USER=postgres
DB_PASS=your-password
DB_HOST=localhost
DB_PORT=5432
```

### User Device Token

Users must register their device tokens for push notifications:

```typescript
// Update user's deviceId field
await User.update(
  { deviceId: 'firebase-device-token' },
  { where: { id: userId } }
);
```

---

## 📊 Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  type ENUM('NEW_MESSAGE', 'OFFER_ACCEPTED', ...) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  sentAt TIMESTAMP NOT NULL,
  readAt TIMESTAMP,
  deviceToken VARCHAR(255),
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  relatedEntityId UUID,
  relatedEntityType VARCHAR(50),
  actionUrl VARCHAR(255),
  metadata JSON,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE INDEX idx_notifications_userId ON notifications(userId);
CREATE INDEX idx_notifications_isRead ON notifications(isRead);
CREATE INDEX idx_notifications_createdAt ON notifications(createdAt);
```

---

## 🚀 Usage Examples

### Send Custom Notification

```typescript
import { sendNotificationToUser, NotificationType } from '@ustaad/shared';

await sendNotificationToUser({
  userId: 'user-uuid',
  type: NotificationType.SYSTEM_NOTIFICATION,
  title: 'Welcome!',
  body: 'Welcome to Ustaad platform',
  relatedEntityId: null,
  relatedEntityType: null,
  actionUrl: '/dashboard',
  metadata: {
    customField: 'value'
  }
});
```

### Get User Notifications

```typescript
import { getUserNotifications } from '@ustaad/shared';

const result = await getUserNotifications(userId, page, limit);
console.log(result.notifications);
console.log(result.pagination);
```

### Mark as Read

```typescript
import { markNotificationAsRead } from '@ustaad/shared';

const success = await markNotificationAsRead(notificationId, userId);
```

---

## 🔍 Testing

### Test Notification Sending

```bash
# Start all services
cd ustaad-main
npm run dev

# Test notification API
curl -X GET http://localhost:6000/parent/api/v1/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Session Reminders

The cron job runs every minute. To test:

1. Create a `TutorSession` with `startTime` 10 minutes from now
2. Ensure `daysOfWeek` includes today
3. Wait for the cron to run
4. Check logs for "Sent reminders for session..."

### Test Socket.IO Notifications

```javascript
// In browser console or Node.js
const socket = io('http://localhost:305', {
  auth: { token: 'your-jwt-token' }
});

socket.on('notification', (data) => {
  console.log('Received notification:', data);
});
```

---

## 📝 Implementation Checklist

- [x] Enhanced notification enum types
- [x] Enhanced notification model with metadata
- [x] Notification service helper functions
- [x] Chat message notifications
- [x] Offer accept/reject notifications
- [x] Subscription cancellation notifications
- [x] Review submission notifications
- [x] Session reminder cron job (10 min before)
- [x] Session check-in/out notifications
- [x] Session cancellation notifications
- [x] Holiday/leave notifications
- [x] Notification management API
- [x] Socket.IO real-time support

---

## 🎯 Future Enhancements

1. **Notification Preferences**: Allow users to configure which notifications they want
2. **Email Fallback**: Send emails for critical notifications
3. **SMS Integration**: Use Twilio for SMS notifications
4. **Notification Batching**: Batch multiple notifications to reduce spam
5. **Rich Notifications**: Support images, actions, and custom layouts
6. **Analytics**: Track notification delivery rates and user engagement
7. **Localization**: Support multiple languages
8. **Priority Levels**: Add high/medium/low priority levels
9. **Scheduled Notifications**: Support future-dated notifications
10. **Notification Templates**: Create reusable notification templates

---

## 🐛 Troubleshooting

### Notifications not sending?

1. Check user has `deviceId` set
2. Verify Firebase credentials in `.env`
3. Check notification service logs
4. Verify user is active (`isActive: true`)

### Cron not running?

1. Check parent service logs for "✅ Session reminder cron started"
2. Verify sessions exist with correct time and day
3. Check system time is correct
4. Ensure service hasn't crashed

### Socket.IO not working?

1. Verify chat service is running (port 305)
2. Check JWT token is valid
3. Ensure user connects with correct auth token
4. Check browser console for errors

---

## 📚 Related Files

### Shared Library
- `shared/constant/enums.ts` - Notification types
- `shared/models/Notification.ts` - Notification model
- `shared/notification-service.ts` - Core notification functions

### Services
- `ustaad-chat/src/modules/chat/chat.service.ts` - Chat notifications
- `ustaad-chat/src/loaders/socket.ts` - Socket.IO setup
- `ustaad-parent/src/modules/parent/parent.service.ts` - Parent notifications
- `ustaad-parent/src/services/session-reminder.service.ts` - Cron job
- `ustaad-parent/src/modules/notification/*` - Notification API
- `ustaad-tutor/src/modules/tutor/tutor.service.ts` - Tutor notifications

---

## ✅ Completion Status

All notification requirements have been successfully implemented:

1. ✅ Chat notifications
2. ✅ Offer accept/reject notifications
3. ✅ Session reminders (10 min before)
4. ✅ Check-in, checkout, holiday notifications
5. ✅ Subscription cancellation notifications
6. ✅ Review system notifications

**The notification system is production-ready!** 🎉


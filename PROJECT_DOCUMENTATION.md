# Ustaad Platform - Project Documentation

## Overview

Ustaad is a comprehensive tutoring platform built with a microservices architecture. The platform connects tutors with parents/students, providing features for user management, authentication, messaging, payment processing, and real-time communication.

## Architecture

### Microservices Architecture
The platform is built using a microservices architecture with the following components:

1. **API Gateway** (`ustaad-main`) - Port 5000
2. **Authentication Service** (`ustaad-auth`) - Port 300
3. **Tutor Service** (`ustaad-tutor`) - Port 302
4. **Parent Service** (`ustaad-parent`) - Port 301
5. **Chat Service** (`ustaad-chat`) - Port 303
6. **Notification Service** (`ustaad-notifications`) - Port 304
7. **Shared Library** (`shared`) - Common utilities and models

### Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Payment Processing**: Stripe
- **Notifications**: Firebase Admin SDK
- **Email**: SendGrid
- **SMS**: Twilio
- **API Gateway**: http-proxy-middleware

## Services Overview

### 1. API Gateway (`ustaad-main`)

**Purpose**: Central entry point for all client requests with routing and load balancing.

**Key Features**:
- Request routing to appropriate microservices
- Service health monitoring
- Automatic service management
- CORS handling
- Error handling and logging

**Endpoints**:
- `/health` - Health check with service status
- `/services/status` - Service status monitoring
- `/services/start` - Start all services
- `/services/stop` - Stop all services
- `/auth/*` - Proxy to auth service
- `/tutor/*` - Proxy to tutor service
- `/parent/*` - Proxy to parent service
- `/chat/*` - Proxy to chat service

**Service Management**:
- Automatic service startup/shutdown
- Environment variable management
- Process monitoring
- Graceful shutdown handling

### 2. Authentication Service (`ustaad-auth`)

**Purpose**: Handles user authentication, registration, and session management.

**Key Features**:
- User registration and login
- JWT token generation and validation
- Password reset functionality
- Email verification via OTP
- Session management

**Endpoints**:
- `POST /api/v1/auth/user-signup` - User registration
- `POST /api/v1/auth/user-signin` - User login
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/user-reset_password` - Password reset with token
- `POST /api/v1/auth/user-email_otp_verify` - Email OTP verification

**Models**:
- User
- OTP
- Session

### 3. Tutor Service (`ustaad-tutor`)

**Purpose**: Manages tutor profiles, onboarding, and tutor-specific functionality.

**Key Features**:
- Tutor onboarding and profile management
- Experience and education management
- Location-based tutor search
- Payment request handling
- File upload (resume, ID documents)
- Tutor settings and preferences

**Endpoints**:
- `POST /api/v1/tutor/onboarding` - Tutor registration
- `POST /api/v1/tutor/profile/edit` - Profile editing
- `GET /api/v1/tutor/profile` - Get tutor profile
- `POST /api/v1/tutor/experience/add` - Add experience
- `POST /api/v1/tutor/education/add` - Add education
- `GET /api/v1/tutor/location` - Find tutors by location
- `POST /api/v1/tutor/payment-request` - Create payment request

**Models**:
- Tutor
- TutorEducation
- TutorExperience
- TutorSettings
- TutorLocation
- PaymentRequest

### 4. Parent Service (`ustaad-parent`)

**Purpose**: Manages parent accounts, children profiles, and parent-specific functionality.

**Key Features**:
- Parent onboarding and profile management
- Child profile management
- Subscription management (Stripe integration)
- Payment processing
- File upload (ID documents)

**Endpoints**:
- `POST /api/v1/parent/onboarding` - Parent registration
- `POST /api/v1/parent/profile/edit` - Profile editing
- `GET /api/v1/parent/profile` - Get parent profile
- `POST /api/v1/parent/child/add` - Add child
- `GET /api/v1/parent/child/all` - Get all children
- `POST /api/v1/parent/subscription` - Create subscription
- `PUT /api/v1/parent/subscription/cancel` - Cancel subscription

**Models**:
- Parent
- Child
- ChildNotes
- ChildReview
- ParentSubscription

### 5. Chat Service (`ustaad-chat`)

**Purpose**: Handles real-time messaging between tutors and parents.

**Key Features**:
- Real-time messaging via Socket.IO
- Conversation management
- Message history
- File sharing
- Message status (read/unread)
- Offer system for tutoring sessions

**Endpoints**:
- `POST /api/v1/chat/messages` - Send message
- `GET /api/v1/chat/messages/conversation/:conversationId` - Get messages
- `PUT /api/v1/chat/messages/:messageId` - Update message
- `DELETE /api/v1/chat/messages/:messageId` - Delete message
- `POST /api/v1/chat/conversations` - Create conversation
- `GET /api/v1/chat/conversations` - Get user conversations
- `GET /api/v1/chat/conversations/:conversationId` - Get conversation by ID

**Socket.IO Events**:
- `joinConversation` - Join a conversation
- `sendMessage` - Send a message
- `markAsRead` - Mark message as read

**Models**:
- Conversation
- ConversationParticipant
- Message
- Offer

### 6. Notification Service (`ustaad-notifications`)

**Purpose**: Handles push notifications and in-app notifications.

**Key Features**:
- Firebase push notifications
- In-app notification management
- Device token management
- Notification scheduling

**Endpoints**:
- `POST /api/v1/notifications/send` - Send notification
- `POST /api/v1/notifications/device-token` - Register device token
- `GET /api/v1/notifications/user/:userId` - Get user notifications

**Models**:
- Notification
- DeviceToken

### 7. Shared Library (`shared`)

**Purpose**: Common utilities, models, and configurations shared across services.

**Key Features**:
- Database connection management
- Shared Sequelize models
- Common constants and enums
- Error handling utilities
- Response formatting utilities

**Models**:
- User
- Session
- Subject
- All other domain models

## Database Schema

### Core Models

1. **User** - Base user model with authentication fields
2. **Tutor** - Extended user model for tutors
3. **Parent** - Extended user model for parents
4. **Child** - Children profiles managed by parents
5. **Session** - User sessions and authentication
6. **Subject** - Available subjects for tutoring

### Chat Models

1. **Conversation** - Chat conversations between users
2. **ConversationParticipant** - Users participating in conversations
3. **Message** - Individual messages in conversations
4. **Offer** - Tutoring offers made through chat

### Tutor-Specific Models

1. **TutorEducation** - Tutor's educational background
2. **TutorExperience** - Tutor's work experience
3. **TutorSettings** - Tutor preferences and settings
4. **TutorLocation** - Tutor's location and availability
5. **PaymentRequest** - Payment requests from tutors

### Parent-Specific Models

1. **ChildNotes** - Notes about children
2. **ChildReview** - Reviews of children by tutors
3. **ParentSubscription** - Subscription management

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Password Hashing** - Bcrypt for password security
3. **Input Validation** - Express-validator for request validation
4. **CORS Protection** - Cross-origin resource sharing protection
5. **Helmet Security** - HTTP security headers
6. **File Upload Security** - Secure file upload handling

## Payment Integration

1. **Stripe Integration** - Payment processing for subscriptions
2. **Payment Request System** - For tutor payments
3. **Subscription Management** - Recurring payment handling

## Real-time Features

1. **Socket.IO Integration** - Real-time messaging
2. **Live Chat** - Instant messaging between users  
3. **Real-time Notifications** - Push notifications
4. **Online Status** - User online/offline status

## File Management

1. **Document Upload** - ID documents, resumes
2. **Image Upload** - Profile pictures, documents
3. **Secure Storage** - File validation and secure storage
4. **Multer Integration** - File upload handling

## Environment Configuration

Each service has its own environment configuration:

- **Database**: PostgreSQL connection settings
- **JWT Secret**: Authentication token secret
- **External APIs**: SendGrid, Twilio, Firebase, Stripe
- **Service Ports**: Individual service ports
- **Development/Production**: Environment-specific settings

## Development Setup

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies for each service
3. Set up PostgreSQL database
4. Configure environment variables
5. Start the API gateway

### Running Services
```bash
# Start all services
cd ustaad-main
npm run dev

# Or start individual services
cd ustaad-auth && npm run dev
cd ustaad-tutor && npm run dev
cd ustaad-parent && npm run dev
cd ustaad-chat && npm run dev
```

## API Documentation

### Base URLs
- **Gateway**: `http://localhost:5000`
- **Auth Service**: `http://localhost:300`
- **Tutor Service**: `http://localhost:302`
- **Parent Service**: `http://localhost:301`
- **Chat Service**: `http://localhost:303`

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Recent Fixes and Improvements

### Authentication Service
- Fixed user active status validation logic
- Updated route definitions to remove duplicate `/auth` prefix
- Added health check endpoint
- Improved error handling

### Chat Service
- Fixed Socket.IO server setup with proper HTTP server creation
- Enhanced error handling in socket loader
- Added health check endpoint
- Fixed authentication middleware logic

### API Gateway
- Improved proxy configuration with better error handling
- Added timeout configurations
- Enhanced logging for debugging
- Fixed path rewriting for auth service

## Known Issues and TODOs

1. **Auth Service Proxy**: Currently experiencing timeout issues with the gateway proxy
2. **Service Discovery**: Manual port configuration needed
3. **Load Balancing**: No load balancing implemented
4. **Monitoring**: Limited monitoring and logging
5. **Testing**: No comprehensive test suite
6. **Documentation**: API documentation needs completion

## Future Enhancements

1. **Service Discovery**: Implement service discovery mechanism
2. **Load Balancing**: Add load balancing for high availability
3. **Monitoring**: Implement comprehensive monitoring and logging
4. **Testing**: Add unit and integration tests
5. **CI/CD**: Implement continuous integration and deployment
6. **Documentation**: Complete API documentation with examples
7. **Performance**: Optimize database queries and caching
8. **Security**: Additional security measures and audits

## Deployment

### Production Considerations
1. **Environment Variables**: Secure environment variable management
2. **Database**: Production PostgreSQL setup with backups
3. **SSL/TLS**: HTTPS configuration
4. **Monitoring**: Application performance monitoring
5. **Logging**: Centralized logging system
6. **Backup**: Regular database and file backups

### Containerization
- Docker configuration for each service
- Docker Compose for local development
- Kubernetes for production deployment

## Support and Maintenance

### Logging
- Each service has its own logging
- Centralized logging through API gateway
- Error tracking and monitoring

### Monitoring
- Service health checks
- Performance monitoring
- Error tracking
- Usage analytics

### Backup Strategy
- Database backups
- File storage backups
- Configuration backups
- Disaster recovery plan

---

*This documentation covers the current state of the Ustaad platform as of the latest analysis. For the most up-to-date information, refer to the individual service documentation and code comments.* 
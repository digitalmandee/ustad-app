export enum UserRole {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  TUTOR = 'TUTOR',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// is on board
export enum IsOnBaord {
  REQUIRED = 'required',
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_REVIW = 'in review',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  OFFER = 'OFFER',
  AUDIO='AUDIO'
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL'
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  DELETED = 'DELETED'
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
export enum TutorPaymentStatus {
  PENDING = 'PENDING',
  REQUESTED = 'REQUESTED',
  PAID = 'PAID',
  IN_REVIEW = 'IN_REVIEW',
  REJECTED = 'REJECTED',
}

// OTP types
export enum OtpType {
  EMAIL = 'email',
  PHONE = 'phone',
}

// OTP statuses
export enum OtpStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
}
export enum TutorSessionStatus {
  CREATED = 'CREATED',
  COMPLETED = 'COMPLETED',
  TUTOR_HOLIDAY = 'TUTOR_HOLIDAY',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  CANCELLED_BY_PARENT = 'CANCELLED_BY_PARENT',
  CANCELLED_BY_TUTOR = 'CANCELLED_BY_TUTOR',
}

export enum HelpRequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum HelpRequestType {
  CONTRACT = 'CONTRACT',
  GENERAL = 'GENERAL',
}

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
  
  // Session Details (Check-in/out, holidays)
  TUTOR_CHECKED_IN = 'TUTOR_CHECKED_IN',
  TUTOR_CHECKED_OUT = 'TUTOR_CHECKED_OUT',
  TUTOR_ON_LEAVE = 'TUTOR_ON_LEAVE',
  TUTOR_HOLIDAY = 'TUTOR_HOLIDAY',
  
  // Contract/Subscription
  SUBSCRIPTION_CANCELLED_BY_PARENT = 'SUBSCRIPTION_CANCELLED_BY_PARENT',
  SUBSCRIPTION_CANCELLED_BY_TUTOR = 'SUBSCRIPTION_CANCELLED_BY_TUTOR',
  
  // Reviews
  REVIEW_RECEIVED_TUTOR = 'REVIEW_RECEIVED_TUTOR',
  REVIEW_RECEIVED_CHILD = 'REVIEW_RECEIVED_CHILD',
  
  // Contract Disputes
  CONTRACT_DISPUTED = 'CONTRACT_DISPUTED',
  CONTRACT_DISPUTE_RESOLVED = 'CONTRACT_DISPUTE_RESOLVED',
  
  // Contract Completion
  CONTRACT_RATING_SUBMITTED = 'CONTRACT_RATING_SUBMITTED',
  CONTRACT_COMPLETED = 'CONTRACT_COMPLETED',
  
  // System
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

export enum ParentSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  CREATED = 'CREATED',
  DISPUTE = 'DISPUTE',
  COMPLETED = 'COMPLETED',
  PENDING_COMPLETION = 'PENDING_COMPLETION',
}



export enum TutorTransactionType {
  PAYMENT = 'PAYMENT',
  WITHDRAWAL = 'WITHDRAWAL',
}
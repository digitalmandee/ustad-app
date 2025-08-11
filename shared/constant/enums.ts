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
  OFFER = 'OFFER'
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
export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
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
  RUNNING = 'RUNNING',
  TUTOR_HOLIDAY = 'TUTOR_HOLIDAY',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  COMPLETED = 'COMPLETED',
  CANCELLED_BY_PARENT = 'CANCELLED_BY_PARENT',
  CANCELLED_BY_TUTOR = 'CANCELLED_BY_TUTOR',
}

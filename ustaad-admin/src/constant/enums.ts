export enum UserRole {
  ADMIN = "ADMIN",
  PARENT = "PARENT",
  TUTOR = "TUTOR",
}

// is on boar
export enum IsOnBaord {
  REQUIRED = "required",
  PENDING = "pending",
  APPROVED = "approved",
  IN_REVIW = "in review",
}

// OTP types
export enum OtpType {
  EMAIL = "email",
  PHONE = "phone",
}

// OTP statuses
export enum OtpStatus {
  ACTIVE = "active",
  USED = "used",
  EXPIRED = "expired",
  FAILED = "failed",
}

export enum OtpPurpose {
  EMAIL_VERIFICATION = "email_verification",
  PHONE_VERIFICATION = "phone_verification",
  LOGIN = "login",
  PASSWORD_RESET = "password_reset",
}


export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}
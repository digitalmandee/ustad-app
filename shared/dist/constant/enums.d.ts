export declare enum UserRole {
    ADMIN = "ADMIN",
    PARENT = "PARENT",
    TUTOR = "TUTOR",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum IsOnBaord {
    REQUIRED = "required",
    PENDING = "pending",
    APPROVED = "approved",
    IN_REVIW = "in review"
}
export declare enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    FILE = "FILE",
    SYSTEM = "SYSTEM",
    OFFER = "OFFER",
    AUDIO = "AUDIO"
}
export declare enum ConversationType {
    DIRECT = "DIRECT",
    GROUP = "GROUP",
    CHANNEL = "CHANNEL"
}
export declare enum ConversationStatus {
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum MessageStatus {
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    READ = "READ",
    DELETED = "DELETED"
}
export declare enum OfferStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare enum TutorPaymentStatus {
    PENDING = "PENDING",
    REQUESTED = "REQUESTED",
    PAID = "PAID",
    IN_REVIEW = "IN_REVIEW",
    REJECTED = "REJECTED"
}
export declare enum OtpType {
    EMAIL = "email",
    PHONE = "phone"
}
export declare enum OtpStatus {
    ACTIVE = "active",
    USED = "used",
    EXPIRED = "expired",
    FAILED = "failed"
}
export declare enum OtpPurpose {
    EMAIL_VERIFICATION = "email_verification",
    PHONE_VERIFICATION = "phone_verification",
    LOGIN = "login",
    PASSWORD_RESET = "password_reset"
}
export declare enum TutorSessionStatus {
    CREATED = "CREATED",
    COMPLETED = "COMPLETED",
    TUTOR_HOLIDAY = "TUTOR_HOLIDAY",
    PUBLIC_HOLIDAY = "PUBLIC_HOLIDAY",
    CANCELLED_BY_PARENT = "CANCELLED_BY_PARENT",
    CANCELLED_BY_TUTOR = "CANCELLED_BY_TUTOR"
}
export declare enum HelpRequestStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}
export declare enum HelpRequestType {
    CONTRACT = "CONTRACT",
    GENERAL = "GENERAL"
}
export declare enum NotificationType {
    NEW_MESSAGE = "NEW_MESSAGE",
    OFFER_RECEIVED = "OFFER_RECEIVED",
    OFFER_ACCEPTED = "OFFER_ACCEPTED",
    OFFER_REJECTED = "OFFER_REJECTED",
    SESSION_REMINDER = "SESSION_REMINDER",
    SESSION_CANCELLED_BY_PARENT = "SESSION_CANCELLED_BY_PARENT",
    SESSION_CANCELLED_BY_TUTOR = "SESSION_CANCELLED_BY_TUTOR",
    TUTOR_CHECKED_IN = "TUTOR_CHECKED_IN",
    TUTOR_CHECKED_OUT = "TUTOR_CHECKED_OUT",
    TUTOR_ON_LEAVE = "TUTOR_ON_LEAVE",
    TUTOR_HOLIDAY = "TUTOR_HOLIDAY",
    SUBSCRIPTION_CANCELLED_BY_PARENT = "SUBSCRIPTION_CANCELLED_BY_PARENT",
    SUBSCRIPTION_CANCELLED_BY_TUTOR = "SUBSCRIPTION_CANCELLED_BY_TUTOR",
    REVIEW_RECEIVED_TUTOR = "REVIEW_RECEIVED_TUTOR",
    REVIEW_RECEIVED_CHILD = "REVIEW_RECEIVED_CHILD",
    SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION"
}

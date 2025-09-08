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

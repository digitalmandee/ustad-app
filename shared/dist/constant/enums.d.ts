export declare enum UserRole {
    ADMIN = "ADMIN",
    PARENT = "PARENT",
    TUTOR = "TUTOR"
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
    OFFER = "OFFER"
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
    REJECTED = "REJECTED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorTransactionType = exports.NotificationType = exports.HelpRequestType = exports.HelpRequestStatus = exports.TutorSessionStatus = exports.OtpPurpose = exports.OtpStatus = exports.OtpType = exports.TutorPaymentStatus = exports.OfferStatus = exports.MessageStatus = exports.ConversationStatus = exports.ConversationType = exports.MessageType = exports.IsOnBaord = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PARENT"] = "PARENT";
    UserRole["TUTOR"] = "TUTOR";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
// is on board
var IsOnBaord;
(function (IsOnBaord) {
    IsOnBaord["REQUIRED"] = "required";
    IsOnBaord["PENDING"] = "pending";
    IsOnBaord["APPROVED"] = "approved";
    IsOnBaord["IN_REVIW"] = "in review";
})(IsOnBaord || (exports.IsOnBaord = IsOnBaord = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["FILE"] = "FILE";
    MessageType["SYSTEM"] = "SYSTEM";
    MessageType["OFFER"] = "OFFER";
    MessageType["AUDIO"] = "AUDIO";
})(MessageType || (exports.MessageType = MessageType = {}));
var ConversationType;
(function (ConversationType) {
    ConversationType["DIRECT"] = "DIRECT";
    ConversationType["GROUP"] = "GROUP";
    ConversationType["CHANNEL"] = "CHANNEL";
})(ConversationType || (exports.ConversationType = ConversationType = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["ACTIVE"] = "ACTIVE";
    ConversationStatus["ARCHIVED"] = "ARCHIVED";
    ConversationStatus["DELETED"] = "DELETED";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "SENT";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["READ"] = "READ";
    MessageStatus["DELETED"] = "DELETED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var OfferStatus;
(function (OfferStatus) {
    OfferStatus["PENDING"] = "PENDING";
    OfferStatus["ACCEPTED"] = "ACCEPTED";
    OfferStatus["REJECTED"] = "REJECTED";
    OfferStatus["CANCELLED"] = "CANCELLED";
})(OfferStatus || (exports.OfferStatus = OfferStatus = {}));
var TutorPaymentStatus;
(function (TutorPaymentStatus) {
    TutorPaymentStatus["PENDING"] = "PENDING";
    TutorPaymentStatus["REQUESTED"] = "REQUESTED";
    TutorPaymentStatus["PAID"] = "PAID";
    TutorPaymentStatus["IN_REVIEW"] = "IN_REVIEW";
    TutorPaymentStatus["REJECTED"] = "REJECTED";
})(TutorPaymentStatus || (exports.TutorPaymentStatus = TutorPaymentStatus = {}));
// OTP types
var OtpType;
(function (OtpType) {
    OtpType["EMAIL"] = "email";
    OtpType["PHONE"] = "phone";
})(OtpType || (exports.OtpType = OtpType = {}));
// OTP statuses
var OtpStatus;
(function (OtpStatus) {
    OtpStatus["ACTIVE"] = "active";
    OtpStatus["USED"] = "used";
    OtpStatus["EXPIRED"] = "expired";
    OtpStatus["FAILED"] = "failed";
})(OtpStatus || (exports.OtpStatus = OtpStatus = {}));
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["EMAIL_VERIFICATION"] = "email_verification";
    OtpPurpose["PHONE_VERIFICATION"] = "phone_verification";
    OtpPurpose["LOGIN"] = "login";
    OtpPurpose["PASSWORD_RESET"] = "password_reset";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
var TutorSessionStatus;
(function (TutorSessionStatus) {
    TutorSessionStatus["CREATED"] = "CREATED";
    TutorSessionStatus["COMPLETED"] = "COMPLETED";
    TutorSessionStatus["TUTOR_HOLIDAY"] = "TUTOR_HOLIDAY";
    TutorSessionStatus["PUBLIC_HOLIDAY"] = "PUBLIC_HOLIDAY";
    TutorSessionStatus["CANCELLED_BY_PARENT"] = "CANCELLED_BY_PARENT";
    TutorSessionStatus["CANCELLED_BY_TUTOR"] = "CANCELLED_BY_TUTOR";
})(TutorSessionStatus || (exports.TutorSessionStatus = TutorSessionStatus = {}));
var HelpRequestStatus;
(function (HelpRequestStatus) {
    HelpRequestStatus["OPEN"] = "OPEN";
    HelpRequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    HelpRequestStatus["RESOLVED"] = "RESOLVED";
    HelpRequestStatus["CLOSED"] = "CLOSED";
    HelpRequestStatus["CANCELLED"] = "CANCELLED";
})(HelpRequestStatus || (exports.HelpRequestStatus = HelpRequestStatus = {}));
var HelpRequestType;
(function (HelpRequestType) {
    HelpRequestType["CONTRACT"] = "CONTRACT";
    HelpRequestType["GENERAL"] = "GENERAL";
})(HelpRequestType || (exports.HelpRequestType = HelpRequestType = {}));
var NotificationType;
(function (NotificationType) {
    // Chat
    NotificationType["NEW_MESSAGE"] = "NEW_MESSAGE";
    // Offers
    NotificationType["OFFER_RECEIVED"] = "OFFER_RECEIVED";
    NotificationType["OFFER_ACCEPTED"] = "OFFER_ACCEPTED";
    NotificationType["OFFER_REJECTED"] = "OFFER_REJECTED";
    // Sessions
    NotificationType["SESSION_REMINDER"] = "SESSION_REMINDER";
    NotificationType["SESSION_CANCELLED_BY_PARENT"] = "SESSION_CANCELLED_BY_PARENT";
    NotificationType["SESSION_CANCELLED_BY_TUTOR"] = "SESSION_CANCELLED_BY_TUTOR";
    // Session Details (Check-in/out, holidays)
    NotificationType["TUTOR_CHECKED_IN"] = "TUTOR_CHECKED_IN";
    NotificationType["TUTOR_CHECKED_OUT"] = "TUTOR_CHECKED_OUT";
    NotificationType["TUTOR_ON_LEAVE"] = "TUTOR_ON_LEAVE";
    NotificationType["TUTOR_HOLIDAY"] = "TUTOR_HOLIDAY";
    // Contract/Subscription
    NotificationType["SUBSCRIPTION_CANCELLED_BY_PARENT"] = "SUBSCRIPTION_CANCELLED_BY_PARENT";
    NotificationType["SUBSCRIPTION_CANCELLED_BY_TUTOR"] = "SUBSCRIPTION_CANCELLED_BY_TUTOR";
    // Reviews
    NotificationType["REVIEW_RECEIVED_TUTOR"] = "REVIEW_RECEIVED_TUTOR";
    NotificationType["REVIEW_RECEIVED_CHILD"] = "REVIEW_RECEIVED_CHILD";
    // System
    NotificationType["SYSTEM_NOTIFICATION"] = "SYSTEM_NOTIFICATION";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var TutorTransactionType;
(function (TutorTransactionType) {
    TutorTransactionType["PAYMENT"] = "PAYMENT";
    TutorTransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TutorTransactionType || (exports.TutorTransactionType = TutorTransactionType = {}));

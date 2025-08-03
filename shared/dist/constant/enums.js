"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpPurpose = exports.OtpStatus = exports.OtpType = exports.PaymentStatus = exports.OfferStatus = exports.MessageStatus = exports.ConversationStatus = exports.ConversationType = exports.MessageType = exports.IsOnBaord = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PARENT"] = "PARENT";
    UserRole["TUTOR"] = "TUTOR";
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
})(OfferStatus || (exports.OfferStatus = OfferStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["CONFIRMED"] = "CONFIRMED";
    PaymentStatus["REJECTED"] = "REJECTED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
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

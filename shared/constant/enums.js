"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpPurpose = exports.OtpStatus = exports.OtpType = exports.IsOnBaord = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PARENT"] = "PARENT";
    UserRole["TUTOR"] = "TUTOR";
})(UserRole || (exports.UserRole = UserRole = {}));
// is on boar
var IsOnBaord;
(function (IsOnBaord) {
    IsOnBaord["REQUIRED"] = "required";
    IsOnBaord["PENDING"] = "pending";
    IsOnBaord["APPROVED"] = "approved";
    IsOnBaord["IN_REVIW"] = "in review";
})(IsOnBaord || (exports.IsOnBaord = IsOnBaord = {}));
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

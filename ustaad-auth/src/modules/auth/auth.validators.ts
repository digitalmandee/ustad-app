import { body } from 'express-validator';
import constant from '../../constant/constant';
import { OtpPurpose, OtpType, UserRole } from '../../constant/enums';
import { Gender } from '@ustaad/shared';

export const signupValidationRules = () => {
  return [
    body('role')
      .optional()
      .custom((value: string) => validateRoles(value))
      .withMessage(constant.AUTH.INVALID_ROLE),
    body('fullName')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('fullName'))
      .bail()
      .notEmpty()
      .withMessage(constant.VALIDATION.EMPTY_VALUE('fullName'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('fullName'))
      .bail()
      .isLength({ min: constant.NAME.MIN_LENGTH, max: constant.NAME.MAX_LENGTH })
      .withMessage(
        constant.AUTH.NAME_LENGTH_MAX(constant.NAME.MIN_LENGTH, constant.NAME.MAX_LENGTH)
      ),

    body('gender')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('gender'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('gender'))
      .bail()
      .isIn(Object.values(Gender))
      .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),

    body('password')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('password'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('password'))
      .bail()
      .isLength({ min: constant.PASSWORD.MIN_LENGTH })
      .withMessage(constant.AUTH.PASSWORD_MIN_LENGTH(constant.PASSWORD.MIN_LENGTH))
      .bail()
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])/)
      .withMessage(constant.AUTH.PASSWORD_COMPLEXITY),

    body('cnic')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('cnic'))
      .bail()
      .matches(/^[0-9]{13}$/)
      .withMessage(constant.AUTH.INVALID_CNIC),

    body('address')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('address'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('address')),

    body('city')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('city'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('city')),

    body('state')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('state'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('state')),

    body('country')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('country'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('country')),

    body('email')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('email'))
      .bail()
      .isEmail()
      .withMessage(constant.AUTH.INVALID_EMAIL),

    body('phone')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('phone'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('phone'))
      .bail()
      .matches(/^[0-9]{10,15}$/)
      .withMessage(constant.AUTH.INVALID_PHONE),
  ];
};

export const signinValidationRules = () => {
  return [
    body('password')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('password'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('password')),

    body('email').optional().isEmail().withMessage(constant.AUTH.INVALID_EMAIL),
  ];
};

export const googleSignupValidationRules = () => {
  return [
    body('email')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('email'))
      .bail()
      .isEmail()
      .withMessage(constant.AUTH.INVALID_EMAIL),
    
    body('googleId')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('googleId'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('googleId'))
      .bail()
      .notEmpty()
      .withMessage(constant.VALIDATION.EMPTY_VALUE('googleId')),
    
    body('fullName')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('fullName'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('fullName'))
      .bail()
      .notEmpty()
      .withMessage(constant.VALIDATION.EMPTY_VALUE('fullName')),
    
    body('gender')
      .optional()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('gender'))
      .bail()
      .isIn(Object.values(Gender))
      .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
    
    body('role')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('role'))
      .bail()
      .custom((value: string) => validateRoles(value))
      .withMessage(constant.AUTH.INVALID_ROLE),
    
  ];
};

export const googleLoginValidationRules = () => {
  return [
    body('email')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('email'))
      .bail()
      .isEmail()
      .withMessage(constant.AUTH.INVALID_EMAIL),
    
    body('googleId')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('googleId'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('googleId'))
      .bail()
      .notEmpty()
      .withMessage(constant.VALIDATION.EMPTY_VALUE('googleId'))
  ];
};

export const verifyEmailOtpRules = () => {
  return [
    body('otp')
      .exists()
      .withMessage('OTP is required')
      .bail()
      .isString()
      .withMessage('OTP must be a string')
      .bail()
      .matches(/^\d{4}$/)
      .withMessage('OTP must be exactly 4 digits'),
    body('email')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('email'))
      .bail()
      .isEmail()
      .withMessage(constant.AUTH.INVALID_EMAIL),
  ];
};

export const passwordResetRules = () => {
  return [
    body('newPassword')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('password'))
      .bail()
      .isString()
      .withMessage(constant.VALIDATION.VALUE_MUST_BE_STRING('password'))
      .bail()
      .isLength({ min: constant.PASSWORD.MIN_LENGTH })
      .withMessage(constant.AUTH.PASSWORD_MIN_LENGTH(constant.PASSWORD.MIN_LENGTH))
      .bail()
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])/)
      .withMessage(constant.AUTH.PASSWORD_COMPLEXITY),

      body('userId')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('userId'))
      .bail().isUUID().withMessage('Invalid userId format'),

    body('purpose')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('purpose'))
      .bail().isIn(Object.values(OtpPurpose)).withMessage('Invalid purpose'),

    body('type')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('type'))
      .bail().isIn(Object.values(OtpType)).withMessage('Invalid type'),

    body('otp')
    .exists().withMessage(constant.VALIDATION.KEY_MISSING('otp'))
    .bail().isString().withMessage('Invalid type'),
  ];
};

export const forgotPasswordRules = () => {
  return [
    body('email')
      .exists()
      .withMessage(constant.VALIDATION.KEY_MISSING('email'))
      .bail()
      .isEmail()
      .withMessage(constant.AUTH.INVALID_EMAIL),
  ];
};

export const validateRoles = (role: unknown): role is UserRole => {
  return typeof role === 'string' && Object.values(UserRole).includes(role as UserRole);
};

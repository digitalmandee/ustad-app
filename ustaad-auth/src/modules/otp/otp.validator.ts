import { body } from 'express-validator';
import constant from '../../constant/constant';
import { OtpPurpose, OtpType } from '../../constant/enums';

export const otpValidator = () => {
  return [
    body('userId')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('userId'))
      .bail().isUUID().withMessage('Invalid userId format'),

    body('purpose')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('purpose'))
      .bail().isIn(Object.values(OtpPurpose)).withMessage('Invalid purpose'),

    body('type')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('type'))
      .bail().isIn(Object.values(OtpType)).withMessage('Invalid type. Must be email or phone'),
  ];
};

export const otpVerifyValidator = () => {
  return [
    body('userId')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('userId'))
      .bail().isUUID().withMessage('Invalid userId format'),

    body('purpose')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('purpose'))
      .bail().isIn(Object.values(OtpPurpose)).withMessage('Invalid purpose'),

    body('type')
      .exists().withMessage(constant.VALIDATION.KEY_MISSING('type'))
      .bail().isIn(Object.values(OtpType)).withMessage('Invalid type. Must be email or phone'),

    body('otp')
    .exists().withMessage(constant.VALIDATION.KEY_MISSING('otp'))
    .bail().isString().withMessage('Invalid type'),
  ];
};

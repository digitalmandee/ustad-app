import express from 'express';
import { validateRequest } from '../../middlewares';
import { otpValidator, otpVerifyValidator } from './otp.validator';
import OtpController from './otp.controller';


const router = express.Router();
const emailController = new OtpController();

/* User or consultant signup Route with email or phone */
router.post(
  '/auth/send-otp',
  otpValidator(),
  validateRequest,
  emailController.sendOtp
);

router.post(
  '/auth/verify-otp',
  otpVerifyValidator(),
  validateRequest,
  emailController.verifyOtp
);


export { router as emailRouter };

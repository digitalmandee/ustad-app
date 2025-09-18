import express from 'express';
import routes from '../../routes/routes';
import AuthController from './auth.controller';
import GoogleAuthController from './google-auth.controller';
import {
  signupValidationRules,
  signinValidationRules,
  verifyEmailOtpRules,
  passwordResetRules,
  forgotPasswordRules,
} from './auth.validators';
import { validateRequest } from '../../middlewares';
import { authenticateJwt } from '../../middlewares/auth';

const router = express.Router();
const authController = new AuthController();
const googleAuthController = new GoogleAuthController();

/* User or consultant signup Route with email or phone */
router.post(
  routes.USER_SIGNUP,
  signupValidationRules(),
  validateRequest,
  authController.userSignUp
);

router.post(
  routes.USER_SIGNIN,
  signinValidationRules(),
  validateRequest,
  authController.userSignIn
);

router.post(
  routes.USER_LOGOUT,
  authenticateJwt,
  authController.logout
);

// router.post(
//   routes.RESET_PASSWORD,
//   // authenticateJwt,
//   passwordResetRules(),
//   validateRequest,
//   authController.passwordReset
// );

router.post(
  routes.FORGOT_PASSWORD,
  forgotPasswordRules(),
  validateRequest,
  authController.forgotPassword
);

router.post(
  routes.RESET_PASSWORD,
  passwordResetRules(),
  validateRequest,
  authController.resetPasswordWithToken
);

// Google Login API endpoint
router.post(routes.GOOGLE_LOGIN, googleAuthController.googleLogin);

export { router as authRouter };

import express from 'express';
import routes from '../../routes/routes';
import AuthController from './auth.controller';
import {
  signupValidationRules,
  signinValidationRules,
  verifyEmailOtpRules,
  passwordResetRules,
} from './auth.validators';
import { validateRequest } from '../../middlewares';
import { authenticateJwt } from '../../middlewares/auth';

const router = express.Router();
const authController = new AuthController();

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
  routes.RESET_PASSWORD,
  authenticateJwt,
  passwordResetRules(),
  validateRequest,
  authController.passwordReset
);

export { router as authRouter };

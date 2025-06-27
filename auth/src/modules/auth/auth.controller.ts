import { Request, Response } from 'express';
import AuthService from './auth.service';
import { GenericError } from '../../errors/generic-error';
import { sendSuccessResponse } from '../../helper/response';
import InfoMessages from '../../constant/messages';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { IVerifyEmailOtpDTO } from './auth.dto';

export default class AuthController {
  private authService = new AuthService();

  userSignUp = async (req: Request, res: Response) => {
    try {
      let user = await this.authService.signUp(req.body);
      sendSuccessResponse(res, InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY('User'), 200, user);
    } catch (e: any) {
      throw new GenericError(e, ` Error from signup ${__filename}`);
    }
  };

  userSignIn = async (req: Request, res: Response) => {
    try {
      let user = await this.authService.signIn(req.body);
      sendSuccessResponse(res, InfoMessages.AUTH.SIGNIN_SUCESS, 200, user);
    } catch (e: any) {
      throw new GenericError(e, ` Error from signIn ${__filename}`);
    }
  };

  //   verifyEmailOtp = async (req: Request, res: Response) => {
  //   const dto: IVerifyEmailOtpDTO = req.body;
  //   try {
  //     let user = await this.authService.verifyEmailOtp(dto);
  //     sendSuccessResponse(res, "OTP verified", 200, user);
  //   } catch (e: any) {
  //     throw new GenericError(e, ` Error from OTP verification ${__filename}`);
  //   }
  // };

  passwordReset = async (req: AuthenticatedRequest, res: Response) => {
    let email = req.user.email;
    try {
      let user = await this.authService.passwordReset(email, req.body.password);
      sendSuccessResponse(res, 'Password changed sucessfully', 200, user);
    } catch (e: any) {
      throw new GenericError(e, ` Error from OTP verification ${__filename}`);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      let user = await this.authService.forgotPassword(email);
      sendSuccessResponse(res, 'OTP has been sent to email', 200, user);
    } catch (e: any) {
      throw new GenericError(e, ` Error from forgotPassword ${__filename}`);
    }
  };

  resetPasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { userId, type, purpose, otp, newPassword } = req.body;
      await this.authService.resetPasswordWithToken(otp, newPassword, userId, type, purpose);
      sendSuccessResponse(res, 'Password reset successfully', 200);
    } catch (e: any) {
      throw new GenericError(e, ` Error from resetPasswordWithToken ${__filename}`);
    }
  };
}

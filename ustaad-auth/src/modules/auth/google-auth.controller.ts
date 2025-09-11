import { Request, Response } from 'express';
import { GenericError } from '../../errors/generic-error';
import { sendSuccessResponse, sendErrorResponse } from '../../helper/response';
import InfoMessages from '../../constant/messages';
import GoogleAuthService, { GoogleUserData } from './google-auth.service';

export default class GoogleAuthController {
  private googleAuthService = new GoogleAuthService();

  // Handle Google login with user data from frontend
  googleLogin = async (req: Request, res: Response) => {
    try {
      const { email, googleId, fullName, image, accessToken, role } = req.body;
      const deviceId = req.headers.deviceid as string;

      // Validate required fields
      if (!email || !googleId || !fullName) {
        return sendErrorResponse(res, 'Email, Google ID, and full name are required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendErrorResponse(res, 'Invalid email format', 400);
      }

      const googleUserData: GoogleUserData = {
        email,
        googleId,
        fullName,
        image,
        accessToken,
        role,
      };

      // Process Google login
      const user = await this.googleAuthService.processGoogleLogin(googleUserData, deviceId);

      // Generate JWT token
      const token = this.googleAuthService.generateJWT(user);
      
      // Sanitize user data
      const sanitizedUser = this.googleAuthService.sanitizeUser(user);

      return sendSuccessResponse(
        res,
        InfoMessages.AUTH.SIGNIN_SUCESS,
        200,
        { ...sanitizedUser, token }
      );
    } catch (error: any) {
      console.error('Google login error:', error);
      
      if (error.message === 'Email and Google ID are required') {
        return sendErrorResponse(res, error.message, 400);
      }

      throw new GenericError(error, `Error from googleLogin ${__filename}`);
    }
  };
}

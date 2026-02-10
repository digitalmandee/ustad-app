import { Request, Response } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import GoogleAuthService, { GoogleUserData } from "./google-auth.service";
import jwt from "jsonwebtoken";
import { Session, User } from "@ustaad/shared";
import { Op } from "sequelize";

export default class GoogleAuthController {
  private googleAuthService = new GoogleAuthService();

  // Handle Google signup with user data from frontend
  googleSignup = async (req: Request, res: Response) => {
    try {
      const {
        email,
        googleId,
        firstName,
        lastName,
        image,
        accessToken,
        role,
        gender,
        city,
        country,
        state,
        phone,
      } = req.body;
      const deviceId = req.headers.deviceid as string;

      // Validate required fields
      if (!email || !googleId || !firstName || !lastName) {
        return sendErrorResponse(
          res,
          "Email, Google ID, first name, and last name are required",
          400
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendErrorResponse(res, "Invalid email format", 400);
      }

      const googleUserData: GoogleUserData = {
        email,
        googleId,
        firstName,
        lastName,
        image,
        accessToken,
        gender,
        role,
        city,
        country,
        state,
        phone,
      };

      // Process Google signup
      const user = await this.googleAuthService.processGoogleSignup(
        googleUserData,
        deviceId
      );

      // Generate JWT token
      const token = jwt.sign(
        {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        },
        process.env.JWT_SECRET!,
        { expiresIn: "6d" }
      );

      // Create session record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 6); // 6 days from now
      await Session.create({
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      });

      // Sanitize user data
      const sanitizedUser = user.toJSON();
      delete sanitizedUser.password;
      delete sanitizedUser.isActive;

      return sendSuccessResponse(
        res,
        "Google signup successful! User created and logged in.",
        200,
        { ...sanitizedUser, token }
      );
    } catch (error: any) {
      console.error("Google login error:", error);

      if (error.message === "Email and Google ID are required") {
        return sendErrorResponse(res, error.message, 400);
      }

      throw new GenericError(error, `Error from googleSignup ${__filename}`);
    }
  };

  // Handle Google login - check if user exists
  googleLogin = async (req: Request, res: Response) => {
    try {
      const { email, googleId } = req.body;
      const deviceId = req.headers.deviceid as string;

      // Validate required fields
      if (!email || !googleId) {
        return sendErrorResponse(res, "Email and Google ID are required", 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendErrorResponse(res, "Invalid email format", 400);
      }

      // Check if user exists by Google ID or email
      let user = await User.findOne({
        where: {
          [Op.or]: [{ googleId }, { email }],
        },
      });

      if (!user || user.isDeleted) {
        return sendErrorResponse(res, "User is not registered or deleted", 404);
      }

      // Update device ID if provided
      if (deviceId) {
        user.deviceId = deviceId;
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        },
        process.env.JWT_SECRET!,
        { expiresIn: "6d" }
      );

      // Create session record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 6); // 6 days from now
      await Session.create({
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
      });

      // Sanitize user data
      const sanitizedUser = user.toJSON();
      delete sanitizedUser.password;
      delete sanitizedUser.isActive;

      return sendSuccessResponse(res, InfoMessages.AUTH.SIGNIN_SUCESS, 200, {
        ...sanitizedUser,
        token,
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      throw new GenericError(error, `Error from googleLogin ${__filename}`);
    }
  };
}

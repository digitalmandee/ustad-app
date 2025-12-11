import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import {
  ISignUpCreateDTO,
  ISignInCreateDTO,
  IVerifyEmailOtpDTO,
} from "./auth.dto";
import { User, Otp, Session, NotificationType } from "@ustaad/shared";
import { sendNotificationToUser } from "../../services/notification.service";
import {
  comparePassword,
  generateOtp,
  hashPassword,
} from "../../helper/generic"; // should have hashPassword
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { NotAuthorizedError } from "../../errors/not-authorized-error";
import { OtpPurpose, OtpStatus, OtpType } from "@ustaad/shared";
import { OtpServices } from "../otp/otp.service";
import { BadRequestError } from "../../errors/bad-request-error";

export interface IAuthService {
  signUp: (userCreateDTO: ISignUpCreateDTO) => Promise<any>;
  signIn: (userSignInDTO: ISignInCreateDTO, deviceId: string) => Promise<any>;
  logout: (token: string) => Promise<void>;
  validateSession: (token: string) => Promise<any>;
  cleanupExpiredSessions: () => Promise<number>;
}

export default class AuthService implements IAuthService {
  public async signUp(userCreateDTO: ISignUpCreateDTO): Promise<any> {
    try {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: userCreateDTO.email },
            { phone: userCreateDTO.phone },
            { cnic: userCreateDTO.cnic },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === userCreateDTO.email) {
          throw new ConflictError(
            "This email is already registered. Please login instead."
          );
        }
        if (existingUser.phone === userCreateDTO.phone) {
          throw new ConflictError(
            "This phone is already registered. Please login instead."
          );
        }
        if (existingUser.cnic === userCreateDTO.cnic) {
          throw new ConflictError(
            "This CNIC is already registered. Please login instead."
          );
        }
      }

      const hashedPassword = await hashPassword(userCreateDTO.password);

      const newUser = await User.create({
        ...userCreateDTO,
        password: hashedPassword,
        isActive: true,
      });

      const sanitizedUser = newUser.toJSON();
      delete sanitizedUser.password;
      delete sanitizedUser.isActive;
      return { ...sanitizedUser };
    } catch (err: any) {
      if (err instanceof ConflictError || err instanceof GenericError) {
        throw err;
      }

      throw new GenericError(
        err,
        "Unable to process sign-up request [usrcrt2]"
      );
    }
  }

  public async signIn(
    userSignInDTO: ISignInCreateDTO,
    deviceId: string
  ): Promise<any> {
    try {
      const user = await User.findOne({
        where: { email: userSignInDTO.email },
      });

      if (!user) {
        throw new UnProcessableEntityError(
          "User not registered with provided email or phone."
        );
      }

      if (user.isDeleted) {
        throw new UnProcessableEntityError("User is deleted");
      }

      const isPasswordMatch = await comparePassword(
        userSignInDTO.password,
        user.password
      );
      if (!isPasswordMatch) {
        throw new UnProcessableEntityError("Invalid credentials");
      }

      // Save deviceId against user in db
      user.deviceId = deviceId;
      await user.save();

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

      const sanitizedUser = user.toJSON();
      delete sanitizedUser.password;
      delete sanitizedUser.isActive;

      // Send login notification
      try {
        await sendNotificationToUser({
          userId: user.id,
          type: NotificationType.SYSTEM_NOTIFICATION,
          title: "Login Success",
          body: `Welcome back, ${user.fullName || 'User'}! You have successfully logged in to your account.`,
          relatedEntityId: user.id,
          relatedEntityType: "user",
          actionUrl: "/profile",
          metadata: {
            loginTime: new Date().toISOString(),
            deviceId: deviceId,
            role: user.role,
          },
        });
        console.log("✅ Login notification sent successfully to user:", user.id);
      } catch (notificationError) {
        // Don't fail login if notification fails
        console.error("❌ Error sending login notification:", notificationError);
      }

      return { ...sanitizedUser, token };
    } catch (err: any) {
      console.log("err", err);
      if (err instanceof UnProcessableEntityError) throw err;
      throw new GenericError(
        err,
        "Unable to process sign-in request [usrcrt2]"
      );
    }
  }

  // export async function verifyOtp(dto: IVerifyEmailOtpDTO): Promise<any> {
  //   try {
  //     const { userId, otp, purpose } = dto;

  //     // 1. Find latest unverified OTP for the user and purpose
  //     const otpRecord = await Otp.findOne({
  //       where: {
  //         userId,
  //         purpose,
  //         status: OtpStatus.ACTIVE,
  //       },
  //       order: [['createdAt', 'DESC']],
  //     });

  //     if (!otpRecord) {
  //       throw new UnProcessableEntityError('not valid OTP or already used.');
  //     }

  //     // 2. Check expiry
  //     const now = new Date();
  //     if (now > otpRecord.expiry) {
  //       otpRecord.status = OtpStatus.EXPIRED;
  //       await otpRecord.save();
  //       throw new NotAuthorizedError('OTP has expired.');
  //     }

  //     // 3. Check if OTP matches
  //     if (otpRecord.otp !== otp) {
  //       otpRecord.status = OtpStatus.ACTIVE;
  //       await otpRecord.save();
  //       throw new NotAuthorizedError('Invalid OTP.');
  //     }

  //     // 4. Mark OTP as verified
  //     otpRecord.status = OtpStatus.USED;
  //     otpRecord.usedAt = now;
  //     await otpRecord.save();

  //     // 5. Get user and update verification flag
  //     const user = await User.findByPk(userId);
  //     if (!user) throw new UnProcessableEntityError('User not found');

  //     if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
  //       if (user.isEmailVerified) throw new ConflictError('Email already verified.');
  //       user.isEmailVerified = true;
  //     } else if (purpose === OtpPurpose.PHONE_VERIFICATION) {
  //       if (user.isPhoneVerified) throw new ConflictError('Phone already verified.');
  //       user.isPhoneVerified = true;
  //     }

  //     await user.save();

  //     // 6. Generate JWT
  //     const token = jwt.sign(
  //       {
  //         user: {
  //           id: user.id,
  //           email: user.email,
  //           phone: user.phone,
  //           role: user.role,
  //         },
  //       },
  //       process.env.JWT_SECRET!,
  //       { expiresIn: '1h' }
  //     );

  //     // 7. Sanitize user data before sending
  //     const sanitizedUser = user.toJSON();
  //     delete sanitizedUser.password;

  //     return { user: sanitizedUser, token };
  //   } catch (err: any) {
  //     if (
  //       err instanceof UnProcessableEntityError ||
  //       err instanceof NotAuthorizedError ||
  //       err instanceof ConflictError ||
  //       err instanceof GenericError
  //     ) {
  //       throw err;
  //     }
  //     throw new GenericError(err, 'Unable to verify OTP [otpver01]');
  //   }
  // }

  public async passwordReset(email: string, newPassword: string): Promise<any> {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new NotAuthorizedError("user not registered");
      }

      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;

      await user.save();

      const sanitizedUser = user.toJSON();
      delete sanitizedUser.password;
      delete sanitizedUser.isActive;
      return { ...sanitizedUser };
    } catch (err: any) {
      if (err instanceof NotAuthorizedError) {
        throw err;
      }

      throw new GenericError(err, "Unable to change password ");
    }
  }

  public async forgotPassword(email: string): Promise<any> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new NotAuthorizedError("user not registered");
      }
      // Send OTP for password reset
      const otpService = new OtpServices();
      await otpService.sendOtp({
        userId: user.id,
        type: OtpType.EMAIL,
        purpose: OtpPurpose.PASSWORD_RESET,
      });
      return { userId: user.id, email: user.email };
    } catch (err: any) {
      if (err instanceof NotAuthorizedError) {
        throw err;
      }
      throw new GenericError(err, "Unable to send password reset OTP");
    }
  }

  public async resetPasswordWithToken(
    otp: string,
    newPassword: string,
    userId: string,
    type: string,
    purpose: string
  ): Promise<void> {
    try {
      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotAuthorizedError("user not registered");
      }

      const now = new Date();
      // Find OTP entry
      const otpEntry = await Otp.findOne({
        where: {
          userId,
          type,
          purpose,
          status: OtpStatus.ACTIVE,
          expiry: {
            [Op.gt]: now, // Not expired
          },
        },
        order: [["createdAt", "DESC"]],
      });

      if (!otpEntry) {
        throw new BadRequestError("OTP invalid or expired");
      }

      // Check OTP code
      if (otpEntry.otp !== otp) {
        throw new BadRequestError("Invalid OTP code");
      }

      // Mark OTP as used
      otpEntry.status = OtpStatus.USED;
      otpEntry.usedAt = now;
      await otpEntry.save();

      // Change password
      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();
    } catch (err: any) {
      if (
        err instanceof BadRequestError ||
        err instanceof NotAuthorizedError ||
        err instanceof GenericError
      ) {
        throw err;
      }
      throw new GenericError(err, "Invalid or expired OTP");
    }
  }

  public async logout(token: string): Promise<void> {
    try {
      // Find and delete the session
      const session = await Session.findOne({ where: { token } });
      
      if (!session) {
        throw new NotAuthorizedError("Invalid session");
      }

      await session.destroy();
    } catch (err: any) {
      if (err instanceof NotAuthorizedError) {
        throw err;
      }
      throw new GenericError(err, "Unable to logout");
    }
  }

  public async validateSession(token: string): Promise<any> {
    try {
      const session = await Session.findOne({
        where: { 
          token,
          expiresAt: {
            [Op.gt]: new Date(), // Not expired
          },
        },
        include: [
          {
            model: User,
            attributes: ['id', 'email', 'phone', 'role', 'isActive'],
          },
        ],
      });

      if (!session) {
        throw new NotAuthorizedError("Invalid or expired session");
      }

      const user = (session as any).User;
      if (!user || !user.isActive) {
        throw new NotAuthorizedError("User does not exist or is not active");
      }

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      };
    } catch (err: any) {
      if (err instanceof NotAuthorizedError) {
        throw err;
      }
      throw new GenericError(err, "Session validation failed");
    }
  }

  public async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await Session.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date(), // Less than current time (expired)
          },
        },
      });

      console.log(`Cleaned up ${result} expired sessions`);
      return result;
    } catch (err: any) {
      console.error('Error cleaning up expired sessions:', err);
      throw new GenericError(err, "Failed to cleanup expired sessions");
    }
  }
}

import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import {
  ISignUpCreateDTO,
  ISignInCreateDTO,
  IVerifyEmailOtpDTO,
} from "./auth.dto";
import { User, Otp, Session } from "@ustaad/shared";
import { sendNotificationToUser } from "../../services/notification.service";
import {
  comparePassword,
  generateOtp,
  hashPassword,
} from "../../helper/generic"; // should have hashPassword
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { NotAuthorizedError } from "../../errors/not-authorized-error";
import {
  OtpPurpose,
  OtpStatus,
  OtpType,
  NotificationType,
} from "@ustaad/shared";
import { OtpServices } from "../otp/otp.service";
import { BadRequestError } from "../../errors/bad-request-error";
import { UserRole } from "@ustaad/shared";

export interface IAuthService {
  signUp: (userCreateDTO: ISignUpCreateDTO) => Promise<any>;
  signIn: (userSignInDTO: ISignInCreateDTO, deviceId: string) => Promise<any>;
  logout: (token: string) => Promise<void>;
  validateSession: (token: string) => Promise<any>;
  cleanupExpiredSessions: () => Promise<number>;
  forgotPassword: (email?: string, phone?: string) => Promise<any>;
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
          isDeleted: false,
        },
      });

      if (existingUser) {
        if (existingUser.email === userCreateDTO.email) {
          throw new ConflictError(
            "This email is already registered. Please login instead."
          );
        }
        if (existingUser.phone === userCreateDTO.phone) {
          throw new ConflictError("This phone is already registered.");
        }
        if (existingUser.cnic === userCreateDTO.cnic) {
          throw new ConflictError(
            "This CNIC is already registered. Please login instead."
          );
        }
      }

      const hashedPassword = await hashPassword(userCreateDTO.password);

      const userId = await this.generateCustomUserId(userCreateDTO.role);

      const newUser = await User.create({
        ...userCreateDTO,
        userId,
        password: hashedPassword,
        isActive: true,
      });

      // Send Email OTP on signup
      try {
        const otpService = new OtpServices();
        if (newUser.email) {
          await otpService.sendOtp({
            userId: newUser.id,
            type: OtpType.EMAIL,
            purpose: OtpPurpose.EMAIL_VERIFICATION,
            email: newUser.email,
          });
        }
      } catch (otpErr) {
        console.error("⚠️ Failed to send verification email OTP during signup:", otpErr);
      }

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
        throw new UnProcessableEntityError("Invalid email address or password");
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
        if (user.deviceId) {
          await sendNotificationToUser(
            user.id,
            user.deviceId,
            "Login Success",
            `Welcome back, ${user.firstName} ${user.lastName}! You have successfully logged in to your account.`,
            {
              loginTime: new Date().toISOString(),
              deviceId: deviceId,
              role: user.role,
              userId: user.id,
              type: NotificationType.SYSTEM_NOTIFICATION,
            },
            "http://15.235.204.49:5000/logo.png", // imageUrl
            "/profile", // clickAction
            NotificationType.SYSTEM_NOTIFICATION
          );
          console.log(
            "✅ Login notification sent successfully to user:",
            user.id
          );
        } else {
          console.log("⚠️ User has no device token, skipping notification");
        }
      } catch (notificationError) {
        // Don't fail login if notification fails
        console.error(
          "❌ Error sending login notification:",
          notificationError
        );
      }

      // Send email if user is an ADMIN or SUPER_ADMIN
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        try {
          const { sendEmailViaSES } = await import("../../services/aws-email.service");
          const subject = `⚠️ Ustaad Security: Admin Login Detected`;
          const html = `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="background: linear-gradient(135deg, #f43f5e, #e11d48); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; color: white; text-transform: uppercase;">Security Alert</span>
              </div>
              <h2 style="color: #ffffff; text-align: center; margin-top: 10px; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Admin Account Login</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                A new sign-in was detected for an administrative account on Ustaad.
              </p>
              <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; border: 1px solid #334155; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 500; width: 35%;">User ID</td>
                    <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">\${user.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Name</td>
                    <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">\${user.firstName} \${user.lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Email</td>
                    <td style="padding: 8px 0; color: #38bdf8; font-weight: 600; text-decoration: none;">\${user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Role</td>
                    <td style="padding: 8px 0; color: #fbbf24; font-weight: 700; text-transform: uppercase;">\${user.role}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Login Time</td>
                    <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">\${new Date().toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Login Method</td>
                    <td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">Email & Password</td>
                  </tr>
                </table>
              </div>
              <div style="border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b;">
                This is a secure automated notification from Ustaad Identity & Access Management.
              </div>
            </div>
          `;

          await sendEmailViaSES("abrarjamil906@gmail.com", subject, html);
          console.log(`📧 Admin login alert email sent to abrarjamil906@gmail.com for admin: \${user.email}`);
        } catch (emailErr) {
          console.error("❌ Failed to send admin login notification email:", emailErr);
        }
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

  public async forgotPassword(email?: string, phone?: string): Promise<any> {
    try {
      let where: any = {};
      let otpType = OtpType.EMAIL;

      if (email) {
        where.email = email;
        otpType = OtpType.EMAIL;
      } else if (phone) {
        where.phone = phone;
        otpType = OtpType.PHONE;
      } else {
        throw new BadRequestError("Email or phone is required");
      }

      const user = await User.findOne({ where });

      if (!user) {
        throw new NotAuthorizedError("user not registered");
      }
      // Send OTP for password reset
      const otpService = new OtpServices();
      await otpService.sendOtp({
        userId: user.id,
        type: otpType,
        purpose: OtpPurpose.PASSWORD_RESET,
      });
      return { userId: user.id, email: user.email, phone: user.phone };
    } catch (err: any) {
      if (err instanceof NotAuthorizedError || err instanceof BadRequestError) {
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
            attributes: ["id", "email", "phone", "role", "isActive"],
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
      console.error("Error cleaning up expired sessions:", err);
      throw new GenericError(err, "Failed to cleanup expired sessions");
    }
  }

  private async generateCustomUserId(role: UserRole): Promise<string> {
    const prefix = role === UserRole.TUTOR ? "TU-" : "PA-";

    const lastUser = await User.findOne({
      where: {
        userId: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [["userId", "DESC"]],
    });

    let nextNumber = 1;
    if (lastUser && lastUser.userId && lastUser.userId.includes("-")) {
      const lastNumericPart = lastUser.userId.split("-")[1];
      const parsedNumber = parseInt(lastNumericPart, 10);
      if (!isNaN(parsedNumber)) {
        nextNumber = parsedNumber + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  }
}

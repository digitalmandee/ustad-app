import sgMail from '@sendgrid/mail';
import { EmailTemplates, EmailTemplateParams } from './types';
import { templates } from './templates';
import { InternalServerError } from '../../errors/internal-server-error';
import { BadRequestError } from '../../errors/bad-request-error';
import { GenericError } from '../../errors/generic-error';
import { UnProcessableEntityError } from '../../errors/unprocessable-entity.error';
// import { User } from '../../models/user.model';
// import { Otp } from '../../models/otp.model';

import { User, Otp } from "@ustaad/shared";
import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { generateOtp } from '../../helper/generic';
import { IOtpSendDTO, IOtpVerifyDTO } from './otp.dto';
import { addMinutes } from 'date-fns';
import { OtpPurpose, OtpStatus } from '../../constant/enums';
import { Op } from 'sequelize';
import { smsService } from '../sms/sms.service';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL!;

sgMail.setApiKey(SENDGRID_API_KEY);

export class OtpServices {
  /**
   * Sends a raw HTML email
   */
  public async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${to} | Subject: "${subject}"`);
    } catch (error: any) {
      console.error(`❌ Email send failed for ${to}`, {
        subject,
        error: error?.response?.body || error.message || error,
      });

      throw new InternalServerError('Failed to send email [email001]');
    }
  }

  /**
   * Sends an email using predefined templates
   */
  public async sendEmailByTemplate(
    to: string,
    templateName: EmailTemplates,
    params: any
  ): Promise<void> {
    const template = templates[templateName];
    if (!template) {
      throw new BadRequestError(`Email template "${templateName}" not found`);
    }

    const { subject, html } = template(params);
    await this.sendEmail(to, subject, html);
  }

  /**
   * Sends OTP via email or SMS based on the type
   */
  public async sendOtp(dto: IOtpSendDTO) {
    const { userId, type, purpose } = dto;

    try {
      if (type !== 'email' && type !== 'phone') {
        throw new UnProcessableEntityError('Invalid OTP type. Must be email or phone');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotAuthorizedError('User not found');
      }

      // Validate user has the required contact method
      if (type === 'email' && !user.email) {
        throw new NotAuthorizedError('User email not registered');
      }

      if (type === 'phone' && !user.phone) {
        throw new NotAuthorizedError('User phone number not registered');
      }

      const otpCode = '1111'
      // const otpCode = generateOtp(4);
      const expiryDate = addMinutes(new Date(), 10);

      const otpEntry = await Otp.create({
        userId,
        type,
        purpose,
        status: OtpStatus.ACTIVE,
        otp: otpCode,
        expiry: expiryDate,
      });

      // Send OTP based on type
      if (type === 'email') {
        // await this.sendEmailByTemplate(user.email, 'otp', {
        //   name: user.fullName || 'User',
        //   otp: otpCode,
        //   expiryMinutes: 10,
        // });
      } else if (type === 'phone') {
        // Send SMS OTP using VeevoTech service
        const formattedPhone = smsService.formatPhoneNumber(user.phone);
        await smsService.sendOtpSms(formattedPhone, otpCode, 10);
      }

      return { userId: userId, expiry: expiryDate };
    } catch (err: any) {
      if (
        err instanceof UnProcessableEntityError ||
        err instanceof GenericError ||
        err instanceof BadRequestError ||
        err instanceof NotAuthorizedError
      ) {
        throw err;
      }

      throw new GenericError(err, 'Unable to send OTP');
    }
  }

  /**
   * Verifies OTP for email and phone types
   */
  public async verifyOtp(dto: IOtpVerifyDTO) {
    const { userId, otp: enteredOtp, type, purpose } = dto;

    try {
      const now = new Date();

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
        order: [['createdAt', 'DESC']],
      });

      if (!otpEntry) {
        throw new BadRequestError('OTP invalid or expired');
      }

      if (otpEntry.otp !== enteredOtp) {
        throw new BadRequestError('Invalid OTP code');
      }

      const user = await User.findByPk(userId);
      if (!user) throw new BadRequestError('User not found');

      // Update user verification status based on purpose
      if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
        user.isEmailVerified = true;
      }

      if (purpose === OtpPurpose.PHONE_VERIFICATION) {
        user.isPhoneVerified = true;
      }

      // Mark OTP as used
      otpEntry.status = OtpStatus.USED;
      otpEntry.usedAt = now;
      await otpEntry.save();

      await user.save();

      return { success: true, message: 'OTP verified successfully' };
    } catch (err: any) {
      if (
        err instanceof BadRequestError ||
        err instanceof UnProcessableEntityError ||
        err instanceof GenericError
      ) {
        throw err;
      }

      throw new GenericError(err, 'Failed to verify OTP');
    }
  }

  /**
   * Resends OTP for the specified type (email or phone)
   */
  public async resendOtp(dto: IOtpSendDTO) {
    const { userId, type, purpose } = dto;

    try {
      // Invalidate any existing active OTPs for this user and type
      await Otp.update(
        { status: OtpStatus.EXPIRED },
        {
          where: {
            userId,
            type,
            purpose,
            status: OtpStatus.ACTIVE,
          },
        }
      );

      // Send new OTP
      return await this.sendOtp(dto);
    } catch (err: any) {
      if (
        err instanceof UnProcessableEntityError ||
        err instanceof GenericError ||
        err instanceof BadRequestError ||
        err instanceof NotAuthorizedError
      ) {
        throw err;
      }

      throw new GenericError(err, 'Unable to resend OTP');
    }
  }

  /**
   * Checks if SMS service is available
   */
  public isSmsServiceAvailable(): boolean {
    return smsService.isServiceAvailable();
  }
}

export const emailService = new OtpServices();

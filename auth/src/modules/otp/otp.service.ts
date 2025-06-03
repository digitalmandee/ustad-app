import sgMail from '@sendgrid/mail';
import { EmailTemplates, EmailTemplateParams } from './types';
import { templates } from './templates';
import { InternalServerError } from '../../errors/internal-server-error';
import { BadRequestError } from '../../errors/bad-request-error';
import { GenericError } from '../../errors/generic-error';
import { UnProcessableEntityError } from '../../errors/unprocessable-entity.error';
import { User } from '../../models/user.model';
import { Otp } from '../../models/otp.model';
import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { generateOtp } from '../../helper/generic';
import { IOtpSendDTO, IOtpVerifyDTO } from './otp.dto';
import { addMinutes } from 'date-fns';
import { OtpPurpose, OtpStatus } from '../../constant/enums';
import { Op } from 'sequelize';

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

  public async sendEmailByTemplate<T extends EmailTemplates>(
    to: string,
    template: T,
    params: any
  ): Promise<void> {
    const templateFn = templates[template];

    if (!templateFn) {
      throw new BadRequestError(`No template found for type "${template}"`);
    }
    if (!to) {
      throw new BadRequestError(`receipentent email is required`);
    }
    if (!params) {
      throw new BadRequestError(`Sunject/html is required`);
    }

    try {
      const { subject, html } = templateFn(params);
      await this.sendEmail(to, subject, html);
    } catch (error: any) {
      throw new GenericError(error, `Failed to send email template "${template}" [email002]`);
    }
  }

  public async sendOtp(dto: IOtpSendDTO) {
    const { userId, type, purpose } = dto;

    try {
      if (type !== 'email' && type !== 'phone') {
        throw new UnProcessableEntityError('Invalid OTP type');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotAuthorizedError('User not found');
      }

      if (type === 'email' && !user.email) {
        throw new NotAuthorizedError('User email not registered');
      }

      const otpCode = generateOtp(4);
      const expiryDate = addMinutes(new Date(), 10);

      const otpEntry = await Otp.create({
        userId,
        type,
        purpose,
        status: OtpStatus.ACTIVE,
        otp: otpCode,
        expiry: expiryDate,
      });

      if (type === 'email') {
        await this.sendEmailByTemplate(user.email, 'otp', {
          name: user.fullName || 'User',
          otp: otpCode,
          expiryMinutes: 10,
        });
      } else if (type === 'phone') {
        // Implement phone OTP logic (SMS service integration)
        console.log(`📱 Phone OTP sent to userId: ${userId}, code: ${otpCode}`);
      }

      return { otpId: otpEntry.id, expiry: expiryDate };
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

      if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
        user.isEmailVerified = true;
      }

      if (purpose === OtpPurpose.PHONE_VERIFICATION) {
        user.isPhoneVerified = true;
      }

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
}

export const emailService = new OtpServices();

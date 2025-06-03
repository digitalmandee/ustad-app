import { Service } from 'typedi';
import { Otp } from '../../models/Otp';
import { OtpType } from '../../common/enums';
import { User } from './user.model';
import { generateOtp } from '../../helper/generic';
import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { emailService } from '../emails/email.service';
import { sendSms } from '../sms/twilio';
import { Op } from 'sequelize';

@Service()
export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_OTP_ATTEMPTS = 3;

  async generateOtp(user: User, type: OtpType): Promise<Otp> {
    // Invalidate any existing OTPs of the same type
    await Otp.update(
      { isUsed: true },
      {
        where: {
          userId: user.id,
          type,
          isUsed: false,
        },
      }
    );

    const code = generateOtp(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    const otp = await Otp.create({
      userId: user.id,
      type,
      code,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    // Send OTP via email and SMS
    try {
      await emailService.sendEmailByTemplate(user.email, 'otp', { otp: code });
    } catch (emailErr: any) {
      console.error('Failed to send OTP email:', emailErr);
    }

    try {
      await sendSms(
        user.phone,
        `Your verification code is ${code}. It expires in ${this.OTP_EXPIRY_MINUTES} minutes.`
      );
    } catch (smsErr: any) {
      console.error('Failed to send OTP SMS:', smsErr);
    }

    return otp;
  }

  async validateOtp(userId: number, type: OtpType, code: string): Promise<boolean> {
    const otp = await Otp.findOne({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      throw new NotAuthorizedError('Invalid or expired OTP');
    }

    if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new NotAuthorizedError('Maximum OTP attempts exceeded');
    }

    if (otp.code !== code) {
      otp.attempts += 1;
      await otp.save();
      throw new NotAuthorizedError('Invalid OTP');
    }

    otp.isUsed = true;
    await otp.save();

    return true;
  }

  async isOtpBlocked(userId: number, type: OtpType): Promise<boolean> {
    const latestOtp = await Otp.findOne({
      where: {
        userId,
        type,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!latestOtp) {
      return false;
    }

    return latestOtp.attempts >= this.MAX_OTP_ATTEMPTS;
  }
}

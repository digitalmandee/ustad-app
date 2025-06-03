import { EmailTemplateParams } from './types';

export const templates = {
  otp: (params: EmailTemplateParams['otp']) => {
    if (!params?.otp) {
      throw new Error('Missing "otp" in OTP email template params.');
    }

    return {
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>🔐 Your OTP Code</h2>
          <p style="font-size: 20px; margin: 20px 0;"><strong>${params.otp}</strong></p>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn’t request this, please ignore this email.</p>
        </div>
      `,
    };
  },

  passwordReset: (params: EmailTemplateParams['passwordReset']) => {
    if (!params?.resetLink) {
      throw new Error('Missing "resetLink" in passwordReset email template params.');
    }

    return {
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${params.resetLink}" target="_blank">${params.resetLink}</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn’t request a password reset, please ignore this email.</p>
        </div>
      `,
    };
  },

  custom: (params: EmailTemplateParams['custom']) => {
    if (!params?.subject || !params?.html) {
      throw new Error('Missing "subject" or "html" in custom email template params.');
    }

    return {
      subject: params.subject,
      html: params.html,
    };
  },
};

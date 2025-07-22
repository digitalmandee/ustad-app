export type EmailTemplates = 'otp' | 'passwordReset' | 'custom';

export interface EmailTemplateParams {
  otp: { otp: string };
  passwordReset: { resetLink: string };
  custom: { subject: string; html: string };
}

export default {
  /** USER Authentication */
  USER_SIGNUP: '/auth/user-signup',
  USER_SIGNIN: '/auth/user-signin',
  USER_LOGOUT: '/auth/user-logout',
  EMAIL_OTP_Verify: '/auth/user-email_otp_verify',
  RESET_PASSWORD: '/auth/user-reset_password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  GUEST_LOGIN: '/auth/guest-login',
  
  /** Google OAuth */
  GOOGLE_SIGNUP: '/auth/google-signup',
  GOOGLE_LOGIN: '/auth/google-login',
  
  // Social routes
  REPORT_USER: '/user/report',
  BLOCK_USER: '/user/block',
  UNBLOCK_USER: '/user/unblock/:userId',
  GET_BLOCKED_USERS: '/user/blocks',
};

import { Gender, OtpPurpose, UserRole } from "@ustaad/shared";

export interface ISignUpCreateDTO {
  role: UserRole; // optional, default to PARENT in model
  firstName: string;
  lastName: string;
  gender: Gender;
  password?: string; // optional (for Google login users)
  cnic: string; // required, 13 chars (validate in code)
  address: string;
  city: string;
  state: string;
  country: string;
  email: string; // required and unique
  phone: string; // required and unique
}

export interface ISignInCreateDTO {
  password: string; // optional (for Google login users)
  email: string; // required and unique
}

export interface IVerifyEmailOtpDTO {
  userId: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface IGoogleSignupDTO {
  email: string;
  googleId: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  image?: string;
  accessToken?: string;
  role: UserRole;
}

export interface IGoogleLoginDTO {
  email: string;
  googleId: string;
}

import { OtpPurpose, UserRole } from "../../constant/enums";

export interface ISignUpCreateDTO {
  role: UserRole; // optional, default to PARENT in model
  fullName: string;
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

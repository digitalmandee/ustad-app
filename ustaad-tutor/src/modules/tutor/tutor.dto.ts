
import { body } from "express-validator";

import { UserRole } from "@ustaad/shared";


export interface ISignUpCreateDTO {
  role: UserRole;          // optional, default to PARENT in model
  fullName: string;
  password?: string;            // optional (for Google login users)
  cnic: string;                 // required, 13 chars (validate in code)
  address: string;
  city: string;
  state: string;
  country: string;
  email: string;                // required and unique
  phone: string;                // required and unique
}

export interface ISignInCreateDTO {
  password: string;            // optional (for Google login users)
  email: string;                // required and unique
}


export interface IVerifyEmailOtpDTO {
  otp: string;
  email:string
}

export interface ITutorOnboardingDTO {
  userId: string;
  subjects: string[];
  bankName: string;
  accountNumber: string;
}

export interface FindTutorsByLocationDto {
  latitude: number;
  longitude: number;
  radius: number;
  limit?: number;
  offset?: number;
  category?: string; // Subject filter (e.g., "math", "science", etc.)
}




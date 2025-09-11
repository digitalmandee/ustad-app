
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

export interface IParentOnboardingDTO {
  userId: string;
}

export interface ICreatePaymentMethodDTO {
  paymentMethodId: string;
}

export interface IUpdatePaymentMethodDTO {
  isDefault?: boolean;
}

export interface IPaymentMethodResponseDTO {
  id: string;
  parentId: string;
  stripePaymentMethodId: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTutorReviewDTO {
  tutorId: string;
  rating: number;
  review: string;
}




import { OtpPurpose, OtpType } from "@ustaad/shared"


export interface IOtpSendDTO {
  userId:string
  purpose:OtpPurpose
  type:OtpType
}

export interface IOtpVerifyDTO {
  userId: string;
  otp: string;
  type: OtpType;
  purpose: OtpPurpose;
}
import { Request, Response } from "express";
import { OtpServices } from "./otp.service";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import { AuthenticatedRequest } from "../../middlewares/auth";

export default class OtpController {
  private otpService = new OtpServices();

  sendOtp = async (req: Request, res: Response) => {
    try {
      console.log("heeeeeeeeeeeellllllllll");
      let resp = await this.otpService.sendOtp(req.body);
      sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY("OTP"),
        200,
        resp
      );
    } catch (e: any) {
      throw new GenericError(e, ` Error sending otp ${__filename}`);
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      let resp = await this.otpService.verifyOtp(req.body);
      sendSuccessResponse(res, "Otp verified sucessfully", 200, resp);
    } catch (e: any) {
      throw new GenericError(e, ` Error verifying otp ${__filename}`);
    }
  };

  resendOtp = async (req: Request, res: Response) => {
    try {
      let resp = await this.otpService.resendOtp(req.body);
      sendSuccessResponse(res, "OTP resent successfully", 200, resp);
    } catch (e: any) {
      throw new GenericError(e, ` Error resending otp ${__filename}`);
    }
  };

  checkSmsService = async (req: Request, res: Response) => {
    try {
      const isAvailable = this.otpService.isSmsServiceAvailable();
      sendSuccessResponse(res, "SMS service status checked", 200, {
        smsServiceAvailable: isAvailable,
      });
    } catch (e: any) {
      throw new GenericError(e, ` Error checking SMS service ${__filename}`);
    }
  };
}

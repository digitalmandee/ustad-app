import { Request, Response } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import TutorService from "./tutor.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { User } from "../../models/User";
import { IsOnBaord } from "../../constant/enums";

export default class TutorController {
  private tutorService: TutorService;

  constructor() {
    this.tutorService = new TutorService();
  }

  onboardTutor = async (req: AuthenticatedRequest, res: Response) => {
    try {
      let subjects = req.body.subjects;
      const { id: userId } = req.user;
      const { bankName, accountNumber } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files?.resume || !files?.idFront || !files?.idBack) {
        return sendErrorResponse(
          res,
          "All required files must be uploaded",
          400
        );
      }

      const result = await this.tutorService.createTutorProfile({
        userId,
        subjects,
        bankName,
        accountNumber,
        resume: files.resume[0],
        idFront: files.idFront[0],
        idBack: files.idBack[0],
      });

      await User.update(
        { isOnBoard: IsOnBaord.PENDING },
        { where: { id: userId } }
      );

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY("Tutor Profile"),
        201,
        result
      );
    } catch (error: any) {
      console.error("Tutor onboarding error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while creating tutor profile";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  editProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { fullName, email, phone, password } = req.body;

      const result = await this.tutorService.updateProfile(userId, {
        fullName,
        email,
        phone,
        password,
      });

      return sendSuccessResponse(
        res,
        "Profile updated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Profile update error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while updating profile";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const result = await this.tutorService.getProfile(userId);

      return sendSuccessResponse(
        res,
        "Profile retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get profile error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while retrieving profile";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };
}

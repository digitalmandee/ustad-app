import { Request, Response } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import TutorService from "./parent.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
// import { User } from "../../models/User";
import { IsOnBaord, OfferStatus } from "../../constant/enums";

import { User } from "@ustaad/shared";

export default class TutorController {
  private tutorService: TutorService;

  constructor() {
    this.tutorService = new TutorService();
  }

  onboardParent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files?.idFront || !files?.idBack) {
        return sendErrorResponse(
          res,
          "All required files must be uploaded",
          400
        );
      }

      const result = await this.tutorService.createParentProfile({
        userId,
        idFront: files.idFront[0],
        idBack: files.idBack[0],
      });

      await User.update(
        { isOnBoard: IsOnBaord.PENDING },
        { where: { id: userId } }
      );

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY("Parent Profile"),
        201,
        result
      );
    } catch (error: any) {
      console.error("Parent onboarding error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while creating parent profile";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  editProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { fullName, email, phone, password, image } = req.body;

      const result = await this.tutorService.updateProfile(userId, {
        fullName,
        email,
        phone,
        password,
        image,
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

      const errorMessage =
        error?.message || "Something went wrong while retrieving profile";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  updateCustomerId = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { customerId } = req.body;

      const result = await this.tutorService.updateCustomerId(
        userId,
        customerId
      );

      return sendSuccessResponse(
        res,
        "Customer ID updated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Update customer ID error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while updating customer ID";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  createPaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { paymentMethodId } = req.body;

      const result = await this.tutorService.createPaymentMethod(
        userId,
        paymentMethodId
      );

      return sendSuccessResponse(
        res,
        "Payment method added successfully",
        201,
        result
      );
    } catch (error: any) {
      console.error("Create payment method error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while adding payment method";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      const result = await this.tutorService.getPaymentMethods(userId);

      return sendSuccessResponse(
        res,
        "Payment methods retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get payment methods error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message ||
        "Something went wrong while retrieving payment methods";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  updatePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { isDefault, paymentMethodId } = req.body;

      const result = await this.tutorService.updatePaymentMethod(
        userId,
        paymentMethodId,
        isDefault
      );

      return sendSuccessResponse(
        res,
        "Payment method updated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Update payment method error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while updating payment method";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  deletePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { paymentMethodId } = req.body;

      const result = await this.tutorService.deletePaymentMethod(
        userId,
        paymentMethodId
      );

      return sendSuccessResponse(
        res,
        "Payment method deleted successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Delete payment method error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while deleting payment method";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };
  getTutorProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tutorId } = req.params;

      const result = await this.tutorService.getTutorProfile(tutorId);

      return sendSuccessResponse(
        res,
        "Tutor profile retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get tutor profile error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving tutor profile";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };
  updateOffer = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, offerId } = req.params;
      if (!status || status === undefined) {
        return sendErrorResponse(res, " offer status is required", 400);
      }
      if (!offerId || offerId === undefined) {
        return sendErrorResponse(res, "Offer ID is required", 400);
      }
      const result = await this.tutorService.updateOffer(offerId, status);

      return sendSuccessResponse(
        res,
        "Offer updated successfully",
        200,
        result
      );
    } catch (error: any) {
      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while updating offer";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };
}

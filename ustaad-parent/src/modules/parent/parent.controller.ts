import { Request, Response } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import ParentService from "./parent.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
// import { User } from "../../models/User";
import { IsOnBaord, OfferStatus } from "@ustaad/shared";
import Stripe from "stripe";

import { User, ParentSubscriptionStatus } from "@ustaad/shared";

export default class ParentController {
  private parentService: ParentService;
  private stripeWebhookSecret: string;

  constructor() {
    this.parentService = new ParentService();
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
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

      const result = await this.parentService.createParentProfile({
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

      const result = await this.parentService.updateProfile(userId, {
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
      const result = await this.parentService.getProfile(userId);

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

      const result = await this.parentService.updateCustomerId(
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


  getPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      const result = await this.parentService.getPaymentMethods(userId);

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

  getTutorProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tutorId } = req.params;

      const result = await this.parentService.getTutorProfile(tutorId);

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
      const { id: userId } = req.user;
      const { status, offerId } = req.params;
      if (!status || status === undefined) {
        return sendErrorResponse(res, " offer status is required", 400);
      }
      if (!offerId || offerId === undefined) {
        return sendErrorResponse(res, "Offer ID is required", 400);
      }
      const result = await this.parentService.updateOffer(
        offerId,
        status,
        userId
      );

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


  cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        return sendErrorResponse(res, "Subscription ID is required", 400);
      }

      const result = await this.parentService.cancelSubscription(
        userId,
        subscriptionId
      );

      return sendSuccessResponse(
        res,
        "Subscription cancelled successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Cancel subscription error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while cancelling subscription";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getAllSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      const result = await this.parentService.getAllSubscriptions(userId);

      return sendSuccessResponse(
        res,
        "Subscriptions retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get subscriptions error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving subscriptions";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  // createTutorReview = async (req: AuthenticatedRequest, res: Response) => {
  //   try {
  //     const { id: parentId } = req.user;
  //     const { tutorId, rating, review } = req.body;

  //     // Validate rating range
  //     if (rating < 1 || rating > 5) {
  //       return sendErrorResponse(res, "Rating must be between 1 and 5", 400);
  //     }

  //     const result = await this.parentService.createTutorReview(
  //       parentId,
  //       tutorId,
  //       rating,
  //       review
  //     );

  //     return sendSuccessResponse(
  //       res,
  //       "Tutor review created successfully",
  //       201,
  //       result
  //     );
  //   } catch (error: any) {
  //     console.error("Create tutor review error:", error);

  //     if (error instanceof GenericError) {
  //       return sendErrorResponse(res, error.message, 400);
  //     }

  //     const errorMessage =
  //       error?.message || "Something went wrong while creating review";
  //     return sendErrorResponse(res, errorMessage, 400);
  //   }
  // };

  getMonthlySpending = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: parentId } = req.user;
      const spending = await this.parentService.getMonthlySpending(parentId);
      return sendSuccessResponse(
        res, 
        "Monthly spending retrieved successfully", 
        200, 
        spending
      );
    } catch (error: any) {
      console.error('Get monthly spending error:', error);
      throw new GenericError(error, `Error from getMonthlySpending ${__filename}`);
    }
  };

  terminateContract = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: parentId } = req.user;
      const { contractId } = req.params;
      const { status, reason } = req.body;

      // Validate status
      if (!status || ![ParentSubscriptionStatus.DISPUTE, ParentSubscriptionStatus.PENDING_COMPLETION].includes(status as any)) {
        return sendErrorResponse(res, "Status must be either 'dispute' or 'completed'", 400);
      }

      // Validate reason only if status is dispute
      if (status === ParentSubscriptionStatus.DISPUTE && (!reason || reason.trim().length === 0)) {
        return sendErrorResponse(res, "Cancellation reason is required for dispute", 400);
      }

      const result = await this.parentService.terminateContract(
        parentId,
        contractId,
        status,
        reason
      );

      const successMessage = status === ParentSubscriptionStatus.DISPUTE 
        ? "Contract terminated and forwarded to admin"
        : "Contract marked as completed";

      return sendSuccessResponse(
        res,
        successMessage,
        200,
        result
      );
    } catch (error: any) {
      console.error("Terminate contract error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Failed to terminate contract";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  submitContractRating = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: parentId } = req.user;
      const { contractId } = req.params;
      const { rating, review } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return sendErrorResponse(res, "Rating must be between 1 and 5", 400);
      }

      const result = await this.parentService.submitContractRating(
        parentId,
        contractId,
        rating,
        review || ''
      );

      return sendSuccessResponse(
        res,
        result.message,
        200,
        result
      );
    } catch (error: any) {
      console.error("Submit contract rating error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Failed to submit rating";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getActiveContractsForDispute = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: parentId } = req.user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.parentService.getActiveContractsForDispute(
        parentId,
        page,
        limit
      );

      return sendSuccessResponse(
        res,
        "Active contracts retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get active contracts error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Failed to retrieve active contracts";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  // ==================== PayFast Payment Methods ====================

  /**
   * Initiate PayFast subscription payment
   */
  initiatePayFastSubscription = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { id: userId } = req.user;
      const { offerId } = req.body;

      if (!offerId) {
        return sendErrorResponse(res, "planId is required", 400);
      }

      const result = await this.parentService.initiatePayFastSubscription({
        userId,
        offerId
      });

      return sendSuccessResponse(
        res,
        "PayFast subscription initiated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Initiate PayFast subscription error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while initiating PayFast subscription";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  /**
   * Handle PayFast IPN (Instant Payment Notification)
   */
  handlePayFastIPN = async (req: Request, res: Response): Promise<void> => {
    try {
      // PayFast sends data as form-urlencoded
      const ipnData = req.body;


      console.log("ipnData", ipnData);

      // Always return 200 OK immediately to prevent PayFast retries
      res.status(200).send("OK");

      // Process IPN asynchronously
      setImmediate(async () => {
        try {
          await this.parentService.handlePayFastIPN(ipnData);
        } catch (error) {
          console.error("Error processing PayFast IPN:", error);
        }
      });
    } catch (error: any) {
      console.error("PayFast IPN handler error:", error);
      // Still return 200 OK even on error to prevent retries
      res.status(200).send("OK");
    }
  };

  /**
   * Get subscription status by basket ID
   */
  getSubscriptionStatus = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { basketId } = req.query;

      if (!basketId || typeof basketId !== "string") {
        return sendErrorResponse(res, "basketId is required", 400);
      }

      const result = await this.parentService.getSubscriptionStatusByBasketId(
        basketId
      );

      return sendSuccessResponse(
        res,
        "Subscription status retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get subscription status error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving subscription status";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  /**
   * Manually trigger recurring charge for a subscription
   */
  chargeRecurringSubscription = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { subscriptionId } = req.body;

      if (!subscriptionId) {
        return sendErrorResponse(res, "subscriptionId is required", 400);
      }

      const result = await this.parentService.chargeRecurringSubscription(
        subscriptionId
      );

      return sendSuccessResponse(
        res,
        "Recurring charge initiated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Charge recurring subscription error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while charging subscription";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  /**
   * Get lists of instruments for a user
   */
  getListsOfInstruments = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { id: userId } = req.user;

      const result = await this.parentService.getListsOfInstruments(userId);

      return sendSuccessResponse(
        res,
        "Instruments retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get lists of instruments error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving instruments";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  /**
   * Recurring Transaction OTP
   */
  recurringTransactionOTP = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { id: userId } = req.user;
      const {
        instrumentToken,
        basketId,
        orderDate,
        txnamt,
        cvv,
        currencyCode,
        data3dsCallbackUrl,
        checkoutUrl,
      } = req.body;

      if (!instrumentToken || !basketId || !orderDate || !txnamt || !cvv) {
        return sendErrorResponse(
          res,
          "instrumentToken, basketId, orderDate, txnamt, and cvv are required",
          400
        );
      }

      const result = await this.parentService.recurringTransactionOTP(userId, {
        instrumentToken,
        basketId,
        orderDate,
        txnamt,
        cvv,
        currencyCode,
        data3dsCallbackUrl,
        checkoutUrl,
      });

      return sendSuccessResponse(
        res,
        "Recurring transaction OTP initiated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Recurring transaction OTP error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while initiating recurring transaction OTP";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  /**
   * Initiate Recurring Payment
   */
  initiateRecurringPayment = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { id: userId } = req.user;
      const {
        instrumentToken,
        basketId,
        orderDate,
        txndesc,
        txnamt,
        cvv,
        transactionId,
        currencyCode,
        otp,
        data3dsSecureId,
        data3dsPares,
        checkoutUrl,
      } = req.body;

      if (!instrumentToken || !basketId || !orderDate || !txndesc || !txnamt || !cvv) {
        return sendErrorResponse(
          res,
          "instrumentToken, basketId, orderDate, txndesc, txnamt, and cvv are required",
          400
        );
      }

      const result = await this.parentService.initiateRecurringPayment(userId, {
        instrumentToken,
        basketId,
        orderDate,
        txndesc,
        txnamt,
        cvv,
        transactionId,
        currencyCode,
        otp,
        data3dsSecureId,
        data3dsPares,
        checkoutUrl,
      });

      return sendSuccessResponse(
        res,
        "Recurring payment initiated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Initiate recurring payment error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while initiating recurring payment";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  /**
   * Handle PayFast Success Callback
   */
  handlePayFastSuccess = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      // Get all query parameters
      const queryParams = req.query as any;

      const result = await this.parentService.handlePayFastSuccess(queryParams);

      // Return JSON response (you can also redirect to frontend if needed)
      return sendSuccessResponse(
        res,
        result.message || "Payment processed successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Handle PayFast success error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while processing payment success";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };
}

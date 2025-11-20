import { Request, Response, NextFunction } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import AdminService from "./admin.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export default class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  getStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const days = req.query.days ? Number(req.query.days) : undefined;
      
      // Validate days parameter if provided
      if (days && ![7, 30, 90].includes(days)) {
        return sendErrorResponse(res, "Days parameter must be 7, 30, or 90", 400);
      }
      
      const stats = await this.adminService.getStats(days);
      sendSuccessResponse(res, "stats fetched successfully", 200, stats);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getStats ${__filename}`);
    }
  };

  getAllParents = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const data = await this.adminService.getAllParents(page, limit);
      sendSuccessResponse(res, "parents fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getAllParents ${__filename}`);
    }
  };

  getParentById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await this.adminService.getParentById(id);
      if (!data) {
        return sendSuccessResponse(res, "parent not found", 404, null);
      }
      sendSuccessResponse(res, "parent fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getParentById ${__filename}`);
    }
  };

  getAllTutors = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const data = await this.adminService.getAllTutors(page, limit);
      sendSuccessResponse(res, "tutors fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getAllTutors ${__filename}`);
    }
  };

  getTutorById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await this.adminService.getTutorById(id);
      if (!data) {
        return sendSuccessResponse(res, "tutor not found", 404, null);
      }
      sendSuccessResponse(res, "tutor fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getTutorById ${__filename}`);
    }
  };

  getAllPaymentRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.adminService.getAllPaymentRequests();
      sendSuccessResponse(res, "payment requests fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getAllPaymentRequests ${__filename}`);
    }
  };

  getPaymentRequestById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await this.adminService.getPaymentRequestById(id);
      sendSuccessResponse(res, "payment request fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getPaymentRequestById ${__filename}`);
    }
  };

  updatePaymentRequestStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, status } = req.body;
      const data = await this.adminService.updatePaymentRequestStatus(id, status);
      sendSuccessResponse(res, "payment request status updated successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from updatePaymentRequestStatus ${__filename}`);
    }
  };

  createAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fullName, email, password } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !password) {
        return sendErrorResponse(res, "Full name, email, and password are required", 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendErrorResponse(res, "Invalid email format", 400);
      }

      // Validate password strength
      if (password.length < 6) {
        return sendErrorResponse(res, "Password must be at least 6 characters long", 400);
      }

      const adminUser = await this.adminService.createAdmin({
        fullName,
        email,
        password
      });

      sendSuccessResponse(res, "Admin user created successfully", 201, adminUser);
    } catch (e: any) {
      if (e.message === 'User with this email already exists') {
        return sendErrorResponse(res, e.message, 409);
      }
      throw new GenericError(e, ` Error from createAdmin ${__filename}`);
    }
  };

  getAllAdmins = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      
      const data = await this.adminService.getAllAdmins(page, limit);
      sendSuccessResponse(res, "Admins fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getAllAdmins ${__filename}`);
    }
  };

  deleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.body;
      const data = await this.adminService.deleteAdmin(id);
      sendSuccessResponse(res, "Admin deleted successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from deleteAdmin ${__filename}`);
    }
  };

  getPendingOnboardUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      
      const data = await this.adminService.getPendingOnboardUsers(page, limit);
      sendSuccessResponse(res, "Pending onboard tutors fetched successfully", 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from getPendingOnboardUsers ${__filename}`);
    }
  };

  approveOnboarding = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.body;

      // Validate required field
      if (!userId) {
        return sendErrorResponse(res, "User ID is required", 400);
      }

      // Validate userId format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return sendErrorResponse(res, "Invalid user ID format", 400);
      }

      const data = await this.adminService.approveOnboarding(userId);
      sendSuccessResponse(res, "User onboarding approved successfully", 200, data);
    } catch (e: any) {
      if (e.message === 'User not found') {
        return sendErrorResponse(res, e.message, 404);
      }
      if (e.message === 'Cannot approve deleted user' || e.message === 'User is already approved') {
        return sendErrorResponse(res, e.message, 409);
      }
      throw new GenericError(e, ` Error from approveOnboarding ${__filename}`);
    }
  };

  getDisputedContracts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await this.adminService.getDisputedContracts(page, limit);
      
      return sendSuccessResponse(
        res,
        "Disputed contracts retrieved successfully",
        200,
        result
      );
    } catch (e: any) {
      throw new GenericError(e, ` Error from getDisputedContracts ${__filename}`);
    }
  };

  resolveDispute = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contractId } = req.params;
      const { finalStatus, adminNotes } = req.body;

      if (!finalStatus || !['cancelled', 'active', 'completed'].includes(finalStatus)) {
        return sendErrorResponse(res, "Invalid final status. Must be one of: cancelled, active, completed", 400);
      }

      const result = await this.adminService.resolveDispute(
        contractId,
        finalStatus,
        adminNotes
      );

      return sendSuccessResponse(
        res,
        "Dispute resolved successfully",
        200,
        result
      );
    } catch (e: any) {
      if (e.message === 'Contract not found') {
        return sendErrorResponse(res, e.message, 404);
      }
      if (e.message === 'Contract is not in dispute status') {
        return sendErrorResponse(res, e.message, 400);
      }
      throw new GenericError(e, ` Error from resolveDispute ${__filename}`);
    }
  };
  
}

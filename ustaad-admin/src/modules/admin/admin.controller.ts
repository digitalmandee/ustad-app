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
  
}

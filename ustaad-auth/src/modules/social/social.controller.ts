import { Response } from "express";
import { socialService } from "./social.service";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse } from "../../helper/response";
import { AuthenticatedRequest } from "../../middlewares/auth";

export default class SocialController {
  reportUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reporterId = req.user.id;
      const report = await socialService.reportUser(reporterId, req.body);
      sendSuccessResponse(res, "User reported successfully", 201, report);
    } catch (e: any) {
      if (e instanceof GenericError) throw e;
      throw new GenericError(e, `Error in reportUser: ${e.message}`);
    }
  };

  blockUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const blockerId = req.user.id;
      const block = await socialService.blockUser(blockerId, req.body);
      sendSuccessResponse(res, "User blocked successfully", 201, block);
    } catch (e: any) {
      if (e instanceof GenericError) throw e;
      throw new GenericError(e, `Error in blockUser: ${e.message}`);
    }
  };

  unblockUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const blockerId = req.user.id;
      const userId = req.params.userId as string;
      const result = await socialService.unblockUser(blockerId, userId);
      sendSuccessResponse(res, "User unblocked successfully", 200, result);
    } catch (e: any) {
      if (e instanceof GenericError) throw e;
      throw new GenericError(e, `Error in unblockUser: ${e.message}`);
    }
  };

  getBlockedUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const blockerId = req.user.id;
      const blockedUsers = await socialService.getBlockedUsers(blockerId);
      sendSuccessResponse(res, "Blocked users fetched successfully", 200, blockedUsers);
    } catch (e: any) {
      if (e instanceof GenericError) throw e;
      throw new GenericError(e, `Error in getBlockedUsers: ${e.message}`);
    }
  };
}

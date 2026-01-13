import { Request, Response, NextFunction } from "express";
import { ChildService } from "./child.service";
import { CreateChildDto, UpdateChildDto, DeleteChildDto } from "./child.dto";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { ChildNotes } from "@ustaad/shared";

export class ChildController {
  private childService: ChildService;

  constructor() {
    this.childService = new ChildService();
  }

  createChild = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const data = req.body as CreateChildDto;
      const userId = req.user.id;
      const child = await this.childService.createChild(data, userId, req.file);

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY("Child"),
        201,
        child
      );
    } catch (error: any) {
      console.error("Create child error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while creating child";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  updateChild = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const data = req.body as UpdateChildDto;
      const userId = req.user.id;
      const child = await this.childService.updateChild(data, userId, req.file);

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_UPDATED_SUCCESSFULLY("Child", child.id),
        200,
        child
      );
    } catch (error: any) {
      console.error("Update child error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while updating child";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  deleteChild = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log("data", id);

      await this.childService.deleteChild(id, userId);

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_DELETE_SUCCESSFULLY("Child", id),
        200
      );
    } catch (error: any) {
      console.error("Delete child error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while deleting child";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getChildren = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user.id;
      const children = await this.childService.getChildren(userId);

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_GET_SUCCESSFULLY("Children"),
        200,
        children
      );
    } catch (error: any) {
      console.error("Get children error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving children";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getChild = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const child = await this.childService.getChild(id, userId);

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_GET_SUCCESSFULLY("Child"),
        200,
        child
      );
    } catch (error: any) {
      console.error("Get child error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving child";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  async getChildNotesByChildId(req: AuthenticatedRequest, res: Response) {
    try {
      const { childName } = req.params;
      // const notes = await this.childService.getChildNotesByChildId(childName);
      const notes = await ChildNotes.findAll({ where: { childName } });

      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_GET_SUCCESSFULLY("Child Notes"),
        200,
        notes
      );
    } catch (error: any) {
      console.error("Get Notes error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage =
        error?.message || "Something went wrong while retrieving child";
      return sendErrorResponse(res, errorMessage, 400);
    }
  }
}

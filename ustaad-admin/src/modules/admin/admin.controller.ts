import { Request, Response, NextFunction } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
  import AdminService from "./admin.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
// import { User } from "../../models/User";
import { IsOnBaord } from "../../constant/enums";
import { User } from "@ustaad/shared";
import { FindTutorsByLocationDto } from "./admin.dto";

export default class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }


}

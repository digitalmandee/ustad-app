import { Request, Response, NextFunction } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import TutorService from "./tutor.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
// import { User } from "../../models/User";
import { IsOnBaord } from "@ustaad/shared";
import { User } from "@ustaad/shared";
import { FindTutorsByLocationDto } from "./tutor.dto";

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
      const { fullName, email, phone, password, image } = req.body;

      const result = await this.tutorService.updateProfile(userId, {
        fullName,
        email,
        phone,
        password,
        image
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

  addExperience = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      console.log(userId);
      
      const { company, startDate, endDate, description } = req.body;

      const result = await this.tutorService.addExperience(userId, {
        company,
        startDate,
        endDate,
        description,
      });

      return sendSuccessResponse(
        res,
        "Experience added successfully",
        201,
        result
      );
    } catch (error: any) {
      console.error("Add experience error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while adding experience";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };
  allExperience = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
  

      const result = await this.tutorService.allExperience(userId);

      return sendSuccessResponse(
        res,
        "Experience added successfully",
        201,
        result
      );
    } catch (error: any) {
      console.error("Add experience error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while adding experience";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  updateExperience = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { experienceId } = req.params;
      const { company, startDate, endDate, description } = req.body;

      const result = await this.tutorService.updateExperience(userId, experienceId, {
        company,
        startDate,
        endDate,
        description,
      });

      return sendSuccessResponse(
        res,
        "Experience updated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Update experience error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while updating experience";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  deleteExperience = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { experienceId } = req.params;

      await this.tutorService.deleteExperience(userId, experienceId);

      return sendSuccessResponse(
        res,
        "Experience deleted successfully",
        200
      );
    } catch (error: any) {
      console.error("Delete experience error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while deleting experience";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  addEducation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { institute, startDate, endDate, description } = req.body;

      const result = await this.tutorService.addEducation(userId, {
        institute,
        startDate,
        endDate,
        description,
      });

      return sendSuccessResponse(
        res,
        "Education added successfully",
        201,
        result
      );
    } catch (error: any) {
      console.error("Add education error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while adding education";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  allEducation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      const result = await this.tutorService.allEducation(userId);

      return sendSuccessResponse(
        res,
        "Education retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get education error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while retrieving education";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  updateEducation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { educationId } = req.params;
      const { institute, startDate, endDate, description } = req.body;

      const result = await this.tutorService.updateEducation(userId, educationId, {
        institute,
        startDate,
        endDate,
        description,
      });

      return sendSuccessResponse(
        res,
        "Education updated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Update education error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while updating education";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  deleteEducation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { educationId } = req.params;

      await this.tutorService.deleteEducation(userId, educationId);

      return sendSuccessResponse(
        res,
        "Education deleted successfully",
        200
      );
    } catch (error: any) {
      console.error("Delete education error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while deleting education";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  addAbout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { about, grade } = req.body;

      const result = await this.tutorService.addAbout(userId, about, grade);

      return sendSuccessResponse(
        res,
        "About information added successfully",
        201,
        result
      );
    } catch (error: any) {
      console.error("Add about error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while adding about information";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  editAbout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { about } = req.body;

      const result = await this.tutorService.editAbout(userId, about);

      return sendSuccessResponse(
        res,
        "About information updated successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Edit about error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while updating about information";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  setTutorSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { minSubjects, maxStudentsDaily, subjectCosts } = req.body;
      const tutor = await this.tutorService.getTutorByUserId(userId);
      if (!tutor) {
        return sendErrorResponse(res, "Tutor not found", 404);
      }
      const result = await this.tutorService.setTutorSettings(userId, { minSubjects, maxStudentsDaily, subjectCosts });
      return sendSuccessResponse(res, "Tutor settings saved successfully", 201, result);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to save tutor settings", 400);
    }
  };

  getTutorSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const tutor = await this.tutorService.getTutorByUserId(userId);
      if (!tutor) {
        return sendErrorResponse(res, "Tutor not found", 404);
      }
      const result = await this.tutorService.getTutorSettings(userId);
      return sendSuccessResponse(res, "Tutor settings fetched successfully", 200, result);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to fetch tutor settings", 400);
    }
  };

  updateTutorSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { minSubjects, maxStudentsDaily, subjectCosts } = req.body;
      const tutor = await this.tutorService.getTutorByUserId(userId);
      if (!tutor) {
        return sendErrorResponse(res, "Tutor not found", 404);
      }
      const result = await this.tutorService.updateTutorSettings(userId, { minSubjects, maxStudentsDaily, subjectCosts });
      return sendSuccessResponse(res, "Tutor settings updated successfully", 200, result);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to update tutor settings", 400);
    }
  };

  addChildNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: tutorId } = req.user;
      const { sessionId, headline, description } = req.body;
      const note = await this.tutorService.createChildNote({ sessionId, tutorId, headline, description });
      return sendSuccessResponse(res, "Child note added successfully", 200, note);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to add child note", 400);
    }
  };
  
  addChildReview = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: tutorId } = req.user;
      const { childId, rating, review } = req.body;
      const reviewObj = await this.tutorService.createChildReview({ childId, tutorId, rating, review });
      return sendSuccessResponse(res, "Child review added successfully", 200, reviewObj);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to add child review", 400);
    }
  };

  addTutorLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const locationData = req.body;
  
      const location = await this.tutorService.addTutorLocation(userId, locationData);
  
      sendSuccessResponse(res,InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY("Tutor Location"),201,location);
    } catch (e: any) {
      throw new GenericError(e, `Error from addTutorLocation ${__filename}`);
    }
  };

    findTutorsByLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { latitude, longitude, radius, limit = 20, offset = 0, category } = req.query as unknown as FindTutorsByLocationDto;
      const results = await this.tutorService.findTutorsByLocation(latitude, longitude, radius, limit, offset, category);

      return sendSuccessResponse(res, InfoMessages.GENERIC.ITEM_GET_SUCCESSFULLY("Nearby Tutors"), 200, results);
    } catch (e: any) {
      throw new GenericError(e, `Error from findTutorsByLocation ${__filename}`);
    }
  };

  getAllTutorLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const locations = await this.tutorService.getAllTutorLocations(userId);
      
      return sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_GET_SUCCESSFULLY("Tutor Locations"),
        200,
        locations
      );
    } catch (e: any) {
      throw new GenericError(e, `Error from getAllTutorLocations ${__filename}`);
    }
  };

  deleteTutorLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { locationId } = req.query as any;

      console.log("locationId", locationId);
      
      const result = await this.tutorService.deleteTutorLocation(userId, locationId);
      
      return sendSuccessResponse(
        res,
        "Location deleted successfully",
        200,
        result
      );
    } catch (e: any) {
      throw new GenericError(e, `Error from deleteTutorLocation ${__filename}`);
    }
  };

  // Payment Request Methods
  createPaymentRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { amount, txnId } = req.body;

      if (!amount || amount <= 0) {
        return sendErrorResponse(
          res,
          "Valid amount is required",
          400
        );
      }

      // Get tutor by userId
      const tutor = await this.tutorService.getTutorByUserId(userId);
      if (!tutor) {
        return sendErrorResponse(
          res,
          "Tutor profile not found",
          404
        );
      }

      const result = await this.tutorService.createPaymentRequest({
        tutorId: tutor.id,
        amount: parseFloat(amount),
        txnId: txnId,
      });

      return sendSuccessResponse(
        res,
        "Payment request created successfully",
        201,
        result
      );
    } catch (error: any) {
      console.error("Create payment request error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while creating payment request";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getPaymentRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;

      // Get tutor by userId
      const tutor = await this.tutorService.getTutorByUserId(userId);
      if (!tutor) {
        return sendErrorResponse(
          res,
          "Tutor profile not found",
          404
        );
      }

      const result = await this.tutorService.getPaymentRequests(tutor.id);

      return sendSuccessResponse(
        res,
        "Payment requests retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error("Get payment requests error:", error);

      if (error instanceof GenericError) {
        return sendErrorResponse(res, error.message, 400);
      }

      const errorMessage = error?.message || "Something went wrong while retrieving payment requests";
      return sendErrorResponse(res, errorMessage, 400);
    }
  };

  getTutorSessions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId, role } = req.user;
      const sessions = await this.tutorService.getTutorSessions(userId, role as any);
      return sendSuccessResponse(res, "Tutor sessions retrieved successfully", 200, sessions);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to retrieve tutor sessions", 400);
    }
  };


  getTutorSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId, role } = req.user;
      const { sessionId } = req.query as any;
      const session = await this.tutorService.getTutorSession(userId, sessionId, role as any);
      return sendSuccessResponse(res, "Tutor session retrieved successfully", 200, session);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to retrieve tutor session", 400);
    }
  };

  addTutorSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const session = await this.tutorService.addTutorSession(userId, req.body);
      return sendSuccessResponse(res, "Tutor session added successfully", 200, session);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to add tutor session", 400);
    }
  };

  deleteTutorSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { sessionId } = req.params;
      await this.tutorService.deleteTutorSession(userId, sessionId);
      return sendSuccessResponse(res, "Tutor session deleted successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to delete tutor session", 400);
    }
  };

  editTutorSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const session = await this.tutorService.editTutorSession(req.body);
      return sendSuccessResponse(res, "Tutor session updated successfully", 200, session);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to update tutor session", 400);
    }
  };

  getMonthlyEarnings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: tutorId } = req.user;
      const earnings = await this.tutorService.getMonthlyEarnings(tutorId);
      return sendSuccessResponse(
        res, 
        "Monthly earnings retrieved successfully", 
        200, 
        earnings
      );
    } catch (error: any) {
      console.error('Get monthly earnings error:', error);
      throw new GenericError(error, `Error from getMonthlyEarnings ${__filename}`);
    }
  };

  createHelpRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: requesterId, role } = req.user;
      const { subject, message, againstId } = req.body;

      const helpRequest = await this.tutorService.createHelpRequest(
        requesterId,
        role as any,
        subject,
        message,
        againstId
      );

      return sendSuccessResponse(
        res,
        "Help request created successfully",
        201,
        helpRequest
      );
    } catch (error: any) {
      console.error('Create help request error:', error);
      
      if (error.message?.includes('Invalid')) {
        return sendErrorResponse(res, error.message, 400);
      }
      
      throw new GenericError(error, `Error from createHelpRequest ${__filename}`);
    }
  };

  getHelpRequestsAgainstMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.tutorService.getHelpRequestsAgainstUser(userId, page, limit);

      return sendSuccessResponse(
        res,
        "Help requests retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error('Get help requests error:', error);
      throw new GenericError(error, `Error from getHelpRequestsAgainstMe ${__filename}`);
    }
  };

  getContracts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId, role } = req.user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.tutorService.getContracts(userId, role as any, page, limit);

      return sendSuccessResponse(
        res,
        "Contracts retrieved successfully",
        200,
        result
      );
    } catch (error: any) {
      console.error('Get contracts error:', error);
      throw new GenericError(error, `Error from getContracts ${__filename}`);
    }
  };



  getNotificationHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const notifications = await this.tutorService.getNotificationHistory(userId);
      return sendSuccessResponse(res, "Notification history retrieved successfully", 200, notifications);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to retrieve notification history", 400);
    }
  };

  markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: userId } = req.user;
      const { notificationId } = req.params;
      await this.tutorService.markNotificationAsRead(userId, notificationId);
      return sendSuccessResponse(res, "Notification marked as read successfully", 200);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to mark notification as read", 400);
    }
  };

  cancelContract = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: tutorId } = req.user;
      const { contractId } = req.params;

      const updatedContract = await this.tutorService.cancelContract(tutorId, contractId);

      return sendSuccessResponse(
        res,
        "Contract cancelled successfully",
        200,
        updatedContract
      );
    } catch (error: any) {
      console.error('Cancel contract error:', error);
      
      if (error.message?.includes('not found') || error.message?.includes('permission')) {
        return sendErrorResponse(res, error.message, 404);
      }
      
      if (error.message?.includes('already cancelled')) {
        return sendErrorResponse(res, error.message, 400);
      }
      
      throw new GenericError(error, `Error from cancelContract ${__filename}`);
    }
  };

  createHelpRequestAgainstContract = async (req: AuthenticatedRequest, res: Response) => {
    try {

      
      const { id: tutorId, role } = req.user;
      const { contractId } = req.params;
      const { subject, message } = req.body;

      const result = await this.tutorService.createHelpRequestAgainstContract(
        tutorId,
        role as any,
        contractId,
        subject,
        message
      );

      return sendSuccessResponse(
        res,
        "Help request created successfully against contract",
        201,
        result
      );
    } catch (error: any) {
      console.error('Create help request against contract error:', error);
      
      if (error.message?.includes('not found') || error.message?.includes('permission')) {
        return sendErrorResponse(res, error.message, 404);
      }
      
      throw new GenericError(error, `Error from createHelpRequestAgainstContract ${__filename}`);
    }
  };
}

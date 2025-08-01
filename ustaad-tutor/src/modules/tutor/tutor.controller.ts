import { Request, Response, NextFunction } from "express";
import { GenericError } from "../../errors/generic-error";
import { sendSuccessResponse, sendErrorResponse } from "../../helper/response";
import InfoMessages from "../../constant/messages";
import TutorService from "./tutor.service";
import { AuthenticatedRequest } from "../../middlewares/auth";
// import { User } from "../../models/User";
import { IsOnBaord } from "../../constant/enums";
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
      const result = await this.tutorService.setTutorSettings(tutor.id, { minSubjects, maxStudentsDaily, subjectCosts });
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
      const result = await this.tutorService.getTutorSettings(tutor.id);
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
      const result = await this.tutorService.updateTutorSettings(tutor.id, { minSubjects, maxStudentsDaily, subjectCosts });
      return sendSuccessResponse(res, "Tutor settings updated successfully", 200, result);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to update tutor settings", 400);
    }
  };

  async addChildNote(req: AuthenticatedRequest, res: Response, ) {
    try {
      const { id: tutorId } = req.user;
      const { childId, headline, description } = req.body;
      const note = await this.tutorService.createChildNote({ childId, tutorId, headline, description });
      return sendSuccessResponse(res, "Child note added successfully", 200, note);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to add child note", 400);
    }
  }
  
  async addChildReview(req: AuthenticatedRequest, res: Response, ) {
    try {
      const { id: tutorId } = req.user;
      const { childId, rating, review } = req.body;
      const reviewObj = await this.tutorService.createChildReview({ childId, tutorId, rating, review });
      return sendSuccessResponse(res, "Child review added successfully", 200, reviewObj);
    } catch (error: any) {
      return sendErrorResponse(res, error.message || "Failed to add child review", 400);
    }
  }

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
      const { latitude, longitude, radius, limit = 20, offset = 0 } = req.query as unknown as FindTutorsByLocationDto;
      const results = await this.tutorService.findTutorsByLocation(latitude,longitude,radius,limit,offset);
  
      return sendSuccessResponse(res,InfoMessages.GENERIC.ITEM_GET_SUCCESSFULLY("Nearby Tutors"),200,results);
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
      const { amount } = req.body;

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
        amount: parseFloat(amount)
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
}

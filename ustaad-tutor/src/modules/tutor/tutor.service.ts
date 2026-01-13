import { ConflictError } from "../../errors/conflict-error";
import { BadRequestError } from "src/errors/bad-request-error";
import { NotFoundError } from "../../errors/not-found-error";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ITutorOnboardingDTO } from "./tutor.dto";
import bcrypt from "bcrypt";
import { Op, Sequelize } from "sequelize";
import geohash from "ngeohash";

import {
  User,
  Tutor,
  Subject,
  TutorEducation,
  TutorExperience,
  TutorSettings,
  ChildNotes,
  ChildReview,
  Child,
  TutorLocation,
  TutorSessions,
  TutorSessionsDetail,
  TutorTransaction,
  Offer,
  Parent,
  Notification,
  NotificationType,
  ParentSubscription,
  ContractReview,
  sequelize,
  Message,
  ConversationParticipant,
  HelpRequestType,
  TutorTransactionType,
  PaymentRequests,
  ParentSubscriptionStatus,
} from "@ustaad/shared";
import { HelpRequests } from "@ustaad/shared";
import { TutorPaymentStatus, TutorSessionStatus } from "@ustaad/shared";
import { UserRole, HelpRequestStatus, OfferStatus } from "@ustaad/shared";
import { QueryTypes } from "sequelize";
import { sendNotificationToUser } from "../../services/notification.service";

interface TutorProfileData extends ITutorOnboardingDTO {
  resume: Express.Multer.File;
  idFront: Express.Multer.File;
  idBack: Express.Multer.File;
}
export interface SubjectCostSetting {
  cost: number;
  active: boolean;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  image?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

interface ExperienceData {
  company: string;
  startDate: Date;
  endDate: Date;
  description: string;
  designation: string;
}

interface EducationData {
  institute: string;
  startDate: Date;
  endDate: Date;
  description: string;
  degree?: string;
}

interface PaymentRequestData {
  tutorId: string;
  amount: number;
}

export default class TutorService {
  tutorModel = Tutor;

  private async pushToUser(
    targetUserId: string,
    headline: string,
    message: string,
    data?: any,
    imageUrl?: string,
    clickAction?: string
  ) {
    const target = await User.findByPk(targetUserId);
    const token = target?.deviceId;
    if (!token) return;
    await sendNotificationToUser(
      targetUserId,
      token,
      headline,
      message,
      data,
      imageUrl,
      clickAction
    );
  }

  async createTutorProfile(data: TutorProfileData) {
    try {
      // Check if user exists

      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new UnProcessableEntityError(
          "User not registered with provided email or phone."
        );
      }

      // Check if tutor profile already exists
      const existingTutor = await Tutor.findOne({
        where: { userId: data.userId },
      });
      if (existingTutor) {
        throw new ConflictError("This tutor profile already registered.");
      }

      // Create folder for user documents
      const userFolder = path.join("uploads", "tutors", data.userId.toString());

      // Upload files
      const [resumeUrl, idFrontUrl, idBackUrl] = await Promise.all([
        uploadFile(data.resume, userFolder, "resume"),
        uploadFile(data.idFront, userFolder, "id-front"),
        uploadFile(data.idBack, userFolder, "id-back"),
      ]);

      const formatStringArray = (field: any) => {
        if (Array.isArray(field)) {
          return field.map((s: string) => s.toLowerCase());
        }
        if (typeof field === "string") {
          return field
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s: string) =>
              s
                .trim()
                .replace(/^['"]|['"]$/g, "")
                .toLowerCase()
            );
        }
        return [];
      };

      const formattedSubjects = formatStringArray(data.subjects);
      const formattedGrade = formatStringArray(data.grade);
      const formattedCurriculum = formatStringArray(data.curriculum);

      const tutor = await Tutor.create({
        userId: data.userId,
        bankName: data.bankName,
        subjects: formattedSubjects,
        grade: formattedGrade,
        curriculum: formattedCurriculum,
        accountNumber: data.accountNumber,
        resumeUrl,
        idFrontUrl,
        idBackUrl,
      });

      return tutor;
    } catch (error) {
      console.error("Error in createTutorProfile:", error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new UnProcessableEntityError("User not found");
      }

      if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: data.email },
        });
        if (existingUser) {
          throw new ConflictError("Email is already taken");
        }
      }

      if (data.phone && data.phone !== user.phone) {
        const existingUser = await User.findOne({
          where: { phone: data.phone },
        });
        if (existingUser) {
          throw new ConflictError("Phone number is already taken");
        }
      }

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      await user.update(data);

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });

      return updatedUser;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      throw error;
    }
  }

  async updateBankDetails(
    userId: string,
    bankName: string,
    accountNumber: string
  ) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      await tutor.update({
        bankName,
        accountNumber,
      });

      return tutor;
    } catch (error) {
      console.error("Error in updateBankDetails:", error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const participants = await ConversationParticipant.findAll({
        where: { userId, isActive: true },
        attributes: ["conversationId", "lastReadAt"],
      });

      let unreadMessageCount = 0;
      if (participants.length > 0) {
        const conditions = participants.map((p) => ({
          conversationId: p.conversationId,
          createdAt: { [Op.gt]: p.lastReadAt || new Date(0) },
        }));

        unreadMessageCount = await Message.count({
          where: {
            senderId: { [Op.ne]: userId },
            [Op.or]: conditions,
          },
        });
      }

      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Tutor,
            attributes: [
              "bankName",
              "accountNumber",
              "resumeUrl",
              "idFrontUrl",
              "idBackUrl",
              "subjects",
              "about",
              "grade",
              "curriculum",
              "balance",
            ],
          },
        ],
      });

      const experiences = await TutorExperience.findAll({
        where: { tutorId: userId },
      });

      // Calculate total experience in years
      let totalExperience = 0;
      experiences.forEach((exp) => {
        const startDate = new Date(exp.startDate);
        const endDate = new Date(exp.endDate);
        const diffInYears =
          (endDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        totalExperience += diffInYears;
      });

      const sessions = await TutorSessions.findAll({
        where: { tutorId: userId, status: "active" },
      });

      // Get today's day name in lowercase
      const today = new Date()
        .toLocaleDateString("en-US", { weekday: "short" })
        .toLowerCase();

      // Count sessions scheduled for today
      let totalSessions = 0;
      sessions.forEach((session) => {
        // Check if today is in the session's days of week
        if (
          session.daysOfWeek.some((day) => {
            if (day.includes("-")) {
              // Handle ranges like "mon-fri"
              const [start, end] = day.split("-");
              const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
              const startIdx = days.indexOf(start);
              const endIdx = days.indexOf(end);
              const todayIdx = days.indexOf(today);
              return todayIdx >= startIdx && todayIdx <= endIdx;
            } else {
              // Handle individual days
              return day === today;
            }
          })
        ) {
          totalSessions++;
        }
      });

      // Get all reviews for this tutor from ContractReview
      // Reviews where tutor is the reviewedId and reviewerRole is PARENT
      const reviews = await ContractReview.findAll({
        where: {
          reviewedId: userId,
          reviewerRole: "PARENT",
        },
        include: [
          {
            model: User,
            as: "reviewer",
            foreignKey: "reviewerId",
            attributes: ["id", "firstName", "lastName", "email", "image"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Calculate average rating and total reviews
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      // Format reviews with parent information
      const formattedReviews = reviews.map((review) => {
        const reviewData = review.toJSON() as any;
        return {
          id: review.id,
          rating: review.rating,
          review: review.review,
          parent: reviewData.reviewer
            ? {
                id: reviewData.reviewer.id,
                fullName: `${reviewData.reviewer.firstName} ${reviewData.reviewer.lastName}`,
                email: reviewData.reviewer.email,
                image: reviewData.reviewer.image,
              }
            : null,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      });

      return {
        user,
        totalExperience: Math.round(totalExperience * 10) / 10, // Round to 1 decimal place
        totalSessions,
        reviews: formattedReviews,
        reviewStats: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
        },
        unreadMessageCount,
      };
    } catch (error) {
      console.error("Error in getProfile:", error);
      throw error;
    }
  }

  async addExperience(userId: string, data: ExperienceData) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const experience = await TutorExperience.create({
        tutorId: tutor.userId,
        company: data.company,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        designation: data.designation,
      });

      return experience;
    } catch (error) {
      console.error("Error in addExperience:", error);
      throw error;
    }
  }

  async allExperience(userId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const experiences = await TutorExperience.findAll({
        where: { tutorId: tutor.userId },
        order: [["createdAt", "DESC"]],
      });

      return experiences;
    } catch (error) {
      console.error("Error in allExperience:", error);
      throw error;
    }
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    data: ExperienceData
  ) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const experience = await TutorExperience.findOne({
        where: { id: experienceId, tutorId: tutor.userId },
      });

      if (!experience) {
        throw new UnProcessableEntityError("Experience not found");
      }

      await experience.update(data);

      return experience;
    } catch (error) {
      console.error("Error in updateExperience:", error);
      throw error;
    }
  }

  async deleteExperience(userId: string, experienceId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const experience = await TutorExperience.findOne({
        where: { id: experienceId, tutorId: tutor.userId },
      });

      if (!experience) {
        throw new UnProcessableEntityError("Experience not found");
      }

      await experience.destroy();

      return { message: "Experience deleted successfully" };
    } catch (error) {
      console.error("Error in deleteExperience:", error);
      throw error;
    }
  }

  async addEducation(userId: string, data: EducationData) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const education = await TutorEducation.create({
        tutorId: tutor.userId,
        institute: data.institute,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        degree: data.degree,
      });

      return education;
    } catch (error) {
      console.error("Error in addEducation:", error);
      throw error;
    }
  }

  async allEducation(userId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const educations = await TutorEducation.findAll({
        where: { tutorId: tutor.userId },
        order: [["createdAt", "DESC"]],
      });

      return educations;
    } catch (error) {
      console.error("Error in allEducation:", error);
      throw error;
    }
  }

  async updateEducation(
    userId: string,
    educationId: string,
    data: EducationData
  ) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const education = await TutorEducation.findOne({
        where: { id: educationId, tutorId: tutor.userId },
      });

      if (!education) {
        throw new UnProcessableEntityError("Education not found");
      }

      await education.update(data);

      return education;
    } catch (error) {
      console.error("Error in updateEducation:", error);
      throw error;
    }
  }

  async deleteEducation(userId: string, educationId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const education = await TutorEducation.findOne({
        where: { id: educationId, tutorId: tutor.userId },
      });

      if (!education) {
        throw new UnProcessableEntityError("Education not found");
      }

      await education.destroy();

      return { message: "Education deleted successfully" };
    } catch (error) {
      console.error("Error in deleteEducation:", error);
      throw error;
    }
  }

  async addAbout(
    userId: string,
    about: string,
    grade: string[],
    curriculum: string[]
  ) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      await tutor.update({ about, grade, curriculum });

      return tutor;
    } catch (error) {
      console.error("Error in addAbout:", error);
      throw error;
    }
  }

  async editAbout(userId: string, about: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      await tutor.update({ about });

      return tutor;
    } catch (error) {
      console.error("Error in editAbout:", error);
      throw error;
    }
  }

  async getTutorByUserId(userId: string) {
    console.log("we herere");

    return await Tutor.findOne({ where: { userId: userId } });
  }

  async getParentProfile(parentId: string) {
    try {
      const user = await User.findByPk(parentId, {
        attributes: {
          exclude: [
            "password",
            "isActive",
            "isEmailVerified",
            "isPhoneVerified",
            "deviceId",
          ],
        },
        include: [
          {
            model: Parent,
            attributes: ["idFrontUrl", "idBackUrl", "customerId"],
          },
        ],
      });

      if (!user) {
        throw new NotFoundError("Parent not found");
      }

      // Get all children for this parent
      const children = await Child.findAll({
        where: { userId: parentId },
        order: [["createdAt", "DESC"]],
      });

      // Get all reviews given by tutors to this parent (if any exist)
      // Note: Currently there's no ParentReview model, but we can check ContractReview
      // where the parent is the reviewedId and reviewerRole is TUTOR
      const reviews = await ContractReview.findAll({
        where: {
          reviewedId: parentId,
          reviewerRole: "TUTOR",
        },
        include: [
          {
            model: User,
            as: "reviewer",
            foreignKey: "reviewerId",
            attributes: ["id", "firstName", "lastName", "email", "image"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Calculate average rating and total reviews
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      // Format reviews with tutor information
      const formattedReviews = reviews.map((review) => {
        const reviewData = review.toJSON() as any;
        return {
          id: review.id,
          rating: review.rating,
          review: review.review,
          tutor: reviewData.reviewer
            ? {
                id: reviewData.reviewer.id,
                fullName: `${reviewData.reviewer.firstName} ${reviewData.reviewer.lastName}`,
                email: reviewData.reviewer.email,
                image: reviewData.reviewer.image,
              }
            : null,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      });

      // Return user data with children and reviews
      return {
        ...user.toJSON(),
        children,
        reviews: formattedReviews,
        reviewStats: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
        },
      };
    } catch (error) {
      console.error("Error in getParentProfile:", error);
      throw error;
    }
  }

  async setTutorSettings(
    tutorId: string,
    settings: {
      minSubjects: number;
      maxStudentsDaily: number;
      subjectCosts: Record<string, SubjectCostSetting>;
    }
  ) {
    return await TutorSettings.create({ tutorId, ...settings });
  }

  async getTutorSettings(tutorId: string) {
    const tutorSettings = await TutorSettings.findOne({ where: { tutorId } });

    if (tutorSettings) {
      return tutorSettings;
    }

    const tutorProfile = await Tutor.findOne({ where: { userId: tutorId } });

    if (!tutorProfile) {
      throw new UnProcessableEntityError("No tutor profile found!");
    }

    const subjects = tutorProfile.subjects;

    const subjectCosts = subjects.reduce(
      (acc, subject) => {
        acc[subject] = {
          cost: 0,
          active: false,
        };
        return acc;
      },
      {} as Record<string, SubjectCostSetting>
    );

    return await TutorSettings.create({
      tutorId,
      subjectCosts,
      minSubjects: 1,
      maxStudentsDaily: 1,
    });
  }

  async updateTutorSettings(
    tutorId: string,
    settings: {
      minSubjects: number;
      maxStudentsDaily: number;
      subjectCosts: Record<string, SubjectCostSetting>;
    }
  ) {
    const existingSettings = await TutorSettings.findOne({
      where: { tutorId },
    });

    const tutorProfile = await Tutor.findOne({ where: { userId: tutorId } });
    if (!tutorProfile) {
      throw new UnProcessableEntityError("No tutor profile found!");
    }

    // Get current subjects from tutor profile
    const currentSubjects = tutorProfile.subjects || [];

    // Get active subjects from settings
    const newSubjects = Object.entries(settings.subjectCosts)
      .filter(([_, setting]) => setting.active)
      .map(([subject]) => subject);

    // Find subjects to add and remove
    const subjectsToAdd = newSubjects.filter(
      (s) => !currentSubjects.includes(s)
    );
    const subjectsToRemove = currentSubjects.filter(
      (s) => !newSubjects.includes(s)
    );

    // Update tutor profile subjects
    const updatedSubjects = [...currentSubjects, ...subjectsToAdd].filter(
      (s) => !subjectsToRemove.includes(s)
    );

    await tutorProfile.update({ subjects: updatedSubjects });

    // Update settings
    if (existingSettings) {
      return await existingSettings.update(settings);
    }
    return await this.setTutorSettings(tutorId, settings);
  }

  async createChildNote(data: {
    sessionId: string;
    tutorId: string;
    headline: string;
    description: string;
  }) {
    console.log("data", data);

    // First, find the TutorSessionsDetail record by sessionId
    const sessionDetail = await TutorSessionsDetail.findByPk(data.sessionId);
    if (!sessionDetail) {
      throw new Error("Session detail not found");
    }

    // Then, find the related TutorSessions record to get childName
    const tutorSession = await TutorSessions.findByPk(sessionDetail.sessionId);
    if (!tutorSession) {
      throw new Error("Tutor session not found");
    }

    // Create the child note with the retrieved childName
    const childNoteData = {
      sessionId: data.sessionId,
      childName: tutorSession.childName.toLocaleLowerCase(),
      tutorId: data.tutorId,
      headline: data.headline,
      description: data.description,
    };

    return await ChildNotes.create(childNoteData);
  }

  async createChildReview(data: {
    childId: string;
    tutorId: string;
    rating: number;
    review: string;
  }) {
    return await ChildReview.create(data);
  }

  async addTutorLocation(
    userId: string,
    data: { latitude: number; longitude: number; address?: string }
  ) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      // Generate geohash for location-based queries
      const geohashValue = geohash.encode(data.latitude, data.longitude);

      const location = await TutorLocation.create({
        tutorId: tutor.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        geoHash: geohashValue,
      });

      return location;
    } catch (error) {
      console.error("Error in addTutorLocation:", error);
      throw error;
    }
  }

  async findTutorsByLocation(
    parentLat: number | null,
    parentLng: number | null,
    radiusKm: number | null,
    limit = 20,
    offset = 0,
    category?: string
  ) {
    try {
      console.log("Finding tutors with params:", {
        parentLat,
        parentLng,
        radiusKm,
        category,
      });

      // Build basic query conditions
      let whereCondition: any = {};
      let tutorWhereCondition: any = {};

      // Add category filter if provided
      if (category) {
        console.log("Adding category filter for:", category);
        tutorWhereCondition.subjects = {
          [Op.contains]: [category.toLowerCase()],
        };
      }

      console.log("tutorWhereCondition:", tutorWhereCondition);

      // If location params not provided, return all tutors with category filter
      if (!parentLat || !parentLng || !radiusKm) {
        console.log("No location params, getting all tutors");

        // Get all tutor locations with user and tutor info
        let queryOptions: any = {
          include: [
            {
              model: User,
              as: "tutor",
              attributes: [
                "id",
                "fullName",
                "email",
                "phone",
                "image",
                "gender",
              ],
              include: [
                {
                  model: Tutor,
                  attributes: ["subjects", "about", "grade", "curriculum"],
                  required: false, // Always include Tutor data
                },
                {
                  model: TutorExperience,
                  attributes: ["startDate", "endDate"],
                  required: false, // Include experience data if available
                },
              ],
              required: true, // Make sure User is always included
            },
          ],
          limit: category ? 1000 : limit, // Get more results if filtering by category
          offset: category ? 0 : offset,
        };

        // If category filter, add it to the Tutor include
        if (Object.keys(tutorWhereCondition).length > 0) {
          queryOptions.include[0].include[0].where = tutorWhereCondition;
          queryOptions.include[0].include[0].required = true;
        }

        const allTutors = await TutorLocation.findAll(queryOptions);

        console.log(
          "Raw query result sample:",
          JSON.stringify(allTutors[0], null, 2)
        );

        // Remove duplicates by tutorId (in case a tutor has multiple locations)
        const uniqueTutors = allTutors.filter(
          (tutor, index, self) =>
            index === self.findIndex((t) => t.tutorId === tutor.tutorId)
        );

        // Get all tutor IDs to fetch reviews
        const tutorIds = uniqueTutors.map((tutor) => tutor.tutorId);

        // Fetch all reviews for these tutors from ContractReview
        // Reviews where tutor is the reviewedId and reviewerRole is PARENT
        const allReviews = await ContractReview.findAll({
          where: {
            reviewedId: {
              [Op.in]: tutorIds,
            },
            reviewerRole: "PARENT",
          },
          include: [
            {
              model: User,
              as: "reviewer",
              foreignKey: "reviewerId",
              attributes: ["id", "fullName", "email", "image"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        // Create a map of tutorId -> reviews
        const reviewsMap = new Map<string, any[]>();
        tutorIds.forEach((tutorId) => {
          reviewsMap.set(tutorId, []);
        });

        allReviews.forEach((review) => {
          const tutorId = review.reviewedId;
          if (reviewsMap.has(tutorId)) {
            reviewsMap.get(tutorId)!.push(review);
          }
        });

        // Add total experience and reviews to each tutor
        const tutorsWithExperience = uniqueTutors.map((tutor) => {
          const tutorData = tutor.toJSON() as any;
          const totalExperience = this.calculateTotalExperience(
            tutorData.tutor?.TutorExperiences || []
          );

          // Get reviews for this tutor
          const tutorReviews = reviewsMap.get(tutor.tutorId) || [];

          // Calculate review stats
          const totalReviews = tutorReviews.length;
          const averageRating =
            totalReviews > 0
              ? tutorReviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews
              : 0;

          // Format reviews with parent information
          const formattedReviews = tutorReviews.map((review) => {
            const reviewData = review.toJSON() as any;
            return {
              id: review.id,
              rating: review.rating,
              review: review.review,
              parent: reviewData.reviewer
                ? {
                    id: reviewData.reviewer.id,
                    fullName: reviewData.reviewer.fullName,
                    email: reviewData.reviewer.email,
                    image: reviewData.reviewer.image,
                  }
                : null,
              createdAt: review.createdAt,
              updatedAt: review.updatedAt,
            };
          });

          return {
            ...tutorData,
            tutor: {
              ...tutorData.tutor,
              totalExperience,
            },
            reviews: formattedReviews,
            reviewStats: {
              totalReviews,
              averageRating: parseFloat(averageRating.toFixed(1)),
            },
          };
        });

        // Apply pagination if we were filtering by category
        const finalResults = category
          ? tutorsWithExperience.slice(offset, offset + limit)
          : tutorsWithExperience;

        console.log(
          "Found tutors:",
          allTutors.length,
          "Unique tutors:",
          uniqueTutors.length,
          "Final results:",
          finalResults.length
        );
        return finalResults;
      }

      console.log("Using location-based search");

      // Generate geohash for parent location
      const parentGeohash = geohash.encode(parentLat, parentLng);

      // Calculate geohash precision based on radius
      const precision = radiusKm <= 1 ? 6 : radiusKm <= 5 ? 5 : 4;
      const parentGeohashPrefix = parentGeohash.substring(0, precision);

      whereCondition.geoHash = {
        [Op.like]: `${parentGeohashPrefix}%`,
      };

      // Find tutors within the geohash area
      let locationQueryOptions: any = {
        where: whereCondition,
        include: [
          {
            model: User,
            as: "tutor",
            attributes: ["id", "fullName", "email", "phone", "image"],
            include: [
              {
                model: Tutor,
                attributes: ["subjects", "about", "grade", "curriculum"],
                required: false, // Always include Tutor data
              },
              {
                model: TutorExperience,
                attributes: ["startDate", "endDate"],
                required: false, // Include experience data if available
              },
            ],
            required: true, // Make sure User is always included
          },
        ],
        limit: category ? 1000 : limit, // Get more results if filtering by category
        offset: category ? 0 : offset,
      };

      // If category filter, add it to the Tutor include
      if (Object.keys(tutorWhereCondition).length > 0) {
        locationQueryOptions.include[0].include[0].where = tutorWhereCondition;
        locationQueryOptions.include[0].include[0].required = true;
      }

      const nearbyTutors = await TutorLocation.findAll(locationQueryOptions);

      console.log(
        "Raw nearby tutors result sample:",
        JSON.stringify(nearbyTutors[0], null, 2)
      );

      console.log("Found nearby tutors:", nearbyTutors.length);

      // Filter by actual distance and sort by distance
      const tutorsWithDistance = nearbyTutors
        .map((tutorLocation) => {
          const distance = this.calculateDistanceKm(
            parentLat,
            parentLng,
            tutorLocation.latitude,
            tutorLocation.longitude
          );
          const tutorData = tutorLocation.toJSON() as any;
          const totalExperience = this.calculateTotalExperience(
            tutorData.tutor?.TutorExperiences || []
          );

          return {
            ...tutorData,
            distance,
            tutor: {
              ...tutorData.tutor,
              totalExperience,
            },
          };
        })
        .filter((tutor) => tutor.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      // Remove duplicates by tutorId (in case a tutor has multiple locations)
      const uniqueTutors = tutorsWithDistance.filter(
        (tutor, index, self) =>
          index === self.findIndex((t) => t.tutorId === tutor.tutorId)
      );

      // Get all tutor IDs to fetch reviews
      const tutorIds = uniqueTutors.map((tutor) => tutor.tutorId);

      // Fetch all reviews for these tutors from ContractReview
      // Reviews where tutor is the reviewedId and reviewerRole is PARENT
      const allReviews = await ContractReview.findAll({
        where: {
          reviewedId: {
            [Op.in]: tutorIds,
          },
          reviewerRole: "PARENT",
        },
        include: [
          {
            model: User,
            as: "reviewer",
            foreignKey: "reviewerId",
            attributes: ["id", "fullName", "email", "image"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Create a map of tutorId -> reviews
      const reviewsMap = new Map<string, any[]>();
      tutorIds.forEach((tutorId) => {
        reviewsMap.set(tutorId, []);
      });

      allReviews.forEach((review) => {
        const tutorId = review.reviewedId;
        if (reviewsMap.has(tutorId)) {
          reviewsMap.get(tutorId)!.push(review);
        }
      });

      // Add reviews to each tutor
      const tutorsWithReviews = uniqueTutors.map((tutor) => {
        // Get reviews for this tutor
        const tutorReviews = reviewsMap.get(tutor.tutorId) || [];

        // Calculate review stats
        const totalReviews = tutorReviews.length;
        const averageRating =
          totalReviews > 0
            ? tutorReviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews
            : 0;

        // Format reviews with parent information
        const formattedReviews = tutorReviews.map((review) => {
          const reviewData = review.toJSON() as any;
          return {
            id: review.id,
            rating: review.rating,
            review: review.review,
            parent: reviewData.reviewer
              ? {
                  id: reviewData.reviewer.id,
                  fullName: reviewData.reviewer.fullName,
                  email: reviewData.reviewer.email,
                  image: reviewData.reviewer.image,
                }
              : null,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          };
        });

        return {
          ...tutor,
          reviews: formattedReviews,
          reviewStats: {
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(1)),
          },
        };
      });

      // Apply pagination if we were filtering by category
      const finalResults = category
        ? tutorsWithReviews.slice(offset, offset + limit)
        : tutorsWithReviews;

      console.log(
        "Final unique tutors:",
        uniqueTutors.length,
        "Final results:",
        finalResults.length
      );
      return finalResults;
    } catch (error) {
      console.error("Error in findTutorsByLocation:", error);
      throw error;
    }
  }

  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (val: number) => (val * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateTotalExperience(experiences: any[]): number {
    if (!experiences || experiences.length === 0) {
      return 0;
    }

    let totalExperience = 0;
    experiences.forEach((exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = new Date(exp.endDate);
      const diffInYears =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      totalExperience += diffInYears;
    });

    return Math.round(totalExperience * 10) / 10; // Round to 1 decimal place
  }

  async getAllTutorLocations(userId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const locations = await TutorLocation.findAll({
        where: { tutorId: tutor.userId },
        order: [["createdAt", "DESC"]],
      });

      return locations;
    } catch (error) {
      console.error("Error in getAllTutorLocations:", error);
      throw error;
    }
  }

  async deleteTutorLocation(userId: string, locationId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const location = await TutorLocation.findOne({
        where: {
          id: locationId,
          tutorId: tutor.userId,
        },
      });

      if (!location) {
        throw new NotFoundError(
          "Location not found or not authorized to delete"
        );
      }

      await location.destroy();
      return { message: "Location deleted successfully" };
    } catch (error) {
      console.error("Error in deleteTutorLocation:", error);
      throw error;
    }
  }

  // Payment Request Methods
  async createPaymentRequest(data: PaymentRequestData) {
    try {
      // Check if tutor exists
      const tutor = await Tutor.findByPk(data.tutorId);
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor not found");
      }

      console.log("11111");

      // Check if tutor has sufficient balance
      if (tutor.balance < data.amount) {
        throw new BadRequestError(
          `Insufficient balance. Available balance: ${tutor.balance}, Requested amount: ${data.amount}`
        );
      }

      // Create payment request
      const paymentRequest = await PaymentRequests.findOne({
        where: {
          tutorId: tutor.userId,
          status:
            TutorPaymentStatus.PENDING ||
            TutorPaymentStatus.REQUESTED ||
            TutorPaymentStatus.IN_REVIEW,
        },
      });

      console.log("22222");

      if (paymentRequest) {
        throw new UnProcessableEntityError("Payment request already exists");
      }

      await PaymentRequests.create({
        tutorId: tutor.userId,
        status: TutorPaymentStatus.REQUESTED,
        amount: data.amount,
      });

      tutor.balance -= data.amount;
      await tutor.save();

      return paymentRequest;
    } catch (error) {
      console.error("Error in createPaymentRequest:", error);
      throw error;
    }
  }

  async getPaymentRequests(tutorId: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId: tutorId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor not found");
      }

      // Get all payment requests for the tutor
      const paymentRequests = await PaymentRequests.findAll({
        where: { tutorId },
        order: [["createdAt", "DESC"]],
      });

      return { paymentRequests, balance: tutor.balance };
    } catch (error) {
      console.error("Error in getPaymentRequests:", error);
      throw error;
    }
  }

  async getTutorSessions(userId: string, role: UserRole) {
    try {
      let sessionsQuery = "";
      let runningSessionsQuery = "";

      if (role === "TUTOR") {
        // Tutor → get parent info from tutorSessions
        sessionsQuery = `
        SELECT 
          ts.*, 
          u.id AS "parentId",
          u."fullName" AS "parentName"
        FROM "tutorSessions" ts
        JOIN "users" u ON u.id = ts."parentId"
        WHERE ts."tutorId" = :userId;
      `;

        // Running sessions from tutorSessionsDetail (with parent info)
        runningSessionsQuery = `
        SELECT 
          tsd.*, 
          u.id AS "parentId",
          u."fullName" AS "parentName"
        FROM "tutorSessionsDetail" tsd
        JOIN "users" u ON u.id = tsd."parentId"
        WHERE tsd."tutorId" = :userId
          AND tsd."status" = 'CREATED';
      `;
      } else if (role === "PARENT") {
        // Parent → get tutor info from tutorSessions
        sessionsQuery = `
        SELECT 
          ts.*, 
          u.id AS "tutorId",
          u."fullName" AS "tutorName"
        FROM "tutorSessions" ts
        JOIN "users" u ON u.id = ts."tutorId"
        WHERE ts."parentId" = :userId;
      `;

        // Running sessions from tutorSessionsDetail (with tutor info)
        runningSessionsQuery = `
        SELECT 
          tsd.*, 
          u.id AS "tutorId",
          u."fullName" AS "tutorName"
        FROM "tutorSessionsDetail" tsd
        JOIN "users" u ON u.id = tsd."tutorId"
        WHERE tsd."parentId" = :userId
          AND tsd."status" = 'CREATED';
      `;
      } else {
        throw new UnProcessableEntityError("Invalid user role");
      }

      // Execute queries
      const sessions = await sequelize.query(sessionsQuery, {
        replacements: { userId },
        type: QueryTypes.SELECT,
      });

      const runningSessions = await sequelize.query(runningSessionsQuery, {
        replacements: { userId },
        type: QueryTypes.SELECT,
      });

      return { sessions, runningSessions };
    } catch (error) {
      console.error("Error in getTutorSessions:", error);
      throw error;
    }
  }

  async getTutorSession(userId: string, sessionId: string, role: UserRole) {
    try {
      let query = "";

      if (role === UserRole.TUTOR) {
        // Tutor → fetch parent info
        query = `
          SELECT 
            tsd.*, 
            u.id AS "parentId",
            u."fullName" AS "parentName"
          FROM "tutorSessionsDetail" tsd
          JOIN "users" u ON u.id = tsd."parentId"
          WHERE tsd."tutorId" = :userId AND tsd."sessionId" = :sessionId
          LIMIT 1;
        `;
      } else if (role === UserRole.PARENT) {
        // Parent → fetch tutor info
        query = `
          SELECT 
            tsd.*, 
            u.id AS "tutorId",
            u."fullName" AS "tutorName"
          FROM "tutorSessionsDetail" tsd
          JOIN "users" u ON u.id = tsd."tutorId"
          WHERE tsd."parentId" = :userId AND tsd."sessionId" = :sessionId
          LIMIT 1;
        `;
      } else {
        throw new UnProcessableEntityError("Invalid user role");
      }

      if (!sequelize || typeof sequelize.query !== "function") {
        throw new Error("Database connection is not available");
      }
      if (typeof QueryTypes === "undefined") {
        throw new Error("QueryTypes is not defined");
      }

      const result = await sequelize.query(query, {
        replacements: { userId, sessionId },
        type: QueryTypes.SELECT,
      });

      const session = Array.isArray(result) ? result[0] : null;
      return session || null;
    } catch (error) {
      console.error("Error in getTutorSession:", error);
      throw error;
    }
  }

  async addTutorSession(userId: string, data: TutorSessionsDetail) {
    const session = await TutorSessions.findOne({
      where: { id: data.sessionId, tutorId: userId, parentId: data.parentId },
    });

    if (!session) {
      throw new UnProcessableEntityError("Tutor session not found");
    }

    if (session.status !== "active") {
      throw new UnProcessableEntityError(
        `Tutor session is ${session.status} and cannot be updated`
      );
    }

    // Check if session detail already exists for the same day
    const existingSessionDetail = await TutorSessionsDetail.findOne({
      where: {
        tutorId: userId,
        parentId: data.parentId,
        sessionId: data.sessionId,
        createdAt: {
          [Op.between]: [
            new Date().setHours(0, 0, 0, 0),
            new Date().setHours(23, 59, 59, 999),
          ],
        },
      },
    });

    if (existingSessionDetail) {
      throw new UnProcessableEntityError(
        "A session detail already exists for today"
      );
    }

    if (session.id !== data.sessionId) {
      throw new UnProcessableEntityError("Tutor session already exists");
    }

    const sessionDetail = await TutorSessionsDetail.create({
      tutorId: userId,
      ...data,
    });

    // 🔔 SEND NOTIFICATION TO PARENT based on status
    try {
      const tutor = await User.findByPk(userId);
      const sessionInfo = await TutorSessions.findByPk(data.sessionId);

      if (sessionInfo) {
        let notificationType: NotificationType | null = null;
        let title = "";
        let body = "";

        if (
          data.status === TutorSessionStatus.CREATED ||
          data.status === TutorSessionStatus.COMPLETED
        ) {
          // This is essentially a check-in
          notificationType = NotificationType.TUTOR_CHECKED_IN;
          title = "✅ Session Started";
          body = `${tutor?.firstName} ${tutor?.lastName} has started the session with ${sessionInfo.childName}`;
        } else if (data.status === TutorSessionStatus.TUTOR_HOLIDAY) {
          notificationType = NotificationType.TUTOR_HOLIDAY;
          title = "📅 Tutor Holiday";
          body = `${tutor?.firstName} ${tutor?.lastName} has marked a holiday for today's session`;
        } else if (data.status === TutorSessionStatus.PUBLIC_HOLIDAY) {
          notificationType = NotificationType.TUTOR_HOLIDAY;
          title = "📅 Public Holiday";
          body = `Session cancelled due to public holiday`;
        } else if (data.status === TutorSessionStatus.CANCELLED_BY_TUTOR) {
          notificationType = NotificationType.SESSION_CANCELLED_BY_TUTOR;
          title = "❌ Session Cancelled";
          body = `${tutor?.firstName} ${tutor?.lastName} has cancelled today's session`;
        }

        if (notificationType) {
          await this.pushToUser(
            data.parentId,
            title,
            body,
            {
              type: notificationType,
              relatedEntityId: sessionDetail.id,
              relatedEntityType: "sessionDetail",
              tutorName: `${tutor?.firstName} ${tutor?.lastName}`,
              childName: sessionInfo.childName,
              status: data.status,
              sessionId: data.sessionId,
            },
            undefined,
            `/sessions/${data.sessionId}`
          );
          console.log(
            `✅ Sent session status notification to parent ${data.parentId}`
          );
        }
      }
    } catch (notificationError) {
      console.error(
        "❌ Error sending session status notification:",
        notificationError
      );
    }

    return sessionDetail;
  }

  async deleteTutorSession(userId: string, sessionId: string) {
    return await TutorSessionsDetail.destroy({
      where: { id: sessionId, tutorId: userId },
    });
  }

  async editTutorSession(data: TutorSessionsDetail) {
    const mainSession = await TutorSessions.findOne({
      where: {
        id: data.sessionId,
        tutorId: data.tutorId,
        parentId: data.parentId,
      },
    });

    if (!mainSession) {
      throw new UnProcessableEntityError("Main Session not found");
    }

    const session = await TutorSessionsDetail.findOne({
      where: {
        id: data.id,
        tutorId: data.tutorId,
        parentId: data.parentId,
        status: TutorSessionStatus.CREATED,
      },
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    const oldStatus = session.status;
    await session.update({ ...data });

    // 🔔 SEND NOTIFICATION TO PARENT if status changed
    if (data.status && data.status !== oldStatus) {
      try {
        const tutor = await User.findByPk(data.tutorId);
        const sessionInfo = await TutorSessions.findByPk(data.sessionId);

        if (sessionInfo) {
          let notificationType: NotificationType | null = null;
          let title = "";
          let body = "";

          if (data.status === TutorSessionStatus.COMPLETED) {
            // Checkout notification
            notificationType = NotificationType.TUTOR_CHECKED_OUT;
            title = "👋 Session Completed";
            body = `${tutor?.firstName} ${tutor?.lastName} has completed the session with ${sessionInfo.childName}`;
          } else if (data.status === TutorSessionStatus.TUTOR_HOLIDAY) {
            notificationType = NotificationType.TUTOR_HOLIDAY;
            title = "📅 Tutor Holiday";
            body = `${tutor?.firstName} ${tutor?.lastName} has marked a holiday`;
          } else if (data.status === TutorSessionStatus.CANCELLED_BY_TUTOR) {
            notificationType = NotificationType.SESSION_CANCELLED_BY_TUTOR;
            title = "❌ Session Cancelled";
            body = `${tutor?.firstName} ${tutor?.lastName} has cancelled the session`;
          } else if (data.status === TutorSessionStatus.CANCELLED_BY_PARENT) {
            notificationType = NotificationType.SESSION_CANCELLED_BY_PARENT;
            title = "❌ Session Cancelled";
            body = `Session with ${sessionInfo.childName} has been cancelled`;
          }

          if (notificationType) {
            await this.pushToUser(
              data.parentId,
              title,
              body,
              {
                type: notificationType,
                relatedEntityId: session.id,
                relatedEntityType: "sessionDetail",
                tutorName: `${tutor?.firstName} ${tutor?.lastName}`,
                childName: sessionInfo.childName,
                oldStatus,
                newStatus: data.status,
                sessionId: data.sessionId,
              },
              undefined,
              `/sessions/${data.sessionId}`
            );
            console.log(
              `✅ Sent session update notification to parent ${data.parentId}`
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "❌ Error sending session update notification:",
          notificationError
        );
      }
    }

    if (data.status === TutorSessionStatus.COMPLETED) {
      await mainSession.update({
        sessionsCompleted: mainSession.sessionsCompleted + 1,
      });
    }

    return await TutorSessionsDetail.update(
      { ...data },
      { where: { id: data.id, tutorId: data.tutorId, parentId: data.parentId } }
    );
  }

  async getMonthlyEarnings(tutorId: string) {
    try {
      // Calculate date range for last 6 months (start of the month 5 months ago)
      const currentDate = new Date();
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 5,
        1
      );

      // Get all tutor transactions for the last 6 months
      const transactions = await TutorTransaction.findAll({
        where: {
          tutorId: tutorId,
          createdAt: {
            [Op.gte]: startDate,
          },
          transactionType: TutorTransactionType.PAYMENT,
          status: {
            [Op.in]: [TutorPaymentStatus.PAID, TutorPaymentStatus.PENDING], // Include both paid and pending
          },
        },
        order: [["createdAt", "ASC"]],
      });

      // Group transactions by month and calculate earnings
      const monthlyData: {
        [key: string]: { month: string; earnings: number; count: number };
      } = {};

      // Initialize last 6 months with zero earnings
      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        monthlyData[monthKey] = {
          month: monthName,
          earnings: 0,
          count: 0,
        };
      }

      // Sum up earnings by month
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.createdAt);
        const monthKey = `${transactionDate.getFullYear()}-${String(
          transactionDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].earnings += transaction.amount;
          monthlyData[monthKey].count += 1;
        }
      });

      // Convert to array and sort by month
      const result = Object.keys(monthlyData)
        .sort()
        .map((key) => monthlyData[key]);

      // Calculate total earnings and statistics
      const totalEarnings = result.reduce(
        (sum, month) => sum + month.earnings,
        0
      );
      const totalTransactions = result.reduce(
        (sum, month) => sum + month.count,
        0
      );
      const avgMonthlyEarnings = totalEarnings / 6;

      return {
        monthlyEarnings: result,
        summary: {
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          totalTransactions,
          averageMonthlyEarnings: parseFloat(avgMonthlyEarnings.toFixed(2)),
          period: "6 months",
        },
      };
    } catch (error) {
      console.error("Error in getMonthlyEarnings:", error);
      throw error;
    }
  }

  async createHelpRequest(
    requesterId: string,
    requesterRole: UserRole,
    subject: string,
    message: string,
    againstId?: string
  ) {
    try {
      // If againstId is provided, validate against opposite role
      if (againstId) {
        let expectedRole: UserRole;

        // Determine expected role based on requester role
        if (requesterRole === UserRole.TUTOR) {
          expectedRole = UserRole.PARENT;
        } else if (requesterRole === UserRole.PARENT) {
          expectedRole = UserRole.TUTOR;
        } else {
          // For ADMIN or SUPER_ADMIN, allow any role
          expectedRole = requesterRole;
        }

        // Check if the againstId user exists and has the expected role
        const againstUser = await User.findOne({
          where: {
            id: againstId,
            ...(requesterRole !== UserRole.ADMIN &&
            requesterRole !== UserRole.SUPER_ADMIN
              ? { role: expectedRole }
              : {}),
          },
        });

        if (!againstUser) {
          if (requesterRole === UserRole.TUTOR) {
            throw new UnProcessableEntityError("Invalid parent ID provided");
          } else if (requesterRole === UserRole.PARENT) {
            throw new UnProcessableEntityError("Invalid tutor ID provided");
          } else {
            throw new UnProcessableEntityError("Invalid user ID provided");
          }
        }
      }

      const helpRequest = await HelpRequests.create({
        requesterId,
        againstId: againstId || null,
        requester: requesterRole,
        subject,
        message,
        status: HelpRequestStatus.OPEN,
      });

      return helpRequest;
    } catch (error) {
      console.error("Error in createHelpRequest:", error);
      throw error;
    }
  }

  async getHelpRequestsAgainstUser(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { rows: helpRequests, count } = await HelpRequests.findAndCountAll({
        where: {
          requesterId: userId,
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        helpRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error in getHelpRequestsAgainstUser:", error);
      throw error;
    }
  }

  async getContracts(userId: string, userRole: UserRole, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      let whereCondition: any;
      let includeCondition: any;

      if (userRole === UserRole.TUTOR) {
        // If user is PARENT, get offers where they are the sender and status is ACCEPTED
        whereCondition = {
          senderId: userId,
        };

        // Include receiver (tutor) details
        includeCondition = [
          {
            model: User,
            as: "receiver",
            attributes: ["id", "fullName", "email", "image", "role"],
            include: [
              {
                model: Parent,
                attributes: ["userId"],
                required: false,
              },
            ],
          },
        ];
      } else if (userRole === UserRole.PARENT) {
        // If user is TUTOR, get offers where they are the receiver and status is ACCEPTED
        whereCondition = {
          receiverId: userId,
        };

        // Include sender (parent) details
        includeCondition = [
          {
            model: User,
            as: "sender",
            attributes: ["id", "fullName", "email", "image", "role"],
            include: [
              {
                model: Tutor,
                attributes: [
                  "bankName",
                  "accountNumber",
                  "resumeUrl",
                  "subjects",
                  "about",
                  "grade",
                  "curriculum",
                ],
                required: false,
              },
            ],
          },
        ];
      } else {
        // For ADMIN/SUPER_ADMIN, return all accepted offers
        whereCondition = {
          status: OfferStatus.ACCEPTED,
        };

        includeCondition = [
          {
            model: User,
            as: "sender",
            attributes: ["id", "fullName", "email", "image", "role"],
            include: [
              {
                model: Tutor,
                attributes: [
                  "bankName",
                  "accountNumber",
                  "resumeUrl",
                  "subjects",
                  "about",
                  "grade",
                  "curriculum",
                ],
                required: false,
              },
            ],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["id", "fullName", "email", "image", "role"],
            include: [
              {
                model: Tutor,
                attributes: [
                  "bankName",
                  "accountNumber",
                  "resumeUrl",
                  "subjects",
                  "about",
                  "grade",
                  "curriculum",
                ],
                required: false,
              },
            ],
          },
        ];
      }

      const { rows: rawContracts, count } = await Offer.findAndCountAll({
        where: whereCondition,
        include: includeCondition,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      // Transform the data to have consistent structure for all roles
      const contracts = rawContracts.map((contract) => {
        const contractData = contract.toJSON() as any;

        // Determine the other party based on user role
        let otherParty;
        if (userRole === UserRole.PARENT) {
          // For parents, the other party is the receiver (tutor)
          otherParty = contractData.receiver;
        } else if (userRole === UserRole.TUTOR) {
          // For tutors, the other party is the sender (parent)
          otherParty = contractData.sender;
        } else {
          // For admins, include both but prioritize receiver for consistency
          otherParty = contractData.receiver;
        }

        // Return consistent structure
        return {
          id: contractData.id,
          conversationId: contractData.conversationId,
          senderId: contractData.senderId,
          receiverId: contractData.receiverId,
          messageId: contractData.messageId,
          childName: contractData.childName,
          amountMonthly: contractData.amountMonthly,
          subject: contractData.subject,
          startDate: contractData.startDate,
          startTime: contractData.startTime,
          endTime: contractData.endTime,
          description: contractData.description,
          status: contractData.status,
          daysOfWeek: contractData.daysOfWeek,
          createdAt: contractData.createdAt,
          updatedAt: contractData.updatedAt,
          user: otherParty, // Consistent key for the other party
          ...(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN
            ? {
                sender: contractData.sender,
                receiver: contractData.receiver,
              }
            : {}),
        };
      });

      const totalPages = Math.ceil(count / limit);

      return {
        contracts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        userRole, // Include user role in response for frontend reference
      };
    } catch (error) {
      console.error("Error in getContracts:", error);
      throw error;
    }
  }

  async getNotificationHistory(userId: string) {
    try {
      const notifications = await Notification.findAll({ where: { userId } });
      return notifications;
    } catch (error) {
      console.error("Error in getNotificationHistory:", error);
      throw error;
    }
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    try {
      const notification = await Notification.update(
        { isRead: true },
        { where: { id: notificationId } }
      );
      return notification;
    } catch (error) {
      console.error("Error in markNotificationAsRead:", error);
      throw error;
    }
  }

  async cancelContract(tutorId: string, contractId: string) {
    try {
      // First, verify that the contract exists and belongs to this tutor
      const contract = await ParentSubscription.findOne({
        where: {
          id: contractId,
          tutorId: tutorId,
        },
      });

      if (!contract) {
        throw new NotFoundError(
          "Contract not found or you don't have permission to cancel this contract"
        );
      }

      // Check if contract is already cancelled
      if (contract.status === "cancelled") {
        throw new BadRequestError("Contract is already cancelled");
      }

      // Update the contract status to cancelled
      await ParentSubscription.update(
        {
          status: "cancelled",
          endDate: new Date(), // Set end date to current date
        },
        {
          where: {
            id: contractId,
            tutorId: tutorId,
          },
        }
      );

      // Get the updated contract with related data
      const updatedContract = await ParentSubscription.findOne({
        where: { id: contractId },
        include: [
          {
            model: User,
            as: "parent",
            foreignKey: "parentId",
            attributes: ["id", "fullName", "email", "image", "role"],
          },
          {
            model: Offer,
            attributes: [
              "id",
              "childName",
              "subject",
              "startDate",
              "startTime",
              "endTime",
              "description",
              "daysOfWeek",
            ],
            required: false,
          },
        ],
      });

      return updatedContract;
    } catch (error) {
      console.error("Error in cancelContract:", error);
      throw error;
    }
  }

  async terminateContract(
    tutorId: string,
    contractId: string,
    status:
      | ParentSubscriptionStatus.DISPUTE
      | ParentSubscriptionStatus.PENDING_COMPLETION,
    reason?: string
  ) {
    try {
      // 1. Verify contract exists and belongs to tutor
      const contract = await ParentSubscription.findOne({
        where: {
          id: contractId,
          tutorId: tutorId,
        },
        include: [
          {
            model: Offer,
            attributes: ["id", "childName", "subject"],
          },
        ],
      });

      if (!contract) {
        throw new NotFoundError("Contract not found");
      }

      console.log("we here 11");

      // 2. Check if contract can be terminated (not already completed/disputed/cancelled)
      if (
        [
          ParentSubscriptionStatus.COMPLETED,
          ParentSubscriptionStatus.DISPUTE,
          ParentSubscriptionStatus.CANCELLED,
        ].includes(contract.status as any)
      ) {
        throw new BadRequestError(`Contract is already ${contract.status}`);
      }

      // 3. Validate reason if status is dispute
      if (
        status === ParentSubscriptionStatus.DISPUTE &&
        (!reason || reason.trim().length === 0)
      ) {
        throw new BadRequestError(
          "Cancellation reason is required for dispute"
        );
      }

      // 4. Calculate completed days for payment
      // const completedSessions = await TutorSessionsDetail.count({
      //   where: {
      //     tutorId: contract.tutorId,
      //     parentId: contract.parentId,
      //     status,
      //   },
      //   include: [
      //     {
      //       model: TutorSessions,
      //       where: { offerId: contract.offerId },
      //       required: true,
      //     },
      //   ],
      // });

      console.log("we here 22");

      // 5. Update contract based on status
      if (status === ParentSubscriptionStatus.DISPUTE) {
        await contract.update({
          status: ParentSubscriptionStatus.DISPUTE,
          disputeReason: reason,
          disputedBy: tutorId,
          disputedAt: new Date(),
          endDate: new Date(), // Set end date to now
        } as any);
      } else if (status === ParentSubscriptionStatus.PENDING_COMPLETION) {
        await contract.update({
          status: ParentSubscriptionStatus.PENDING_COMPLETION,
          endDate: new Date(), // Set end date to now
        } as any);
      }

      // 6. Send notification to parent
      try {
        const tutor = await User.findByPk(tutorId);
        const offer = await Offer.findByPk(contract.offerId);

        if (status === ParentSubscriptionStatus.DISPUTE) {
          await this.pushToUser(
            contract.parentId,
            "⚠️ Contract Disputed",
            `${tutor?.firstName} ${tutor?.lastName} has disputed the contract${offer?.childName ? ` for ${offer.childName}` : ""}. Reason: ${reason?.substring(0, 50) || ""}${reason && reason.length > 50 ? "..." : ""}`,
            {
              type: NotificationType.CONTRACT_DISPUTED,
              contractId: contract.id,
              disputedBy: tutorId,
              reason: reason?.substring(0, 100) || "",
            },
            undefined,
            `/contracts/${contract.id}`
          );
          console.log(
            `✅ Sent dispute notification to parent ${contract.parentId}`
          );
        } else if (status === ParentSubscriptionStatus.PENDING_COMPLETION) {
          await this.pushToUser(
            contract.parentId,
            "✅ Contract Completed",
            `${tutor?.firstName} ${tutor?.lastName} has marked the contract${offer?.childName ? ` for ${offer.childName}` : ""} as completed.`,
            {
              type: NotificationType.CONTRACT_COMPLETED,
              contractId: contract.id,
              completedBy: tutorId,
            },
            undefined,
            `/contracts/${contract.id}`
          );
          console.log(
            `✅ Sent completion notification to parent ${contract.parentId}`
          );
        }
      } catch (notificationError) {
        console.error("❌ Error sending notification:", notificationError);
      }

      // 7. Return contract with completed sessions count
      return {
        contract,
        // completedSessions,
        message:
          status === ParentSubscriptionStatus.DISPUTE
            ? "Contract has been disputed and forwarded to admin for review"
            : "Contract has been marked as completed",
      };
    } catch (error) {
      console.error("Error in terminateContract:", error);
      throw error;
    }
  }

  async submitContractRating(
    tutorId: string,
    contractId: string,
    rating: number,
    review: string
  ) {
    try {
      // 1. Verify contract
      const contract = await ParentSubscription.findOne({
        where: {
          id: contractId,
          tutorId: tutorId,
        },
      });

      if (!contract) {
        throw new NotFoundError("Contract not found");
      }

      if (contract.status !== ParentSubscriptionStatus.PENDING_COMPLETION) {
        throw new BadRequestError("Contract against this id is not completed");
      }

      // 3. Check if tutor already rated
      const existingReview = await ContractReview.findOne({
        where: {
          contractId: contractId,
          reviewerId: tutorId,
        },
      });

      if (existingReview) {
        throw new ConflictError("You have already rated this contract");
      }

      // 4. Create contract review
      await ContractReview.create({
        contractId: contractId,
        reviewerId: tutorId,
        reviewedId: contract.parentId,
        reviewerRole: "TUTOR",
        rating,
        review: review || undefined,
      });

      // 5. Check if parent has also rated
      const parentReview = await ContractReview.findOne({
        where: {
          contractId: contractId,
          reviewerId: contract.parentId,
        },
      });

      // 6. Update contract status
      if (parentReview) {
        // Both have rated - mark as completed
        await contract.update({
          status: ParentSubscriptionStatus.COMPLETED,
          endDate: new Date(),
        });

        await TutorSessions.update(
          {
            status: "cancelled",
          },
          {
            where: {
              offerId: contract.offerId,
              tutorId: contract.tutorId,
              parentId: contract.parentId,
              status: "active",
            },
          }
        );

        // Notify both parties
        try {
          const tutor = await User.findByPk(tutorId);
          const parent = await User.findByPk(contract.parentId);

          await this.pushToUser(
            contract.parentId,
            "✅ Contract Completed",
            "Both parties have submitted their ratings. Contract is now completed.",
            {
              type: NotificationType.CONTRACT_COMPLETED,
              contractId: contract.id,
            },
            undefined,
            `/contracts/${contract.id}`
          );

          await this.pushToUser(
            tutorId,
            "✅ Contract Completed",
            "Both parties have submitted their ratings. Contract is now completed.",
            {
              type: NotificationType.CONTRACT_COMPLETED,
              contractId: contract.id,
            },
            undefined,
            `/contracts/${contract.id}`
          );
        } catch (notificationError) {
          console.error(
            "❌ Error sending completion notification:",
            notificationError
          );
        }
      } else {
        // Only tutor rated - mark as pending_completion
        await contract.update({
          status: ParentSubscriptionStatus.PENDING_COMPLETION,
        });

        // Notify parent to submit rating
        try {
          const tutor = await User.findByPk(tutorId);

          await this.pushToUser(
            contract.parentId,
            "⭐ Rating Request",
            `${tutor?.firstName} ${tutor?.lastName} has submitted their rating. Please submit yours to complete the contract.`,
            {
              type: NotificationType.CONTRACT_RATING_SUBMITTED,
              contractId: contract.id,
              rating: rating.toString(),
            },
            undefined,
            `/contracts/${contract.id}`
          );
        } catch (notificationError) {
          console.error(
            "❌ Error sending rating notification:",
            notificationError
          );
        }
      }

      return {
        contract,
        message: parentReview
          ? "Contract completed! Both parties have rated."
          : "Rating submitted. Waiting for parent to rate.",
      };
    } catch (error) {
      console.error("Error in submitContractRating:", error);
      throw error;
    }
  }

  async getActiveContractsForDispute(tutorId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Get all active contracts that can be disputed
      // Statuses that can be disputed: 'active', 'pending_completion'
      const { rows, count } = await ParentSubscription.findAndCountAll({
        where: {
          tutorId: tutorId,
        },
        include: [
          {
            model: User,
            foreignKey: "parentId",
            attributes: ["id", "fullName", "email", "image", "phone"],
          },
          {
            model: Offer,
            attributes: [
              "id",
              "childName",
              "subject",
              "amountMonthly",
              "startDate",
              "startTime",
              "endTime",
              "daysOfWeek",
              "description",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      console.log("fadsfasdf");

      // Calculate completed sessions and get all related data for each contract
      const contractsWithDetails = await Promise.all(
        rows.map(async (contract) => {
          // Get completed sessions count
          const completedSessions = await TutorSessionsDetail.count({
            where: {
              tutorId: contract.tutorId,
              parentId: contract.parentId,
              status: TutorSessionStatus.COMPLETED,
            },
            include: [
              {
                model: TutorSessions,
                where: { offerId: contract.offerId },
                required: true,
              },
            ],
          });
          console.log("we herer !");

          // Get total active sessions count
          const totalSessions = await TutorSessions.count({
            where: {
              offerId: contract.offerId,
              tutorId: contract.tutorId,
              parentId: contract.parentId,
              status: "active",
            },
          });

          // Get all contract reviews (both parent and tutor reviews)
          const contractReviews = await ContractReview.findAll({
            where: {
              contractId: contract.id,
            },
            include: [
              {
                model: User,
                as: "reviewer",
                attributes: ["id", "fullName", "email", "image"],
              },
              {
                model: User,
                as: "reviewed",
                attributes: ["id", "fullName", "email", "image"],
              },
            ],
            order: [["createdAt", "DESC"]],
          });

          // Get parent user details
          const parent = await User.findByPk(contract.parentId, {
            attributes: ["id", "fullName", "email", "image", "phone"],
          });

          // Check if parent has already reviewed
          const parentReview = contractReviews.find(
            (review) => review.reviewerId === contract.parentId
          );

          // Check if tutor has already reviewed
          const tutorReview = contractReviews.find(
            (review) => review.reviewerId === tutorId
          );

          // Get payment requests for this tutor (PaymentRequests doesn't have subscriptionId field)
          const paymentRequests = await PaymentRequests.findAll({
            where: {
              tutorId: tutorId,
            },
            order: [["createdAt", "DESC"]],
            limit: 10, // Limit to recent payment requests
          });

          return {
            ...contract.toJSON(),
            parent: parent,
            completedSessions,
            totalSessions,
            reviews: contractReviews.map((review) => {
              const reviewData = review.toJSON() as any;
              return {
                id: review.id,
                reviewerId: review.reviewerId,
                reviewedId: review.reviewedId,
                reviewerRole: review.reviewerRole,
                rating: review.rating,
                review: review.review,
                reviewer: reviewData.reviewer || null,
                reviewed: reviewData.reviewed || null,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
              };
            }),
            hasParentReview: !!parentReview,
            hasTutorReview: !!tutorReview,
            parentReview: parentReview
              ? {
                  id: parentReview.id,
                  reviewerId: parentReview.reviewerId,
                  reviewedId: parentReview.reviewedId,
                  reviewerRole: parentReview.reviewerRole,
                  rating: parentReview.rating,
                  review: parentReview.review,
                  createdAt: parentReview.createdAt,
                }
              : null,
            tutorReview: tutorReview
              ? {
                  id: tutorReview.id,
                  reviewerId: tutorReview.reviewerId,
                  reviewedId: tutorReview.reviewedId,
                  reviewerRole: tutorReview.reviewerRole,
                  rating: tutorReview.rating,
                  review: tutorReview.review,
                  createdAt: tutorReview.createdAt,
                }
              : null,
            paymentRequests: paymentRequests.map((pr) => ({
              id: pr.id,
              amount: pr.amount,
              status: pr.status,
              createdAt: pr.createdAt,
              updatedAt: pr.updatedAt,
            })),
            canDispute: true, // All contracts returned can be disputed
          };
        })
      );

      return {
        contracts: contractsWithDetails,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error in getActiveContractsForDispute:", error);
      throw error;
    }
  }

  async createHelpRequestAgainstContract(
    tutorId: string,
    requesterRole: UserRole,
    contractId: string,
    subject: string,
    message: string
  ) {
    try {
      let contract: any;

      console.log("requesterRole", requesterRole);
      console.log("contractId", contractId);
      console.log("tutorId", tutorId);

      if (requesterRole === UserRole.TUTOR) {
        contract = await ParentSubscription.findOne({
          where: {
            id: contractId,
            tutorId: tutorId,
          },
        });
      } else if (requesterRole === UserRole.PARENT) {
        contract = await ParentSubscription.findOne({
          where: {
            id: contractId,
            parentId: tutorId,
          },
        });
      }

      if (!contract) {
        throw new NotFoundError(
          "Contract not found or you don't have permission to create help request for this contract"
        );
      }

      const data: any = {
        parentId: contract.parentId,
        tutorId: contract.tutorId,
        contractId: contract.id,
      };

      // Create help request against the parent from this contract
      const helpRequest = await HelpRequests.create({
        requesterId:
          requesterRole === UserRole.TUTOR ? tutorId : contract.parentId,
        againstId:
          requesterRole === UserRole.TUTOR ? contract.parentId : tutorId,
        requester: requesterRole,
        subject: `Contract Help Request: ${subject}`,
        message: `Contract ID: ${contractId}\n\n${message}`,
        status: HelpRequestStatus.OPEN,
        type: HelpRequestType.CONTRACT,
        data,
      });

      const contractData = contract.toJSON() as any;

      return {
        helpRequest,
        contract: {
          id: contract.id,
          parentName: contractData.parent?.fullName,
          childName: contractData.Offer?.childName,
          subject: contractData.Offer?.subject,
        },
      };
    } catch (error) {
      console.error("Error in createHelpRequestAgainstContract:", error);
      throw error;
    }
  }

  async updateTutorDocuments(
    userId: string,
    data: {
      resume?: Express.Multer.File;
      idFront?: Express.Multer.File;
      idBack?: Express.Multer.File;
    }
  ) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      const userFolder = path.join("uploads", "tutors", userId.toString());
      const updateData: any = {};

      const uploadPromises = [];
      if (data.resume) {
        uploadPromises.push(
          uploadFile(data.resume, userFolder, "resume").then((url) => {
            updateData.resumeUrl = url;
          })
        );
      }
      if (data.idFront) {
        uploadPromises.push(
          uploadFile(data.idFront, userFolder, "id-front").then((url) => {
            updateData.idFrontUrl = url;
          })
        );
      }
      if (data.idBack) {
        uploadPromises.push(
          uploadFile(data.idBack, userFolder, "id-back").then((url) => {
            updateData.idBackUrl = url;
          })
        );
      }

      await Promise.all(uploadPromises);

      if (Object.keys(updateData).length > 0) {
        await tutor.update(updateData);
      }

      return tutor;
    } catch (error) {
      console.error("Error in updateTutorDocuments:", error);
      throw error;
    }
  }
}

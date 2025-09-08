import { ConflictError } from "../../errors/conflict-error";
import { BadRequestError } from "src/errors/bad-request-error";
import { NotFoundError } from "../../errors/not-found-error";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ITutorOnboardingDTO } from "./tutor.dto";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import geohash from "ngeohash";
import { PaymentStatus } from "../../constant/enums";

import {
  User,
  Tutor,
  Subject,
  TutorEducation,
  TutorExperience,
  TutorSettings,
  ChildNotes,
  ChildReview,
  TutorLocation,
  TutorSessions,
  TutorSessionsDetail,
  TutorTransaction,
} from "@ustaad/shared";
import {
  TutorPaymentStatus,
  TutorSessionStatus,
} from "@ustaad/shared/dist/constant/enums";

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
  fullName?: string;
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
}

interface EducationData {
  institute: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

interface PaymentRequestData {
  tutorId: string;
  txnId: string;
  amount: number;
}

export default class TutorService {
  tutorModel = Tutor;

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

      const formattedSubjects = Array.isArray(data.subjects)
        ? data.subjects
        : (data.subjects as string)
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s: string) => s.trim().replace(/^['"]|['"]$/g, ""));

      const tutor = await Tutor.create({
        userId: data.userId,
        bankName: data.bankName,
        subjects: formattedSubjects,
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

      let emailChanged = false;
      let phoneChanged = false;

      if (data.email && data.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: data.email },
        });
        if (existingUser) {
          throw new ConflictError("Email is already taken");
        }
        emailChanged = true;
      }

      if (data.phone && data.phone !== user.phone) {
        const existingUser = await User.findOne({
          where: { phone: data.phone },
        });
        if (existingUser) {
          throw new ConflictError("Phone number is already taken");
        }
        phoneChanged = true;
      }

      // ✅ Reset verification flags if changed
      if (emailChanged) {
        data.isEmailVerified = false;
      }

      if (phoneChanged) {
        data.isPhoneVerified = false;
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

  async getProfile(userId: string) {
    try {
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
            ],
          },
        ],
      });

      const experiences = await TutorExperience.findAll({ where: { tutorId: userId } });

      // Calculate total experience in years
      let totalExperience = 0;
      experiences.forEach(exp => {
        const startDate = new Date(exp.startDate);
        const endDate = new Date(exp.endDate);
        const diffInYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        totalExperience += diffInYears;
      });

      const sessions = await TutorSessions.findAll({ where: { tutorId: userId, status: "active" } });

      // Get today's day name in lowercase
      const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

      // Count sessions scheduled for today
      let totalSessions = 0;
      sessions.forEach(session => {
        // Check if today is in the session's days of week
        if (session.daysOfWeek.some(day => {
          if (day.includes('-')) {
            // Handle ranges like "mon-fri"
            const [start, end] = day.split('-');
            const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const startIdx = days.indexOf(start);
            const endIdx = days.indexOf(end);
            const todayIdx = days.indexOf(today);
            return todayIdx >= startIdx && todayIdx <= endIdx;
          } else {
            // Handle individual days
            return day === today;
          }
        })) {
          totalSessions++;
        }
      });

      return {
        user,
        totalExperience: Math.round(totalExperience * 10) / 10, // Round to 1 decimal place
        totalSessions
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

  async addAbout(userId: string, about: string, grade: string) {
    try {
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      await tutor.update({ about, grade });

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
    return await Tutor.findOne({ where: { userId } });
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
    const subjectsToAdd = newSubjects.filter(s => !currentSubjects.includes(s));
    const subjectsToRemove = currentSubjects.filter(s => !newSubjects.includes(s));

    // Update tutor profile subjects
    const updatedSubjects = [...currentSubjects, ...subjectsToAdd]
      .filter(s => !subjectsToRemove.includes(s));

    await tutorProfile.update({ subjects: updatedSubjects });

    // Update settings
    if (existingSettings) {
      return await existingSettings.update(settings);
    }
    return await this.setTutorSettings(tutorId, settings);
  }

  async createChildNote(data: {
    childId: string;
    tutorId: string;
    headline: string;
    description: string;
  }) {
    return await ChildNotes.create(data);
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
      console.log("Finding tutors with params:", { parentLat, parentLng, radiusKm, category });

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
              attributes: ["id", "fullName", "email", "phone", "image"],
              include: [
                {
                  model: Tutor,
                  attributes: ["subjects", "about", "grade"],
                  required: false, // Always include Tutor data
                }
              ],
              required: true, // Make sure User is always included
            }
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
        
        console.log("Raw query result sample:", JSON.stringify(allTutors[0], null, 2));
        
        // Remove duplicates by tutorId (in case a tutor has multiple locations)
        const uniqueTutors = allTutors.filter((tutor, index, self) => 
          index === self.findIndex(t => t.tutorId === tutor.tutorId)
        );
        
        // Apply pagination if we were filtering by category
        const finalResults = category ? 
          uniqueTutors.slice(offset, offset + limit) : 
          uniqueTutors;
        
        console.log("Found tutors:", allTutors.length, "Unique tutors:", uniqueTutors.length, "Final results:", finalResults.length);
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
                attributes: ["subjects", "about", "grade"],
                required: false, // Always include Tutor data
              }
            ],
            required: true, // Make sure User is always included
          }
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
      
      console.log("Raw nearby tutors result sample:", JSON.stringify(nearbyTutors[0], null, 2));
      
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
          return {
            ...tutorLocation.toJSON(),
            distance,
          };
        })
        .filter((tutor) => tutor.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      // Remove duplicates by tutorId (in case a tutor has multiple locations)
      const uniqueTutors = tutorsWithDistance.filter((tutor, index, self) => 
        index === self.findIndex(t => t.tutorId === tutor.tutorId)
      );

      // Apply pagination if we were filtering by category
      const finalResults = category ? 
        uniqueTutors.slice(offset, offset + limit) : 
        uniqueTutors;

      console.log("Final unique tutors:", uniqueTutors.length, "Final results:", finalResults.length);
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

      // Check if tutor has sufficient balance
      if (tutor.balance < data.amount) {
        throw new BadRequestError(
          `Insufficient balance. Available balance: ${tutor.balance}, Requested amount: ${data.amount}`
        );
      }

      // Create payment request
      const paymentRequest = await TutorTransaction.findOne({
        where: {
          id: data.txnId,
          tutorId: data.tutorId,
        },
      });

      if (!paymentRequest) {
        throw new UnProcessableEntityError("Payment request not found");
      }

      if (paymentRequest.status === TutorPaymentStatus.REQUESTED) {
        throw new UnProcessableEntityError(
          "Payment request is already requested"
        );
      }

      if (paymentRequest.status === TutorPaymentStatus.PAID) {
        throw new UnProcessableEntityError("Payment request is already paid");
      }

      await paymentRequest.update({
        status: TutorPaymentStatus.REQUESTED,
      });

      return paymentRequest;
    } catch (error) {
      console.error("Error in createPaymentRequest:", error);
      throw error;
    }
  }

  async getPaymentRequests(tutorId: string) {
    try {
      const tutor = await Tutor.findByPk(tutorId);
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor not found");
      }

      // Get all payment requests for the tutor
      const paymentRequests = await TutorTransaction.findAll({
        where: { tutorId },
        order: [["createdAt", "DESC"]],
      });

      return { paymentRequests, balance: tutor.balance };
    } catch (error) {
      console.error("Error in getPaymentRequests:", error);
      throw error;
    }
  }

  // Tutor Sessions Methods
  async getTutorSessions(userId: string) {
    const sessions = await TutorSessions.findAll({
      where: { tutorId: userId },
      include: [
        {
          model: User,
          attributes: ["id", "fullName"],
        },
      ],
    });


    const runningSessions = await TutorSessionsDetail.findAll({
      where: { tutorId: userId, status: TutorSessionStatus.CREATED },
      include: [
        {
          model: User,
          attributes: ["id", "fullName"],
        },
      ],
    })
    return { sessions, runningSessions };
  }
  async getTutorSession(userId: string, sessionId: string ) {
    const session = await TutorSessionsDetail.findAll({
      where: { tutorId: userId, sessionId: sessionId },
      include: [
        {
          model: User,
          attributes: ["id", "fullName"],
        },
      ],
    });

    return session;
  }

  async addTutorSession(userId: string, data: TutorSessionsDetail) {
    const session = await TutorSessions.findOne({
      where: { id: data.sessionId, tutorId: userId, parentId: data.parentId },
    });

    if (!session) {
      throw new UnProcessableEntityError("Tutor session not found");
    }

    // Check if session detail already exists for the same day
    const existingSessionDetail = await TutorSessionsDetail.findOne({
      where: {
        tutorId: userId,
        parentId: data.parentId,
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

    return await TutorSessionsDetail.create({ tutorId: userId, ...data });
  }

  async deleteTutorSession(userId: string, sessionId: string) {
    return await TutorSessionsDetail.destroy({
      where: { id: sessionId, tutorId: userId },
    });
  }

  async editTutorSession(data: TutorSessionsDetail) {
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

    await session.update({ ...data });

    return await TutorSessionsDetail.update(
      { ...data },
      { where: { id: data.id, tutorId: data.tutorId, parentId: data.parentId } }
    );
  }
}

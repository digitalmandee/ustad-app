import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import { BadRequestError } from "src/errors/bad-request-error";
// import { User } from "../../models/User";
// import { Tutor } from "../../models/Tutor";
// import { TutorExperience } from "../../models/TutorExperience";
// import { TutorEducation } from "../../models/TutorEducation";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ITutorOnboardingDTO } from "./tutor.dto";
import bcrypt from "bcrypt";
// import { TutorSettings, SubjectCostSetting } from "../../models/TutorSettings";
// import { ChildNotes } from '../../models/ChildNotes';
// import { ChildReview } from '../../models/ChildReview';
import { Op } from "sequelize";
import geohash from "ngeohash";



import { User, Tutor, Subject, TutorEducation, TutorExperience, TutorSettings, ChildNotes, ChildReview, TutorLocation } from "@ustaad/shared";

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
  image?:string
  isEmailVerified?:boolean;
  isPhoneVerified?:boolean;
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
        const existingUser = await User.findOne({ where: { email: data.email } });
        if (existingUser) {
          throw new ConflictError("Email is already taken");
        }
        emailChanged = true;
      }
  
      if (data.phone && data.phone !== user.phone) {
        const existingUser = await User.findOne({ where: { phone: data.phone } });
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
            ],
          },
        ],
      });

      if (!user) {
        throw new UnProcessableEntityError("User not found");
      }

      return user;
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
        ...data,
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

      const experience = await TutorExperience.findAll({
        where: { tutorId: tutor.userId },
      });

      return experience;
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
        ...data,
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

      const education = await TutorEducation.findAll({
        where: { tutorId: tutor.userId },
      });

      return education;
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
    } catch (error) {
      console.error("Error in deleteEducation:", error);
      throw error;
    }
  }

  async addAbout(userId: string, about: string, grade: string) {
    try {
      console.log(userId);

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
    return this.tutorModel.findOne({ where: { userId } });
  }

  async setTutorSettings(tutorId: string, settings: { minSubjects: number; maxStudentsDaily: number; subjectCosts: Record<string, SubjectCostSetting> }) {
    return TutorSettings.create({ tutorId, ...settings });
  }

  async getTutorSettings(tutorId: string) {
    return TutorSettings.findOne({ where: { tutorId } });
  }

  async updateTutorSettings(tutorId: string, settings: { minSubjects: number; maxStudentsDaily: number; subjectCosts: Record<string, SubjectCostSetting> }) {
    const tutorSettings = await TutorSettings.findOne({ where: { tutorId } });
    if (!tutorSettings) throw new Error("Tutor settings not found");
    return tutorSettings.update(settings);
  }

  async createChildNote(data: { childId: string; tutorId: string; headline: string; description: string; }) {
    return await ChildNotes.create(data);
  }

  async createChildReview(data: { childId: string; tutorId: string; rating: number; review: string; }) {
    return await ChildReview.create(data);
  }

  async addTutorLocation(
    userId: string,
    data: { latitude: number; longitude: number; address?: string }
  ) {
    const { latitude, longitude, address } = data;
    const geoHash = geohash.encode(latitude, longitude, 7);

    try {
      // Step 1: Find tutor by userId
      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError(
          "Tutor profile not found for this user."
        );
      }

      const tutorId = tutor.id;

      // Step 2: Check for duplicate location
      const existing = await TutorLocation.findOne({
        where: { tutorId, latitude, longitude },
      });

      if (existing) {
        throw new ConflictError("This location already exists for the tutor.");
      }

      // Step 3: Save new location
      await TutorLocation.create({
        tutorId,
        latitude,
        longitude,
        address,
        geoHash,
      });

      // Step 4: Return all locations (latest first)
      return await TutorLocation.findAll({
        where: { tutorId },
        order: [["createdAt", "DESC"]],
        attributes: { exclude: ["geoHash"] },
      });
    } catch (error: any) {
      console.error("Error in addTutorLocation:", error);

      // Let known errors bubble up
      if (
        error instanceof UnProcessableEntityError ||
        error instanceof ConflictError
      ) {
        throw error;
      }

      throw new GenericError(error, "Failed to add tutor location");
    }
  }

  async findTutorsByLocation(parentLat: number, parentLng: number,radiusKm: number,limit = 20, offset = 0 ) {
    const parentGeoHash = geohash.encode(parentLat, parentLng, 7);
    const neighbors = geohash.neighbors(parentGeoHash); // returns 8 surrounding geohashes
    const geoHashes = [parentGeoHash, ...neighbors]; // total 9 cells
    try {
      if (!geoHashes || geoHashes.length === 0) {
        throw new BadRequestError("Could not process it. geohashes for spatial search could not be generated.");
      }

      const rawResults = await TutorLocation.findAll({
        where: {
          geoHash: { [Op.in]: geoHashes },
        },
        include: [
          {
            model: Tutor,
            as: "tutor",
            include: [
              { model: User, attributes: ["id", "name"] },
              { model: Subject, attributes: ["name"] },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      // Clean up and add `withinRadius`
      const processed = rawResults.map((loc: any) => {
        const distance = this.calculateDistanceKm(
          parentLat,
          parentLng,
          loc.latitude,
          loc.longitude
        );

        const locJson = loc.toJSON() as any;

        return {
          ...locJson,
          withinRadius: distance <= radiusKm,
          distance: Number(distance.toFixed(2)), // optional: add distance info
        };
      });

      return processed;
    } catch (err: any) {
      console.error("Error in findTutorsByLocation:", err);
      throw new GenericError(err, "Unable to search tutors by location");
    }
  }

  calculateDistanceKm(lat1: number,lon1: number,lat2: number,lon2: number): number {
    const toRad = (val: number) => (val * Math.PI) / 180;
    const R = 6371; // Radius of Earth in KM

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

}

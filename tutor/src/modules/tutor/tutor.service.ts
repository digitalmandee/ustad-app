import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import { User } from "../../models/User";
import { Tutor } from "../../models/Tutor";
import { TutorExperience } from "../../models/TutorExperience";
import { TutorEducation } from "../../models/TutorEducation";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { ITutorOnboardingDTO } from "./tutor.dto";
import bcrypt from "bcrypt";

interface TutorProfileData extends ITutorOnboardingDTO {
  resume: Express.Multer.File;
  idFront: Express.Multer.File;
  idBack: Express.Multer.File;
}

interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
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

  async addAbout(userId: string, about: string) {
    try {
      console.log(userId);

      const tutor = await Tutor.findOne({ where: { userId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor profile not found");
      }

      await tutor.update({ about });
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
}

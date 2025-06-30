import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
// import { User } from "../../models/User";
// import { Tutor } from "../../models/Tutor";
// import { TutorExperience } from "../../models/TutorExperience";
// import { TutorEducation } from "../../models/TutorEducation";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { IParentOnboardingDTO } from "./parent.dto";
import bcrypt from "bcrypt";
// import { Parent } from "../../models/Parent";

import { Parent, User, Tutor, TutorEducation, TutorExperience } from "@ustaad/shared";

interface ParentProfileData {
  userId: string;
  idFront: Express.Multer.File;
  idBack: Express.Multer.File;
}

interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export default class TutorService {
  async createParentProfile(data: ParentProfileData) {
    try {
      // Check if user exists

      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new UnProcessableEntityError(
          "User not registered with provided email or phone."
        );
      }

      // Check if tutor profile already exists
      const existingTutor = await Parent.findOne({
        where: { userId: data.userId },
      });
      if (existingTutor) {
        throw new ConflictError("This parent profile already registered.");
      }

      // Create folder for user documents
      const userFolder = path.join(
        "uploads",
        "parents",
        data.userId.toString()
      );

      // Upload files
      const [idFrontUrl, idBackUrl] = await Promise.all([
        uploadFile(data.idFront, userFolder, "id-front"),
        uploadFile(data.idBack, userFolder, "id-back"),
      ]);

      const parent = await Parent.create({
        userId: data.userId,
        idFrontUrl,
        idBackUrl,
      });

      return parent;
    } catch (error) {
      console.error("Error in createParentProfile:", error);
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
}

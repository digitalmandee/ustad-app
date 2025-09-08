import { IsOnBaord, UserRole } from "../../constant/enums";
import {
  User,
  Parent,
  Tutor,
  TutorEducation,
  TutorExperience,
  Child,
  ParentTransaction,
  ParentSubscription,
  TutorTransaction,
} from "@ustaad/shared";
import { TutorPaymentStatus } from "@ustaad/shared/dist/constant/enums";
import { Op } from "sequelize";
import bcrypt from "bcrypt";

export default class AdminService {
  async getStats(days?: number) {
    let dateFilter = {};

    // If days parameter is provided, filter by date range
    if (days && [7, 30, 90].includes(days)) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      dateFilter = {
        createdAt: {
          [Op.gte]: startDate,
        },
      };
    }

    const totalUsers = await User.count({
      where: {
        ...dateFilter,
      },
    });

    const totalParents = await User.count({
      where: {
        role: UserRole.PARENT,
        ...dateFilter,
      },
    });

    const totalTutors = await User.count({
      where: {
        role: UserRole.TUTOR,
        ...dateFilter,
      },
    });

    // Get additional stats for the time period
    const totalSubscriptions = await ParentSubscription.count({
      where: {
        ...dateFilter,
      },
    });

    const totalTransactions = await ParentTransaction.count({
      where: {
        ...dateFilter,
      },
    });

    const totalRevenue =
      (await ParentTransaction.sum("amount", {
        where: {
          status: "created", // or whatever status indicates completed transactions
          ...dateFilter,
        },
      })) || 0;

    return {
      totalUsers,
      totalParents,
      totalTutors,
      totalSubscriptions,
      totalTransactions,
      totalRevenue: parseFloat(totalRevenue.toString()),
      period: days ? `${days} days` : "all time",
    };
  }

  async getAllParents(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Parent.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email", "phone", "image", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }

  async getParentById(id: string) {
    // id refers to parent.userId or parent.id? We'll support both
    const parent = await Parent.findOne({
      where: { [Op.or]: [{ id }, { userId: id }] },
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email", "phone", "image", "role"],
        },
      ],
    });
    if (!parent) return null;

    // Fetch associated data
    const children = await Child.findAll({ where: { userId: parent.userId } });
    const subscriptions = await ParentSubscription.findAll({
      where: { parentId: parent.userId },
    });
    const transactions = await ParentTransaction.findAll({
      where: { parentId: parent.userId },
    });

    return { parent, children, subscriptions, transactions };
  }

  async getAllTutors(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Tutor.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email", "phone", "image", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }

  async getTutorById(id: string) {
    const tutor = await Tutor.findOne({
      where: { [Op.or]: [{ id }, { userId: id }] },
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email", "phone", "image", "role"],
        },
      ],
    });
    if (!tutor) return null;

    const education = await TutorEducation.findAll({
      where: { tutorId: tutor.userId },
    });
    const experience = await TutorExperience.findAll({
      where: { tutorId: tutor.userId },
    });
    const transactions = await TutorTransaction.findOne({
      where: { tutorId: tutor.userId },
    });

    // Calculate total experience in years
    const totalExperience = experience.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = new Date(exp.endDate);
      const years =
        (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      return total + years;
    }, 0);

    // Extract document paths for easier access
    const documents = {
      resume: tutor.resumeUrl,
      idFront: tutor.idFrontUrl,
      idBack: tutor.idBackUrl,
    };

    return {
      tutor,
      education,
      experience,
      totalExperience,
      documents,
      transactions,
    };
  }

  async getAllPaymentRequests() {
    const paymentRequests = await TutorTransaction.findAll();
    return paymentRequests;
  }

  async getPaymentRequestById(id: string) {
    const paymentRequest = await TutorTransaction.findByPk(id);
    if (!paymentRequest) {
      throw new Error("Payment request not found");
    }

    const user = await User.findOne({ where: { id: paymentRequest.tutorId } });
    if (!user) {
      throw new Error("User not found");
    }

    const tutor = await Tutor.findOne({ where: { userId: paymentRequest.tutorId } });
    if (!tutor) {
      throw new Error("Tutor not found");
    }

    return {
      paymentRequest,
      tutor: {
        id: tutor.userId,
        bankName: tutor.bankName,
        accountNumber: tutor.accountNumber,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async updatePaymentRequestStatus(id: string, status: string) {
    const paymentRequest = await TutorTransaction.findByPk(id);
    paymentRequest.status = status as TutorPaymentStatus;
    await paymentRequest.save();
    return paymentRequest;
  }

  async createAdmin(userData: {
    fullName: string;
    email: string;
    password: string;
  }) {
    // Check if user with email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create admin user
    const adminUser = await User.create({
      fullName: userData.fullName,
      email: userData.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isAdminVerified: true,
      isOnBoard: IsOnBaord.APPROVED,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    // Remove password from response
    const { password, ...adminUserResponse } = adminUser.toJSON();
    return adminUserResponse;
  }

  async getAllAdmins(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      where: {
        role: {
          [Op.in]: [UserRole.ADMIN],
        },
      },
      attributes: ["id", "fullName", "email", "role", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }

  async deleteAdmin(id: string) {
    const admin = await User.findByPk(id);
    if (!admin) {
      throw new Error("Admin not found");
    }
    await admin.destroy();
    await admin.save();
    return admin;
  }

  async getPendingOnboardUsers(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      where: {
        role: UserRole.TUTOR,
        isOnBoard: IsOnBaord.PENDING,
        isDeleted: false,
      },
      attributes: [
        "id", 
        "fullName", 
        "email", 
        "phone", 
        "role", 
        "image",
        "isOnBoard",
        "isAdminVerified",
        "isEmailVerified",
        "isPhoneVerified",
        "createdAt",
        "updatedAt"
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }

  async approveOnboarding(userId: string) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isDeleted) {
      throw new Error("Cannot approve deleted user");
    }

    if (user.isOnBoard === IsOnBaord.APPROVED) {
      throw new Error("User is already approved");
    }

    // Update user onboarding status
    await user.update({
      isOnBoard: IsOnBaord.APPROVED,
      isAdminVerified: true,
    });

    // Return updated user without password
    const updatedUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["password"]
      }
    });

    return updatedUser;
  }
}

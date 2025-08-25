import { UserRole } from "../../constant/enums";
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
    return paymentRequest;
  }

  async updatePaymentRequestStatus(id: string, status: string) {
    const paymentRequest = await TutorTransaction.findByPk(id);
    paymentRequest.status = status as TutorPaymentStatus;
    await paymentRequest.save();
    return paymentRequest;
  }
}

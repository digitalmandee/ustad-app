import { Gender, IsOnBaord, UserRole } from "@ustaad/shared";
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
  Offer,
  TutorSessionsDetail,
  TutorSessions,
  sendNotificationToUser,
  NotificationType,
  TutorSessionStatus,
  PaymentRequests,
} from "@ustaad/shared";
import { TutorPaymentStatus } from "@ustaad/shared";
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
    const paymentRequests = await PaymentRequests.findAll();
    return paymentRequests;
  }

  async getPaymentRequestById(id: string) {
    const paymentRequest = await PaymentRequests.findByPk(id);
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
    const paymentRequest = await PaymentRequests.findByPk(id);


    console.log(paymentRequest, status, "paymentRequest, status");
    
    paymentRequest.status = status as TutorPaymentStatus;
    console.log(paymentRequest, "paymentRequest");
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
      gender: Gender.OTHER,
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

  async getDisputedContracts(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { rows, count } = await ParentSubscription.findAndCountAll({
      where: {
        status: 'dispute',
      },
      include: [
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: User,
          as: 'tutor',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: Offer,
          attributes: ['id', 'childName', 'subject', 'amountMonthly'],
        },
      ],
      order: [['disputedAt', 'DESC']],
      limit,
      offset,
    });

    // Calculate completed sessions for each contract
    const contractsWithDetails = await Promise.all(
      rows.map(async (contract) => {
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

        // Get disputed by user info
        let disputedByUser = null;
        if (contract.disputedBy) {
          disputedByUser = await User.findByPk(contract.disputedBy, {
            attributes: ['id', 'fullName', 'email', 'role'],
          });
        }

        return {
          ...contract.toJSON(),
          completedSessions,
          disputedByUser,
        };
      })
    );

    return {
      items: contractsWithDetails,
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

  async resolveDispute(
    contractId: string,
    finalStatus: 'cancelled' | 'active' | 'completed',
    adminNotes?: string
  ) {
    const contract = await ParentSubscription.findByPk(contractId, {
      include: [
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: User,
          as: 'tutor',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: Offer,
          attributes: ['id', 'childName', 'subject'],
        },
      ],
    });
    
    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== 'dispute') {
      throw new Error("Contract is not in dispute status");
    }

    // Update contract
    await contract.update({
      status: finalStatus,
      endDate: finalStatus === 'cancelled' ? new Date() : contract.endDate,
    });

    // If cancelled, ensure tutor gets paid for completed days
    if (finalStatus === 'cancelled') {
      // Calculate completed sessions
      const completedSessions = await TutorSessionsDetail.findAll({
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

      // Calculate total payment amount
      const totalAmount = completedSessions.reduce((sum, session) => {
        const sessionData = session.toJSON() as any;
        return sum + (sessionData.TutorSession?.price || 0);
      }, 0);

      // Create payment request for tutor if there are completed sessions
      if (completedSessions.length > 0 && totalAmount > 0) {
        try {
          await PaymentRequests.create({
            tutorId: contract.tutorId,
            amount: totalAmount / 100, // Convert from cents to dollars if needed
            status: TutorPaymentStatus.REQUESTED,
          });
          console.log(`✅ Created payment request for tutor ${contract.tutorId} for ${completedSessions.length} completed sessions`);
        } catch (paymentError) {
          console.error('❌ Error creating payment request:', paymentError);
        }
      }
    }

    // Notify both parties
    try {
      await sendNotificationToUser({
        userId: contract.parentId,
        type: NotificationType.CONTRACT_DISPUTE_RESOLVED,
        title: '📋 Dispute Resolved',
        body: `Your contract dispute has been resolved. Final status: ${finalStatus}${adminNotes ? `. Notes: ${adminNotes.substring(0, 50)}` : ''}`,
        relatedEntityId: contract.id,
        relatedEntityType: 'contract',
        actionUrl: `/contracts/${contract.id}`,
        metadata: {
          finalStatus,
          adminNotes: adminNotes || '',
        },
      });

      await sendNotificationToUser({
        userId: contract.tutorId,
        type: NotificationType.CONTRACT_DISPUTE_RESOLVED,
        title: '📋 Dispute Resolved',
        body: `Your contract dispute has been resolved. Final status: ${finalStatus}${adminNotes ? `. Notes: ${adminNotes.substring(0, 50)}` : ''}`,
        relatedEntityId: contract.id,
        relatedEntityType: 'contract',
        actionUrl: `/contracts/${contract.id}`,
        metadata: {
          finalStatus,
          adminNotes: adminNotes || '',
        },
      });
    } catch (notificationError) {
      console.error('❌ Error sending dispute resolution notifications:', notificationError);
    }

    return contract;
  }
}

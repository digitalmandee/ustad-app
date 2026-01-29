import {
  Gender,
  IsOnBaord,
  ParentSubscriptionStatus,
  UserRole,
} from "@ustaad/shared";
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
  NotificationType,
  TutorSessionStatus,
  PaymentRequests,
  TutorReview,
  sequelize,
} from "@ustaad/shared";
import { sendNotificationToUser } from "../../services/notification.service";
import { TutorPaymentStatus } from "@ustaad/shared";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import { Sequelize } from "sequelize";
import { validate as isUUID } from "uuid";

export default class AdminService {
  async getStats(days?: number) {
    // 1. Determine if we are looking at a specific range or "All Time"
    const isRange = !!days && [7, 30, 90].includes(days);
    const now = new Date();

    // Define date boundaries for current and previous periods
    const currentStart = isRange
      ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      : null;
    const previousStart = isRange
      ? new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000)
      : null;

    // Helper to build Sequelize date filters
    const buildDateFilter = (start: Date | null, end: Date | null) => {
      if (!start || !end) return {}; // Empty filter for "All Time"
      return {
        createdAt: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
      };
    };

    // 2. Internal function to fetch all metrics based on a date filter
    const fetchStats = async (dateFilter: any) => {
      const [
        totalUsers,
        totalParents,
        totalTutors,
        totalSubscriptions,
        activeSubscriptions,
        completedSubscriptions,
        cancelledSubscriptions,
        totalTransactions,
        revenueRaw,
        pendingUserCount,
        terminatedUsers, // isDeleted: true
      ] = await Promise.all([
        User.count({
          where: {
            role: { [Op.notIn]: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
            isDeleted: false,
            ...dateFilter,
          },
        }),
        User.count({
          where: { role: UserRole.PARENT, isDeleted: false, ...dateFilter },
        }),
        User.count({
          where: { role: UserRole.TUTOR, isDeleted: false, ...dateFilter },
        }),
        ParentSubscription.count({ where: { ...dateFilter } }),
        ParentSubscription.count({
          where: { status: ParentSubscriptionStatus.ACTIVE, ...dateFilter },
        }),
        ParentSubscription.count({
          where: { status: ParentSubscriptionStatus.COMPLETED, ...dateFilter },
        }),
        ParentSubscription.count({
          where: { status: ParentSubscriptionStatus.CANCELLED, ...dateFilter },
        }),
        ParentTransaction.count({ where: { ...dateFilter } }),
        ParentTransaction.sum("amount", {
          where: { status: "created", ...dateFilter },
        }),
        User.count({
          where: {
            isDeleted: false,
            isOnBoard: {
              [Op.in]: [
                IsOnBaord.PENDING,
                IsOnBaord.IN_REVIW,
                IsOnBaord.REQUIRED,
                IsOnBaord.APPROVED,
              ],
            },
            [Op.or]: [
              { isAdminVerified: false },
              { isEmailVerified: false },
              { isPhoneVerified: false },
            ],
            ...dateFilter,
          },
        }),
        User.count({
          where: {
            isDeleted: true,
            ...dateFilter,
          },
        }),
      ]);

      return {
        totalUsers,
        totalParents,
        totalTutors,
        totalSubscriptions,
        activeSubscriptions,
        completedSubscriptions,
        cancelledSubscriptions,
        totalTransactions,
        totalRevenue: parseFloat(((revenueRaw as any) || 0).toString()),
        pendingUserCount,
        terminatedUsers,
      };
    };

    // 3. Helper for calculating percentage changes
    const calculatePct = (curr: number, prev: number) => {
      if (!isRange || prev === 0) return 0; // Always 0 for All Time or if previous period had no data
      return Number((((curr - prev) / prev) * 100).toFixed(2));
    };

    const calculateDelta = (curr: number, prev: number) => {
      if (!isRange) return 0; // No delta for All Time
      return curr - prev;
    };

    // 4. Execution Logic
    const currentStats = await fetchStats(
      isRange ? buildDateFilter(currentStart!, now) : {}
    );

    // If All Time, we skip the previous period fetch and return 0s for comparison
    if (!isRange) {
      const metrics = Object.keys(currentStats);
      const comparison: any = {};
      metrics.forEach((key) => {
        comparison[key] = { delta: 0, percent: 0 };
      });

      return {
        ...currentStats,
        period: "all time",
        comparison,
      };
    }

    // If Range, fetch the stats for the previous window of time
    const previousStats = await fetchStats(
      buildDateFilter(previousStart!, currentStart!)
    );

    return {
      ...currentStats,
      period: `${days} days`,
      comparison: {
        totalUsers: {
          delta: calculateDelta(
            currentStats.totalUsers,
            previousStats.totalUsers
          ),
          percent: calculatePct(
            currentStats.totalUsers,
            previousStats.totalUsers
          ),
        },
        totalParents: {
          delta: calculateDelta(
            currentStats.totalParents,
            previousStats.totalParents
          ),
          percent: calculatePct(
            currentStats.totalParents,
            previousStats.totalParents
          ),
        },
        totalTutors: {
          delta: calculateDelta(
            currentStats.totalTutors,
            previousStats.totalTutors
          ),
          percent: calculatePct(
            currentStats.totalTutors,
            previousStats.totalTutors
          ),
        },
        totalSubscriptions: {
          delta: calculateDelta(
            currentStats.totalSubscriptions,
            previousStats.totalSubscriptions
          ),
          percent: calculatePct(
            currentStats.totalSubscriptions,
            previousStats.totalSubscriptions
          ),
        },
        activeSubscriptions: {
          delta: calculateDelta(
            currentStats.activeSubscriptions,
            previousStats.activeSubscriptions
          ),
          percent: calculatePct(
            currentStats.activeSubscriptions,
            previousStats.activeSubscriptions
          ),
        },
        completedSubscriptions: {
          delta: calculateDelta(
            currentStats.completedSubscriptions,
            previousStats.completedSubscriptions
          ),
          percent: calculatePct(
            currentStats.completedSubscriptions,
            previousStats.completedSubscriptions
          ),
        },
        cancelledSubscriptions: {
          delta: calculateDelta(
            currentStats.cancelledSubscriptions,
            previousStats.cancelledSubscriptions
          ),
          percent: calculatePct(
            currentStats.cancelledSubscriptions,
            previousStats.cancelledSubscriptions
          ),
        },
        totalTransactions: {
          delta: calculateDelta(
            currentStats.totalTransactions,
            previousStats.totalTransactions
          ),
          percent: calculatePct(
            currentStats.totalTransactions,
            previousStats.totalTransactions
          ),
        },
        totalRevenue: {
          delta: Number(
            (currentStats.totalRevenue - previousStats.totalRevenue).toFixed(2)
          ),
          percent: calculatePct(
            currentStats.totalRevenue,
            previousStats.totalRevenue
          ),
        },
        terminatedUsers: {
          delta: calculateDelta(
            currentStats.terminatedUsers,
            previousStats.terminatedUsers
          ),
          percent: calculatePct(
            currentStats.terminatedUsers,
            previousStats.terminatedUsers
          ),
        },
        pendingUserCount: {
          delta: calculateDelta(
            currentStats.pendingUserCount,
            previousStats.pendingUserCount
          ),
          percent: calculatePct(
            currentStats.pendingUserCount,
            previousStats.pendingUserCount
          ),
        },
      },
      range: {
        current: {
          start: currentStart!.toISOString(),
          end: now.toISOString(),
        },
        previous: {
          start: previousStart!.toISOString(),
          end: currentStart!.toISOString(),
        },
      },
    };
  }

  async getAllParents(page = 1, limit = 20, search: string = "") {
    const offset = (page - 1) * limit;
    const hasSearch = typeof search === "string" && search.trim().length > 0;
    const searchTerm = `%${search.trim()}%`;

    const userWhere: any = {
      isAdminVerified: true,
      // isEmailVerified: true,
      // isPhoneVerified: true,
      isOnBoard: IsOnBaord.APPROVED,
      isDeleted: false,
    };

    if (hasSearch) {
      // UUID search (id)
      if (isUUID(search)) {
        userWhere.id = search;
      } else {
        userWhere[Op.or] = [
          { phone: { [Op.iLike]: searchTerm } },
          { firstName: { [Op.iLike]: searchTerm } },
          { lastName: { [Op.iLike]: searchTerm } },
          { email: { [Op.iLike]: searchTerm } },
        ];
      }
    }

    const { rows, count } = await Parent.findAndCountAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "phone",
            "image",
            "role",
            "isAdminVerified",
            "isOnBoard",
            "isPhoneVerified",
            "isEmailVerified",
          ],
          where: userWhere,
          required: true,
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
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "phone",
            "image",
            "role",
            "isAdminVerified",
            "isOnBoard",
            "isPhoneVerified",
            "isEmailVerified",
          ],
        },
      ],
    });
    if (!parent) return null;

    // Fetch associated data and counts
    const [
      children,
      childrenCount,
      subscriptions,
      subscriptionsCount,
      transactions,
      transactionsCount,
    ] = await Promise.all([
      Child.findAll({ where: { userId: parent.userId } }),
      Child.count({ where: { userId: parent.userId } }),
      ParentSubscription.findAll({ where: { parentId: parent.userId } }),
      ParentSubscription.count({ where: { parentId: parent.userId } }),
      ParentTransaction.findAll({
        where: { parentId: parent.userId },
        include: [
          {
            model: ParentSubscription,
            attributes: ["tutorId"],
          },
        ],
      }),
      ParentTransaction.count({ where: { parentId: parent.userId } }),
    ]);

    // Enrich transactions with tutor details
    const tutorIds = new Set<string>();
    const transactionsWithTutor: any[] = transactions.map((t) => {
      const json = t.toJSON() as any;
      if (json.ParentSubscription?.tutorId) {
        tutorIds.add(json.ParentSubscription.tutorId);
      }
      return json;
    });

    if (tutorIds.size > 0) {
      const tutors = await User.findAll({
        where: { id: Array.from(tutorIds) },
        attributes: ["id", "firstName", "lastName"],
      });

      const tutorMap = new Map(tutors.map((t) => [t.id, t]));

      transactionsWithTutor.forEach((t) => {
        if (t.ParentSubscription?.tutorId) {
          const tutor = tutorMap.get(t.ParentSubscription.tutorId);
          if (tutor) {
            t.tutor = {
              id: tutor.id,
              name: `${tutor.firstName} ${tutor.lastName}`,
            };
          }
        }
      });
    }

    return {
      parent,
      children,
      childrenCount,
      subscriptions,
      subscriptionsCount,
      transactions: transactionsWithTutor,
      transactionsCount,
    };
  }

  async getAllTutors(page = 1, limit = 20, search: string = "") {
    const offset = (page - 1) * limit;

    const hasSearch = typeof search === "string" && search.trim().length > 0;
    const searchTerm = `%${search.trim()}%`;

    const userWhere: any = {
      isAdminVerified: true,
      // isEmailVerified: true,
      // isPhoneVerified: true,
      isOnBoard: IsOnBaord.APPROVED,
      isDeleted: false,
    };

    if (hasSearch) {
      // UUID search (id)
      if (isUUID(search)) {
        userWhere.id = search;
      } else {
        userWhere[Op.or] = [
          { phone: { [Op.iLike]: searchTerm } },
          { firstName: { [Op.iLike]: searchTerm } },
          { lastName: { [Op.iLike]: searchTerm } },
          { email: { [Op.iLike]: searchTerm } },
        ];
      }
    }

    const { rows, count } = await Tutor.findAndCountAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "phone",
            "image",
            "role",
            "isAdminVerified",
            "isOnBoard",
            "isPhoneVerified",
            "isEmailVerified",
          ],
          where: userWhere,
          required: true,
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
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "phone",
            "image",
            "role",
            "isAdminVerified",
            "isOnBoard",
            "isPhoneVerified",
            "isEmailVerified",
          ],
        },
      ],
    });
    if (!tutor) return null;

    // Fetch associated data and counts
    const [
      education,
      educationCount,
      experience,
      experienceCount,
      transactions,
      transactionsCount,
      sessionsCount,
      reviewsCount,
    ] = await Promise.all([
      TutorEducation.findAll({ where: { tutorId: tutor.userId } }),
      TutorEducation.count({ where: { tutorId: tutor.userId } }),
      TutorExperience.findAll({ where: { tutorId: tutor.userId } }),
      TutorExperience.count({ where: { tutorId: tutor.userId } }),
      TutorTransaction.findAll({ where: { tutorId: tutor.userId } }),
      TutorTransaction.count({ where: { tutorId: tutor.userId } }),
      TutorSessions.count({ where: { tutorId: tutor.userId } }),
      TutorReview.count({ where: { tutorId: tutor.userId } }),
    ]);

    // How many times this tutor has been hired (ACTIVE + COMPLETED subscriptions)
    const timesHired = await ParentSubscription.count({
      where: {
        tutorId: tutor.userId,
        status: {
          [Op.in]: [
            ParentSubscriptionStatus.ACTIVE,
            ParentSubscriptionStatus.COMPLETED,
          ],
        },
      },
    });

    // Calculate total experience in years
    const totalExperience = experience.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      let endDate: Date;

      if (exp.endDate === "Present" || !exp.endDate) {
        endDate = new Date();
      } else {
        endDate = new Date(exp.endDate);
      }

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
      educationCount,
      experience,
      experienceCount,
      totalExperience,
      documents,
      transactions,
      transactionsCount,
      timesHired,
      sessionsCount,
      reviewsCount,
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

    const tutor = await Tutor.findOne({
      where: { userId: paymentRequest.tutorId },
    });
    if (!tutor) {
      throw new Error("Tutor not found");
    }

    return {
      paymentRequest,
      tutor: {
        id: tutor.userId,
        bankName: tutor.bankName,
        accountNumber: tutor.accountNumber,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async updatePaymentRequestStatus(id: string, status: string) {
    const paymentRequest = await PaymentRequests.findByPk(id);

    paymentRequest.status = status as TutorPaymentStatus;
    await paymentRequest.save();

    // Send notification to tutor about payment status update
    try {
      let title = "Payment Update";
      let body = `Your payment request status has been updated to ${status}`;

      if (status === TutorPaymentStatus.PAID) {
        title = "💰 Payment Received";
        body = `Your payment request for $${paymentRequest.amount} has been processed and paid.`;
      } else if (status === TutorPaymentStatus.REJECTED) {
        title = "❌ Payment Rejected";
        body = `Your payment request for $${paymentRequest.amount} has been rejected. Please contact support for more details.`;
      }

      const user = await this.getUseragsintid(paymentRequest.tutorId);

      if (!user) {
        console.log("User not found for notification");
      }

      await sendNotificationToUser(
        user.id,
        user.deviceId,
        title,
        body,
        {
          loginTime: new Date().toISOString(),
          deviceId: user.deviceId,
          role: user.role,
          userId: user.id,
        },
        "http://15.235.204.49:5000/logo.png", // imageUrl
        "/profile" // clickAction
      );
    } catch (error) {
      console.error(
        `❌ Error sending payment status notification to tutor ${paymentRequest.tutorId}:`,
        error
      );
    }

    return paymentRequest;
  }

  async createAdmin(userData: {
    firstName: string;
    lastName: string;
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
      firstName: userData.firstName,
      lastName: userData.lastName,
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
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "role",
        "createdAt",
        "updatedAt",
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

    const whereClause = {
      role: { [Op.in]: [UserRole.TUTOR, UserRole.PARENT] },
      isOnBoard: {
        [Op.in]: [
          IsOnBaord.PENDING,
          IsOnBaord.IN_REVIW,
          IsOnBaord.REQUIRED,
          IsOnBaord.APPROVED,
        ],
      },
      isDeleted: false,
      [Op.or]: [
        // { isAdminVerified: false },
        { isEmailVerified: false },
        // { isPhoneVerified: false },
      ],
    };

    // 1. Fetch the Users first
    const [usersResult, tutorCount, parentCount] = await Promise.all([
      User.findAndCountAll({
        where: whereClause,
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "role",
          "image",
          "isAdminVerified",
          "isEmailVerified",
          "isPhoneVerified",
          "isOnBoard",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      }),
      User.count({ where: { ...whereClause, role: UserRole.TUTOR } }),
      User.count({ where: { ...whereClause, role: UserRole.PARENT } }),
    ]);

    const { rows, count } = usersResult;

    // 2. Separate User IDs by role for bulk lookup
    const tutorUserIds = rows
      .filter((u) => u.role === UserRole.TUTOR)
      .map((u) => u.id);
    const parentUserIds = rows
      .filter((u) => u.role === UserRole.PARENT)
      .map((u) => u.id);

    // 3. Perform bulk lookups in the specific tables
    const [tutorProfiles, parentProfiles] = await Promise.all([
      tutorUserIds.length > 0
        ? Tutor.findAll({
            where: { userId: tutorUserIds },
            attributes: ["id", "userId"],
            raw: true,
          })
        : [],
      parentUserIds.length > 0
        ? Parent.findAll({
            where: { userId: parentUserIds },
            attributes: ["id", "userId"],
            raw: true,
          })
        : [],
    ]);

    // 4. Create lookup maps for O(1) access
    const tutorMap = Object.fromEntries(
      tutorProfiles.map((p) => [p.userId, p.id])
    );
    const parentMap = Object.fromEntries(
      parentProfiles.map((p) => [p.userId, p.id])
    );

    // 5. Merge the profile IDs back into the items
    const items = rows.map((user) => {
      const userJson = user.get({ plain: true });

      let profileId = null;
      if (userJson.role === UserRole.TUTOR) {
        profileId = tutorMap[userJson.id];
      } else if (userJson.role === UserRole.PARENT) {
        profileId = parentMap[userJson.id];
      }

      return {
        ...userJson,
        profileId: profileId || null,
        name: `${userJson.firstName} ${userJson.lastName}`.trim(),
      };
    });

    return {
      items,
      totalPending: count,
      tutorCount,
      parentCount,
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
        exclude: ["password"],
      },
    });

    try {
      const user = await this.getUseragsintid(userId);

      if (!user) {
        console.log("User not found for notification");
      }

      await sendNotificationToUser(
        user.id,
        user.deviceId,
        "Onboarding Approved",
        "Congratulations! Your account has been approved. You can now access all features.",
        {
          loginTime: new Date().toISOString(),
          deviceId: user.deviceId,
          role: user.role,
          userId: user.id,
        },
        "http://15.235.204.49:5000/logo.png", // imageUrl
        "/profile" // clickAction
      );
    } catch (error) {
      console.error(
        `❌ Error sending onboarding approval notification to user ${userId}:`,
        error
      );
    }

    return updatedUser;
  }

  async getDisputedContracts(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await ParentSubscription.findAndCountAll({
      where: {
        status: ParentSubscriptionStatus.DISPUTE,
      },
      include: [
        {
          model: Offer,
          attributes: ["id", "childName", "subject", "amountMonthly"],
        },
      ],
      order: [["disputedAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // Collect all related User IDs
    const userIds = new Set<string>();
    rows.forEach((contract) => {
      if (contract.parentId) userIds.add(contract.parentId);
      if (contract.tutorId) userIds.add(contract.tutorId);
      if (contract.disputedBy) userIds.add(contract.disputedBy);
    });

    // Fetch users in bulk
    const users = await User.findAll({
      where: {
        id: Array.from(userIds),
      },
      attributes: ["id", "firstName", "lastName", "email", "phone", "role"],
    });

    // Create a map for quick lookup
    const userMap = new Map<string, any>();
    users.forEach((user) => {
      userMap.set(user.id, user.toJSON());
    });

    // Calculate completed sessions for each contract and map users
    const contractsWithDetails = await Promise.all(
      rows.map(async (row) => {
        const contract = row.toJSON() as any;

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

        // Map users manually
        const parent = userMap.get(contract.parentId) || null;
        const tutor = userMap.get(contract.tutorId) || null;
        const disputedByUser = contract.disputedBy
          ? userMap.get(contract.disputedBy)
          : null;

        return {
          ...contract,
          completedSessions,
          parent: parent
            ? {
                id: parent.id,
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phone: parent.phone,
              }
            : null,
          tutor: tutor
            ? {
                id: tutor.id,
                firstName: tutor.firstName,
                lastName: tutor.lastName,
                email: tutor.email,
                phone: tutor.phone,
              }
            : null,
          disputedByUser: disputedByUser
            ? {
                id: disputedByUser.id,
                firstName: disputedByUser.firstName,
                lastName: disputedByUser.lastName,
                email: disputedByUser.email,
                role: disputedByUser.role,
              }
            : null,
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
    finalStatus:
      | ParentSubscriptionStatus.CANCELLED
      | ParentSubscriptionStatus.ACTIVE
      | ParentSubscriptionStatus.COMPLETED,
    adminNotes?: string
  ) {
    const contractModel = await ParentSubscription.findByPk(contractId, {
      include: [
        {
          model: Offer,
          attributes: ["id", "childName", "subject"],
        },
      ],
    });

    if (!contractModel) {
      throw new Error("Contract not found");
    }

    const contract: any = contractModel.toJSON();

    // Manually fetch related users
    const [parent, tutor] = await Promise.all([
      User.findByPk(contract.parentId, {
        attributes: ["id", "firstName", "lastName", "email"],
      }),
      User.findByPk(contract.tutorId, {
        attributes: ["id", "firstName", "lastName", "email"],
      }),
    ]);

    contract.parent = parent ? parent.toJSON() : null;
    contract.tutor = tutor ? tutor.toJSON() : null;

    if (contractModel.status !== ParentSubscriptionStatus.DISPUTE) {
      throw new Error("Contract is not in dispute status");
    }

    // Update contract
    await contractModel.update({
      status: finalStatus,
      endDate:
        finalStatus === ParentSubscriptionStatus.CANCELLED
          ? new Date()
          : contractModel.endDate,
    });

    // Update TutorSessions status based on finalStatus
    let sessionStatus: "active" | "cancelled" | "completed" | null = null;
    if (finalStatus === ParentSubscriptionStatus.ACTIVE) {
      sessionStatus = "active";
    } else if (finalStatus === ParentSubscriptionStatus.CANCELLED) {
      sessionStatus = "cancelled";
    } else if (finalStatus === ParentSubscriptionStatus.COMPLETED) {
      sessionStatus = "completed";
    }

    if (sessionStatus) {
      const tutorSession = await TutorSessions.findOne({
        where: {
          parentId: contractModel.parentId,
          tutorId: contractModel.tutorId,
          offerId: contractModel.offerId,
        },
      });

      if (tutorSession) {
        await tutorSession.update({
          status: sessionStatus,
        });
      }
    }

    // If cancelled, ensure tutor gets paid for completed days
    if (finalStatus === ParentSubscriptionStatus.CANCELLED) {
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
          console.log(
            `✅ Created payment request for tutor ${contract.tutorId} for ${completedSessions.length} completed sessions`
          );
        } catch (paymentError) {
          console.error("❌ Error creating payment request:", paymentError);
        }
      }
    }

    // Notify both parties
    try {
      const parent = await this.getUseragsintid(contract.parentId);

      if (!parent) {
        console.log("User not found for notification");
      }

      await sendNotificationToUser(
        parent.id,
        parent.deviceId,
        "Dispute Resolved",
        `Your contract dispute has been resolved. Final status: ${finalStatus}${adminNotes ? `. Notes: ${adminNotes.substring(0, 50)}` : ""}`,
        {
          loginTime: new Date().toISOString(),
          deviceId: parent.deviceId,
          role: parent.role,
          userId: parent.id,
        },
        "http://15.235.204.49:5000/logo.png", // imageUrl
        "/profile" // clickAction
      );

      const tutor = await this.getUseragsintid(contract.tutorId);

      if (!tutor) {
        console.log("User not found for notification");
      }

      await sendNotificationToUser(
        tutor.id,
        tutor.deviceId,
        "Dispute Resolved",
        `Your contract dispute has been resolved. Final status: ${finalStatus}${adminNotes ? `. Notes: ${adminNotes.substring(0, 50)}` : ""}`,
        {
          loginTime: new Date().toISOString(),
          deviceId: tutor.deviceId,
          role: tutor.role,
          userId: tutor.id,
        },
        "http://15.235.204.49:5000/logo.png", // imageUrl
        "/profile" // clickAction
      );
    } catch (notificationError) {
      console.error(
        "❌ Error sending dispute resolution notifications:",
        notificationError
      );
    }

    return contract;
  }

  async getUserDataById(id: string) {
    // First, try to find the user directly by ID
    let user = await User.findByPk(id);

    // If not found, try to find by tutor.userId or parent.userId
    if (!user) {
      const tutor = await Tutor.findOne({
        where: { [Op.or]: [{ id }, { userId: id }] },
      });

      if (tutor) {
        user = await User.findByPk(tutor.userId);
      } else {
        const parent = await Parent.findOne({
          where: { [Op.or]: [{ id }, { userId: id }] },
        });

        if (parent) {
          user = await User.findByPk(parent.userId);
        }
      }
    }

    if (!user) {
      return null;
    }

    // Fetch tutor and parent data based on user.id
    const [tutor, parent] = await Promise.all([
      Tutor.findOne({ where: { userId: user.id } }),
      Parent.findOne({ where: { userId: user.id } }),
    ]);

    // If user is a tutor, fetch education and experience data
    let tutorEducation = null;
    let tutorExperience = null;

    if (tutor) {
      [tutorEducation, tutorExperience] = await Promise.all([
        TutorEducation.findAll({
          where: { tutorId: user.id },
          order: [["createdAt", "DESC"]],
        }),
        TutorExperience.findAll({
          where: { tutorId: user.id },
          order: [["createdAt", "DESC"]],
        }),
      ]);
    }

    // Remove sensitive data
    const { password, ...userData } = user.toJSON();

    return {
      user: userData,
      tutor: tutor ? tutor.toJSON() : null,
      parent: parent ? parent.toJSON() : null,
      tutorEducation: tutorEducation
        ? tutorEducation.map((e) => e.toJSON())
        : null,
      tutorExperience: tutorExperience
        ? tutorExperience.map((e) => e.toJSON())
        : null,
    };
  }

  getUseragsintid = async (id: string) => {
    const user = await User.findByPk(id);
    return user;
  };
}

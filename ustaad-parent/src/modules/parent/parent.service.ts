import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { NotFoundError } from "../../errors/not-found-error";
import { BadRequestError } from "../../errors/bad-request-error";
import { IParentOnboardingDTO } from "./parent.dto";
import bcrypt from "bcrypt";
import { Service } from "typedi";
import {
  Parent,
  User,
  Child,
  IsOnBaord,
  Tutor,
  TutorEducation,
  TutorExperience,
  ParentSubscription,
  TutorSettings,
  PaymentMethod,
  TutorSessions,
  Offer,
  ParentTransaction,
  TutorTransaction,
  ContractReview,
  TutorSessionsDetail,
  PaymentRequests,
  NotificationType,
  TutorTransactionType,
  TutorSessionStatus,
  ParentSubscriptionStatus,
  Notification, // Added this
  OfferStatus,
  sequelize, // Needed for transaction
} from "@ustaad/shared";
import Stripe from "stripe";
import { TutorPaymentStatus } from "@ustaad/shared";
import { Op } from "sequelize";
import PayFastService from "../../services/payfast.service";
import { sendNotificationToUser } from "../../services/notification.service";

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
  image?: string;
}

export default class ParentService {
  private stripe: Stripe | null = null;
  private payfastService: PayFastService;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });
    }
    this.payfastService = new PayFastService();
  }

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

  getStripeInstance(): Stripe | null {
    return this.stripe;
  }

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

      const sessions = await TutorSessions.findAll({
        where: { parentId: userId, status: "active" },
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

      // Get all reviews for this parent from ContractReview
      // Reviews where parent is the reviewedId and reviewerRole is TUTOR
      const reviews = await ContractReview.findAll({
        where: {
          reviewedId: userId,
          reviewerRole: "TUTOR",
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
        user,
        totalSessions,
        reviews: formattedReviews,
        reviewStats: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
        },
      };
    } catch (error) {
      console.error("Error in getProfile:", error);
      throw error;
    }
  }

  async updateCustomerId(userId: string, customerId: string) {
    try {
      const parent = await Parent.findOne({
        where: { userId },
      });

      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      await parent.update({ customerId });
      return parent;
    } catch (error) {
      console.error("Error in updateCustomerId:", error);
      throw error;
    }
  }

  async getPaymentMethods(userId: string) {
    try {
      const parent = await Parent.findOne({
        where: { userId },
      });

      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      const paymentMethods = await PaymentMethod.findAll({
        where: { parentId: parent.userId },
        order: [["createdAt", "DESC"]],
      });

      return paymentMethods;
    } catch (error) {
      console.error("Error in getPaymentMethods:", error);
      throw error;
    }
  }

  async getTutorProfile(tutorId: string) {
    try {
      const user = await User.findByPk(tutorId, {
        attributes: {
          exclude: [
            "password",
            "isActive",
            "isEmailVerified",
            "isPhoneVerified",
            "deviceId",
            "phone",
          ],
        },
        include: [
          {
            model: Tutor,
            attributes: ["subjects", "about", "grade"],
          },
          {
            model: TutorSettings,
            attributes: ["minSubjects", "maxStudentsDaily", "subjectCosts"],
          },
          {
            model: TutorEducation,
            attributes: [
              "institute",
              "startDate",
              "endDate",
              "description",
              "degree",
            ],
          },
          {
            model: TutorExperience,
            attributes: [
              "id",
              "company",
              "startDate",
              "endDate",
              "description",
              "dasignation",
            ],
          },
        ],
      });

      if (!user) {
        throw new NotFoundError("Tutor not found");
      }

      // Get all reviews for this tutor from ContractReview
      // Reviews where tutor is the reviewedId and reviewerRole is PARENT
      const reviews = await ContractReview.findAll({
        where: {
          reviewedId: tutorId,
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
                fullName: reviewData.reviewer.fullName,
                email: reviewData.reviewer.email,
                image: reviewData.reviewer.image,
              }
            : null,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      });

      // Extract user data and ensure TutorExperience is included
      const userData = user.toJSON() as any;
      // TutorExperience might be directly on User or nested under Tutor
      const experience =
        userData.TutorExperiences ||
        userData.TutorExperience ||
        (userData.Tutor &&
          (userData.Tutor.TutorExperiences ||
            userData.Tutor.TutorExperience)) ||
        [];

      // Return user data with reviews and experience
      return {
        ...userData,
        experience: experience,
        reviews: formattedReviews,
        reviewStats: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
        },
      };
    } catch (error) {
      console.error("Error in getTutorProfile:", error);
      throw error;
    }
  }

  async updateOffer(offerId: string, status: string, userId: string) {
    try {
      const offer = await Offer.findByPk(offerId);
      if (!offer) {
        throw new UnProcessableEntityError("Offer not found");
      }
      if (offer.status !== OfferStatus.PENDING) {
        throw new UnProcessableEntityError(
          "Offer is already accepted or rejected"
        );
      }
      if (offer.receiverId !== userId) {
        throw new UnProcessableEntityError(
          "You are not authorized to update this offer"
        );
      }

      // Validate status
      if (!Object.values(OfferStatus).includes(status as OfferStatus)) {
        throw new UnProcessableEntityError("Invalid offer status");
      }

      // If offer is rejected, just update status + notify tutor (no payment/subscription)
      if (status === OfferStatus.REJECTED) {
        offer.status = OfferStatus.REJECTED;
        await offer.save();

        try {
          const parent = await User.findByPk(userId);
          await this.pushToUser(
            offer.senderId,
            "Offer Declined",
            `${parent?.fullName || "A parent"} has declined your tutoring offer for ${offer.childName}`,
            {
              type: NotificationType.OFFER_REJECTED,
              offerId,
              parentName: parent?.fullName || "Unknown",
              childName: offer.childName,
              subject: offer.subject,
            },
            undefined,
            `/offers/${offerId}`
          );
        } catch (notificationError) {
          console.error(
            "❌ Error sending offer rejected notification:",
            notificationError
          );
        }

        return offer;
      }

      const tutor = await Tutor.findOne({ where: { userId: offer.senderId } });
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor not found");
      }

      // Check if subscription already exists for this offer
      const existingSubscription = await ParentSubscription.findOne({
        where: {
          offerId: offerId,
          status: {
            [Op.in]: [
              ParentSubscriptionStatus.ACTIVE,
              ParentSubscriptionStatus.CREATED,
            ],
          },
        },
      });

      if (existingSubscription) {
        throw new UnProcessableEntityError(
          "Parent already has a subscription against this offer"
        );
      }

      // Get parent user for email/phone
      const parentUser = await User.findByPk(offer.receiverId);
      if (!parentUser) {
        throw new UnProcessableEntityError("Parent user not found");
      }

      // Initiate PayFast subscription payment
      const payfastResult = await this.payfastService.initiateSubscription({
        userId: offer.receiverId,
        amount: offer.amountMonthly,
        customerEmail: parentUser.email,
        customerMobile: parentUser.phone || undefined,
        offerId: offerId,
        childName: offer.childName,
      });

      // Create ParentSubscription entry with CREATED status (will be activated after payment)
      const parentSubscription = await ParentSubscription.create({
        offerId: offerId,
        parentId: offer.receiverId,
        tutorId: offer.senderId,
        basketId: payfastResult.basketId,
        status: ParentSubscriptionStatus.CREATED, // Will be activated after IPN confirms payment
        planType: "sessions",
        startDate: new Date(),
        amount: offer.amountMonthly,
        failureCount: 0,
      });

      // Create ParentTransaction entry with PENDING status
      await ParentTransaction.create({
        parentId: offer.receiverId,
        subscriptionId: parentSubscription.id,
        invoiceId: payfastResult.basketId,
        basketId: payfastResult.basketId,
        status: "created",
        orderStatus: "PENDING",
        amount: offer.amountMonthly,
        childName: offer.childName,
      });

      // Update offer status to accepted
      offer.status = OfferStatus.ACCEPTED;
      await offer.save();

      // 🔔 Notify tutor that offer was accepted (payment initiated)
      try {
        const parent = await User.findByPk(userId);
        await this.pushToUser(
          offer.senderId,
          "Offer Accepted! 🎉",
          `${parent?.fullName || "A parent"} has accepted your tutoring offer for ${offer.childName}`,
          {
            type: NotificationType.OFFER_ACCEPTED,
            offerId,
            parentName: parent?.fullName || "Unknown",
            childName: offer.childName,
            subject: offer.subject,
            amountMonthly: String(offer.amountMonthly),
            basketId: payfastResult.basketId,
          },
          undefined,
          `/offers/${offerId}`
        );
      } catch (notificationError) {
        console.error(
          "❌ Error sending offer accepted notification:",
          notificationError
        );
      }

      // Return PayFast form data to client
      // The client will submit this form to PayFast
      // After payment, IPN will activate the subscription
      // return {
      //   ...offer.toJSON(),
      //   payfastPayment: {
      //     payfastUrl: payfastResult.payfastUrl,
      //     formFields: payfastResult.formFields,
      //     basketId: payfastResult.basketId,
      //   },
      // };

      // // Update offer status
      // offer.status = status as OfferStatus;
      // await offer.save();

      // // 🔔 SEND NOTIFICATION TO TUTOR
      // try {
      //   const parent = await User.findByPk(userId);
      //   const tutor = await User.findByPk(offer.senderId);

      //   if (status === OfferStatus.ACCEPTED) {
      //     await sendNotificationToUser({
      //       userId: offer.senderId, // Tutor
      //       type: NotificationType.OFFER_ACCEPTED,
      //       title: 'Offer Accepted! 🎉',
      //       body: `${parent?.fullName || 'A parent'} has accepted your tutoring offer for ${offer.childName}`,
      //       relatedEntityId: offerId,
      //       relatedEntityType: 'offer',
      //       actionUrl: `/offers/${offerId}`,
      //       metadata: {
      //         parentName: parent?.fullName || 'Unknown',
      //         childName: offer.childName,
      //         subject: offer.subject,
      //         amountMonthly: offer.amountMonthly.toString(),
      //       },
      //     });
      //     console.log(`✅ Sent offer accepted notification to tutor ${offer.senderId}`);
      //   } else if (status === OfferStatus.REJECTED) {
      //     await sendNotificationToUser({
      //       userId: offer.senderId, // Tutor
      //       type: NotificationType.OFFER_REJECTED,
      //       title: 'Offer Declined',
      //       body: `${parent?.fullName || 'A parent'} has declined your tutoring offer for ${offer.childName}`,
      //       relatedEntityId: offerId,
      //       relatedEntityType: 'offer',
      //       actionUrl: `/offers/${offerId}`,
      //       metadata: {
      //         parentName: parent?.fullName || 'Unknown',
      //         childName: offer.childName,
      //         subject: offer.subject,
      //       },
      //     });
      //     console.log(`✅ Sent offer rejected notification to tutor ${offer.senderId}`);
      //   }
      // } catch (notificationError) {
      //   // Don't fail the offer update if notification fails
      //   console.error('❌ Error sending offer notification:', notificationError);
      // }

      return offer;
    } catch (error: any) {
      console.log(error);

      if (error instanceof UnProcessableEntityError) {
        throw error;
      }
      throw new GenericError(error, "Failed to update offer status");
    }
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    if (!this.stripe) {
      throw new Error(
        "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
      );
    }

    try {
      const parent = await Parent.findOne({
        where: { userId },
      });

      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      const subscription = await ParentSubscription.findOne({
        where: {
          id: subscriptionId,
          parentId: parent.userId,
        },
      });

      if (!subscription) {
        throw new UnProcessableEntityError("Subscription not found");
      }

      if (subscription.status === "cancelled") {
        throw new ConflictError("Subscription is already cancelled");
      }

      // Update subscription status in database
      await subscription.update({
        status: ParentSubscriptionStatus.CANCELLED,
        endDate: new Date(),
      });

      // 🔔 SEND NOTIFICATION TO TUTOR
      try {
        const parentUser = await User.findByPk(userId);
        const offer = await Offer.findByPk(subscription.offerId);

        if (offer) {
          await this.pushToUser(
            subscription.tutorId,
            "❌ Subscription Cancelled",
            `${parentUser?.fullName || "A parent"} has cancelled the subscription for ${offer.childName}`,
            {
              type: NotificationType.SUBSCRIPTION_CANCELLED_BY_PARENT,
              relatedEntityId: subscriptionId,
              relatedEntityType: "subscription",
              parentName: parentUser?.fullName || "Unknown",
              childName: offer.childName,
              subject: offer.subject,
            },
            undefined,
            `/subscriptions/${subscriptionId}`
          );
          console.log(
            `✅ Sent subscription cancelled notification to tutor ${subscription.tutorId}`
          );
        }
      } catch (notificationError) {
        console.error(
          "❌ Error sending subscription cancellation notification:",
          notificationError
        );
      }

      return {
        message: "Subscription cancelled successfully",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          endDate: subscription.endDate,
        },
      };
    } catch (error) {
      console.error("Error in cancelSubscription:", error);
      throw error;
    }
  }

  async getAllSubscriptions(userId: string): Promise<any[]> {
    try {
      const parent = await Parent.findOne({
        where: { userId },
      });

      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      if (!parent.customerId) {
        throw new UnProcessableEntityError(
          "Parent does not have a Stripe customer ID"
        );
      }

      // Get all ParentSubscription records for this parent
      const dbSubscriptions = await ParentSubscription.findAll({
        where: { parentId: parent.userId },
        order: [["createdAt", "DESC"]],
      });

      if (!dbSubscriptions || dbSubscriptions.length === 0) {
        return [];
      }

      // Get all Stripe subscriptions for this customer
      const stripeSubscriptions = await this.stripe.subscriptions.list({
        customer: parent.customerId,
        status: "all",
        expand: ["data.default_payment_method", "data.plan.product"],
        limit: 100,
      });

      // Map Stripe subscriptions by id for quick lookup
      const stripeSubsMap = new Map();
      for (const sub of stripeSubscriptions.data) {
        stripeSubsMap.set(sub.id, sub);
      }

      // Prepare result array
      return [];
    } catch (error) {
      console.error("Error in getAllSubscriptions:", error);
      throw error;
    }
  }

  // async createTutorReview(
  //   parentId: string,
  //   tutorId: string,
  //   rating: number,
  //   review: string
  // ) {
  //   try {
  //     // Check if tutor exists in users table
  //     const tutorUser = await User.findOne({
  //       where: { id: tutorId, role: "TUTOR" },
  //     });

  //     if (!tutorUser) {
  //       throw new UnProcessableEntityError("Tutor not found");
  //     }

  //     // Check if parent already reviewed this tutor
  //     const existingReview = await TutorReview.findOne({
  //       where: { parentId, tutorId },
  //     });

  //     if (existingReview) {
  //       throw new ConflictError("You have already reviewed this tutor");
  //     }

  //     // Create the review
  //     const tutorReview = await TutorReview.create({
  //       parentId,
  //       tutorId,
  //       rating,
  //       review,
  //     });

  //     // 🔔 SEND NOTIFICATION TO TUTOR
  //     try {
  //       const parent = await User.findByPk(parentId);

  //       await sendNotificationToUser({
  //         userId: tutorId,
  //         type: NotificationType.REVIEW_RECEIVED_TUTOR,
  //         title: '⭐ New Review',
  //         body: `${parent?.fullName || 'A parent'} gave you ${rating} stars${review ? `: "${review.substring(0, 50)}${review.length > 50 ? '...' : ''}"` : ''}`,
  //         relatedEntityId: tutorReview.id,
  //         relatedEntityType: 'review',
  //         actionUrl: `/reviews/${tutorReview.id}`,
  //         metadata: {
  //           rating: rating.toString(),
  //           reviewerName: parent?.fullName || 'Unknown',
  //           hasReview: !!review,
  //         },
  //       });
  //       console.log(`✅ Sent review notification to tutor ${tutorId}`);
  //     } catch (notificationError) {
  //       console.error('❌ Error sending review notification:', notificationError);
  //     }

  //     return tutorReview;
  //   } catch (error) {
  //     console.error("Error in createTutorReview:", error);
  //     throw error;
  //   }
  // }

  async getMonthlySpending(parentId: string) {
    try {
      // Calculate date range for last 6 months
      const currentDate = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

      // Get all parent transactions for the last 6 months
      const transactions = await ParentTransaction.findAll({
        where: {
          parentId: parentId,
          createdAt: {
            [Op.gte]: sixMonthsAgo,
          },
          orderStatus: {
            [Op.in]: ["SUCCESS", "FAILED"], // Include successful transactions
          },
        },
        order: [["createdAt", "ASC"]],
      });

      // Group transactions by month and calculate spending
      const monthlyData: {
        [key: string]: {
          month: string;
          spending: number;
          count: number;
          children: Set<string>;
        };
      } = {};

      // Initialize last 6 months with zero spending
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        monthlyData[monthKey] = {
          month: monthName,
          spending: 0,
          count: 0,
          children: new Set<string>(),
        };
      }

      // Sum up spending by month
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.createdAt);
        const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}`;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].spending += transaction.amount;
          monthlyData[monthKey].count += 1;
          if (transaction.childName) {
            monthlyData[monthKey].children.add(transaction.childName);
          }
        }
      });

      // Convert to array and sort by month, also convert Set to array length
      const result = Object.keys(monthlyData)
        .sort()
        .map((key) => ({
          month: monthlyData[key].month,
          spending: parseFloat(monthlyData[key].spending.toFixed(2)),
          transactionCount: monthlyData[key].count,
          childrenCount: monthlyData[key].children.size,
        }));

      // Calculate total spending and statistics
      const totalSpending = result.reduce(
        (sum, month) => sum + month.spending,
        0
      );
      const totalTransactions = result.reduce(
        (sum, month) => sum + month.transactionCount,
        0
      );
      const avgMonthlySpending = totalSpending / 6;

      // Get unique children from all transactions
      const allChildren = new Set<string>();
      transactions.forEach((transaction) => {
        if (transaction.childName) {
          allChildren.add(transaction.childName);
        }
      });

      return {
        monthlySpending: result,
        summary: {
          totalSpending: parseFloat(totalSpending.toFixed(2)),
          totalTransactions,
          averageMonthlySpending: parseFloat(avgMonthlySpending.toFixed(2)),
          totalChildren: allChildren.size,
          period: "6 months",
        },
      };
    } catch (error) {
      console.error("Error in getMonthlySpending:", error);
      throw error;
    }
  }

  async terminateContract(
    parentId: string,
    contractId: string,
    status:
      | ParentSubscriptionStatus.DISPUTE
      | ParentSubscriptionStatus.PENDING_COMPLETION,
    reason?: string
  ) {
    try {
      // 1. Verify contract exists and belongs to parent
      const contract = await ParentSubscription.findOne({
        where: {
          id: contractId,
          parentId: parentId,
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
      //     status: TutorSessionStatus.COMPLETED,
      //   },
      //   include: [
      //     {
      //       model: TutorSessions,
      //       where: { offerId: contract.offerId },
      //       required: true,
      //     },
      //   ],
      // });

      // 5. Update contract based on status
      if (status === ParentSubscriptionStatus.DISPUTE) {
        await contract.update({
          status: "dispute",
          disputeReason: reason,
          disputedBy: parentId,
          disputedAt: new Date(),
          endDate: new Date(), // Set end date to now
        } as any);
      } else if (status === ParentSubscriptionStatus.PENDING_COMPLETION) {
        await contract.update({
          status: ParentSubscriptionStatus.PENDING_COMPLETION,
          endDate: new Date(), // Set end date to now
        } as any);
      }

      // 6. Send notification to tutor
      try {
        const parent = await User.findByPk(parentId);
        const offer = await Offer.findByPk(contract.offerId);

        if (status === ParentSubscriptionStatus.DISPUTE) {
          await this.pushToUser(
            contract.tutorId,
            "⚠️ Contract Disputed",
            `${parent?.fullName || "A parent"} has disputed the contract${offer?.childName ? ` for ${offer.childName}` : ""}. Reason: ${reason?.substring(0, 50) || ""}${reason && reason.length > 50 ? "..." : ""}`,
            {
              type: NotificationType.CONTRACT_DISPUTED,
              contractId: contract.id,
              disputedBy: parentId,
              reason: reason?.substring(0, 100) || "",
            },
            undefined,
            `/contracts/${contract.id}`
          );
          console.log(
            `✅ Sent dispute notification to tutor ${contract.tutorId}`
          );
        } else if (status === ParentSubscriptionStatus.PENDING_COMPLETION) {
          await this.pushToUser(
            contract.tutorId,
            "✅ Contract Completed",
            `${parent?.fullName || "A parent"} has marked the contract${offer?.childName ? ` for ${offer.childName}` : ""} as completed.`,
            {
              type: NotificationType.CONTRACT_COMPLETED,
              contractId: contract.id,
              completedBy: parentId,
            },
            undefined,
            `/contracts/${contract.id}`
          );
          console.log(
            `✅ Sent completion notification to tutor ${contract.tutorId}`
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
    parentId: string,
    contractId: string,
    rating: number,
    review: string
  ) {
    try {
      // 1. Verify contract
      const contract = await ParentSubscription.findOne({
        where: {
          id: contractId,
          parentId: parentId,
        },
      });

      if (!contract) {
        throw new NotFoundError("Contract not found");
      }

      // 2. Check if contract can be rated (active or pending_completion)
      if (contract.status !== ParentSubscriptionStatus.PENDING_COMPLETION) {
        throw new BadRequestError("Contract against this id is not completed");
      }

      // 3. Check if parent already rated
      const existingReview = await ContractReview.findOne({
        where: {
          contractId: contractId,
          reviewerId: parentId,
        },
      });

      if (existingReview) {
        throw new ConflictError("You have already rated this contract");
      }

      // 4. Create contract review
      await ContractReview.create({
        contractId: contractId,
        reviewerId: parentId,
        reviewedId: contract.tutorId,
        reviewerRole: "PARENT",
        rating,
        review: review || undefined,
      });

      // 5. Check if tutor has also rated
      const tutorReview = await ContractReview.findOne({
        where: {
          contractId: contractId,
          reviewerId: contract.tutorId,
        },
      });

      // 6. Update contract status
      if (tutorReview) {
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
          const parent = await User.findByPk(parentId);
          const tutor = await User.findByPk(contract.tutorId);

          await this.pushToUser(
            contract.tutorId,
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
            parentId,
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
        // Only parent rated - mark as pending_completion
        await contract.update({
          status: ParentSubscriptionStatus.PENDING_COMPLETION,
        });

        // Notify tutor to submit rating
        try {
          const parent = await User.findByPk(parentId);

          await this.pushToUser(
            contract.tutorId,
            "⭐ Rating Request",
            `${parent?.fullName || "The parent"} has submitted their rating. Please submit yours to complete the contract.`,
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
        message: tutorReview
          ? "Contract completed! Both parties have rated."
          : "Rating submitted. Waiting for tutor to rate.",
      };
    } catch (error) {
      console.error("Error in submitContractRating:", error);
      throw error;
    }
  }

  async getActiveContractsForDispute(parentId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Get all active contracts that can be disputed
      // Statuses that can be disputed: 'active', 'pending_completion'
      const { rows, count } = await ParentSubscription.findAndCountAll({
        where: {
          parentId: parentId,
        },
        include: [
          {
            model: User,
            foreignKey: "tutorId",
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

          // Get tutor user details
          const tutor = await User.findByPk(contract.tutorId, {
            attributes: ["id", "fullName", "email", "image", "phone"],
          });

          // Check if parent has already reviewed
          const parentReview = contractReviews.find(
            (review) => review.reviewerId === parentId
          );

          // Check if tutor has already reviewed
          const tutorReview = contractReviews.find(
            (review) => review.reviewerId === contract.tutorId
          );

          // Get payment requests for this tutor (PaymentRequests doesn't have subscriptionId field)
          const paymentRequests = await PaymentRequests.findAll({
            where: {
              tutorId: contract.tutorId,
            },
            order: [["createdAt", "DESC"]],
            limit: 10, // Limit to recent payment requests
          });

          return {
            ...contract.toJSON(),
            tutor: tutor,
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

  // ==================== PayFast Payment Methods ====================

  /**
   * Initiate PayFast subscription payment
   */
  async initiatePayFastSubscription(data: { userId: string; offerId: string }) {
    try {
      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new UnProcessableEntityError("User not found");
      }

      const offer = await Offer.findByPk(data.offerId);
      if (!offer) {
        throw new NotFoundError("Offer not found");
      }

      if (offer.receiverId !== user.id) {
        throw new UnProcessableEntityError(
          "You are not the receiver of this offer"
        );
      }

      if (offer.status === OfferStatus.ACCEPTED) {
        throw new UnProcessableEntityError("Offer already accepted");
      }

      // Get user email and phone if not provided
      const customerEmail = user.email;
      const customerMobile = user.phone;

      // Initiate PayFast subscription
      const payfastResult = await this.payfastService.initiateSubscription({
        userId: user.id,
        amount: offer.amountMonthly,
        customerEmail,
        customerMobile,
        offerId: offer.id,
        childName: offer.childName,
      });

      // Check if subscription already exists
      let subscription = await ParentSubscription.findOne({
        where: { offerId: data.offerId },
      });

      if (!subscription) {
        subscription = await ParentSubscription.create({
          offerId: data.offerId,
          parentId: data.userId,
          tutorId: offer.senderId,
          basketId: payfastResult.basketId,
          status: ParentSubscriptionStatus.CREATED,
          planType: "sessions",
          startDate: new Date(),
          amount: offer.amountMonthly,
          failureCount: 0,
        });
      } else {
        await subscription.update({
          basketId: payfastResult.basketId,
        });
      }

      // Create transaction record
      const transaction = await ParentTransaction.create({
        parentId: data.userId,
        subscriptionId: subscription.id,
        invoiceId: payfastResult.basketId, // Using basketId as invoice ID initially
        basketId: payfastResult.basketId,
        status: "created",
        orderStatus: "PENDING",
        amount: offer.amountMonthly,
        childName: offer.childName,
      });

      return {
        success: true,
        payfastUrl: payfastResult.payfastUrl,
        formFields: payfastResult.formFields,
        basketId: payfastResult.basketId,
        // transactionId: transaction?.id,
      };
    } catch (error) {
      console.error("Error in initiatePayFastSubscription:", error);
      throw error;
    }
  }

  /**
   * Handle PayFast IPN (Instant Payment Notification)
   */
  async handlePayFastIPN(ipnData: any) {
    try {
      // Extract IPN data (PayFast sends in various formats)
      const basketId =
        ipnData.basket_id ||
        ipnData.BASKET_ID ||
        ipnData.basketId ||
        ipnData.BasketId;
      const errCode =
        ipnData.err_code ||
        ipnData.ERR_CODE ||
        ipnData.errCode ||
        ipnData.ErrCode ||
        "000";
      const errMsg =
        ipnData.err_msg || ipnData.ERR_MSG || ipnData.errMsg || ipnData.ErrMsg;
      const validationHash =
        ipnData.validation_hash ||
        ipnData.VALIDATION_HASH ||
        ipnData.validationHash ||
        ipnData.ValidationHash;
      const transactionId =
        ipnData.transaction_id ||
        ipnData.TRANSACTION_ID ||
        ipnData.transactionId ||
        ipnData.TransactionId;
      const transactionAmount =
        ipnData.transaction_amount ||
        ipnData.TRANSACTION_AMOUNT ||
        ipnData.transactionAmount ||
        ipnData.TransactionAmount;
      const instrumentToken =
        ipnData.Instrument_token ||
        ipnData.instrument_token ||
        ipnData.InstrumentToken ||
        ipnData.instrumentToken;
      const recurringTxn =
        ipnData.recurring_txn ||
        ipnData.RECURRING_TXN ||
        ipnData.recurringTxn ||
        ipnData.RecurringTxn;

      if (!basketId) {
        console.error("PayFast IPN: Missing basketId");
        return;
      }

      // Validate hash
      if (validationHash) {
        const isValid = this.payfastService.validateIPNHash(
          basketId,
          errCode,
          validationHash
        );
        if (!isValid) {
          console.error("PayFast IPN: Invalid validation hash", {
            basketId,
            errCode,
            receivedHash: validationHash,
          });
          return;
        }
      }

      // Check if this is a recurring charge (basket ID starts with "RECUR-")
      const isRecurringCharge = basketId.startsWith("SUB-");

      console.log("aaaaaa");

      if (isRecurringCharge) {
        // Handle recurring payment IPN
        await this.handleRecurringPaymentIPN({
          basketId,
          errCode,
          errMsg,
          transactionId,
          transactionAmount,
        });
      } else {
        // Handle initial subscription payment IPN
        await this.handleInitialPaymentIPN({
          basketId,
          errCode,
          errMsg,
          transactionId,
          transactionAmount,
          instrumentToken,
          recurringTxn,
        });
      }
    } catch (error) {
      console.error("Error in handlePayFastIPN:", error);
      throw error;
    }
  }

  /**
   * Handle initial subscription payment IPN
   */
  private async handleInitialPaymentIPN(data: {
    basketId: string;
    errCode: string;
    errMsg?: string;
    transactionId?: string;
    transactionAmount?: string;
    instrumentToken?: string;
    recurringTxn?: string;
  }) {
    try {
      // Find transaction by basketId
      const transaction = await ParentTransaction.findOne({
        where: { basketId: data.basketId },
        include: [{ model: ParentSubscription }],
      });

      if (!transaction) {
        console.error(
          `PayFast IPN: Transaction not found for basketId: ${data.basketId}`
        );
        return;
      }

      const subscription = await ParentSubscription.findOne({
        where: { basketId: data.basketId },
      });

      if (!subscription) {
        console.error(
          `PayFast IPN: Subscription not found for basketId: ${data.basketId}`
        );
        return;
      }

      // Update transaction status
      const orderStatus = data.errCode === "000" ? "SUCCESS" : "FAILED";
      await transaction.update({
        orderStatus,
        invoiceId: data.transactionId || transaction.invoiceId,
        status: data.errCode === "000" ? "paid" : "failed",
      });

      // If payment successful
      if (data.errCode === "000") {
        // Store instrument token if recurring is enabled
        if (data.instrumentToken && data.recurringTxn === "TRUE") {
          // Store in PaymentMethod
          const paymentMethod = await PaymentMethod.create({
            parentId: subscription.parentId,
            instrumentToken: data.instrumentToken,
            paymentProvider: "PAYFAST",
          });

          // Update subscription with token and activate
          const nextBillingDate = new Date();
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          await subscription.update({
            status: ParentSubscriptionStatus.ACTIVE,
            instrumentToken: data.instrumentToken,
            nextBillingDate,
            lastPaymentDate: new Date(),
            lastPaymentAmount: parseFloat(data.transactionAmount || "0") / 100, // PayFast sends in smallest currency unit
            failureCount: 0,
          });

          // 🔔 Notify parent + tutor that subscription is active
          try {
            await this.pushToUser(
              subscription.parentId,
              "✅ Payment Successful",
              "Your subscription payment was successful and is now active.",
              {
                type: "SUBSCRIPTION_ACTIVE",
                subscriptionId: subscription.id,
                basketId: data.basketId,
                transactionId: data.transactionId || "",
              },
              undefined,
              `/subscriptions/${subscription.id}`
            );
            await this.pushToUser(
              subscription.tutorId,
              "✅ New Active Subscription",
              "A new subscription is now active for you.",
              {
                type: "SUBSCRIPTION_ACTIVE",
                subscriptionId: subscription.id,
                basketId: data.basketId,
                transactionId: data.transactionId || "",
              },
              undefined,
              `/subscriptions/${subscription.id}`
            );
          } catch (e) {
            console.error(
              "❌ Error sending subscription active notification:",
              e
            );
          }

          // Create TutorTransaction and TutorSessions
          const offer = await Offer.findByPk(subscription.offerId);
          if (offer) {
            const tutor = await Tutor.findOne({
              where: { userId: subscription.tutorId },
            });
            if (tutor) {
              await TutorTransaction.create({
                tutorId: subscription.tutorId,
                subscriptionId: subscription.id,
                status: TutorPaymentStatus.PAID,
                amount: subscription.amount,
                transactionType: TutorTransactionType.PAYMENT,
              });

              tutor.balance =
                Number(tutor.balance) + Number(subscription.amount);
              await tutor.save();

              // Create TutorSessions entry
              const currentDate = new Date();
              const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

              await TutorSessions.create({
                tutorId: subscription.tutorId,
                parentId: subscription.parentId,
                childName: offer.childName,
                startTime: offer.startTime,
                endTime: offer.endTime,
                totalSessions: offer.sessions,
                sessionsCompleted: 0,
                offerId: subscription.offerId,
                daysOfWeek: offer.daysOfWeek,
                price: Math.round(subscription.amount * 100), // Convert to cents
                status: "active",
                month: currentMonth,
                meta: {
                  createdFromOffer: true,
                  offerAcceptedAt: new Date(),
                  paymentProvider: "PAYFAST",
                },
              });
            }
          }
        } else {
          // One-time payment, just activate subscription
          await subscription.update({
            status: ParentSubscriptionStatus.ACTIVE,
          });
        }
      } else {
        // Payment failed
        await subscription.update({
          status: ParentSubscriptionStatus.CANCELLED,
        });

        // 🔔 Notify parent payment failed
        try {
          await this.pushToUser(
            subscription.parentId,
            "❌ Payment Failed",
            "Your subscription payment failed. Please try again.",
            {
              type: "PAYMENT_FAILED",
              subscriptionId: subscription.id,
              basketId: data.basketId,
              errCode: data.errCode,
              errMsg: data.errMsg || "",
            },
            undefined,
            `/subscriptions/${subscription.id}`
          );
        } catch (e) {
          console.error("❌ Error sending payment failed notification:", e);
        }
      }
    } catch (error) {
      console.error("Error in handleInitialPaymentIPN:", error);
      throw error;
    }
  }

  /**
   * Handle recurring payment IPN
   */
  private async handleRecurringPaymentIPN(data: {
    basketId: string;
    errCode: string;
    errMsg?: string;
    transactionId?: string;
    transactionAmount?: string;
  }) {
    try {
      // Find transaction/invoice by basketId
      const transaction = await ParentTransaction.findOne({
        where: { basketId: data.basketId },
        include: [{ model: ParentSubscription }],
      });

      if (!transaction) {
        console.error(
          `PayFast IPN: Recurring transaction not found for basketId: ${data.basketId}`
        );
        return;
      }

      const subscription = transaction.subscriptionId
        ? await ParentSubscription.findByPk(transaction.subscriptionId)
        : null;

      if (!subscription) {
        console.error(
          `PayFast IPN: Subscription not found for recurring payment`
        );
        return;
      }

      // Update transaction status
      const orderStatus = data.errCode === "000" ? "SUCCESS" : "FAILED";
      await transaction.update({
        orderStatus,
        invoiceId: data.transactionId || transaction.invoiceId,
        status: data.errCode === "000" ? "paid" : "failed",
      });

      if (data.errCode === "000") {
        // Payment successful
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        await subscription.update({
          status: ParentSubscriptionStatus.ACTIVE,
          nextBillingDate,
          lastPaymentDate: new Date(),
          lastPaymentAmount: parseFloat(data.transactionAmount || "0") / 100,
          failureCount: 0,
        });

        // 🔔 Notify parent recurring payment success
        try {
          await this.pushToUser(
            subscription.parentId,
            "✅ Recurring Payment Successful",
            "Your recurring subscription payment was successful.",
            {
              type: "RECURRING_PAYMENT_SUCCESS",
              subscriptionId: subscription.id,
              basketId: data.basketId,
              transactionId: data.transactionId || "",
              nextBillingDate: nextBillingDate.toISOString(),
            },
            undefined,
            `/subscriptions/${subscription.id}`
          );
        } catch (e) {
          console.error("❌ Error sending recurring success notification:", e);
        }

        // Create TutorTransaction
        const tutor = await Tutor.findOne({
          where: { userId: subscription.tutorId },
        });
        if (tutor) {
          await TutorTransaction.create({
            tutorId: subscription.tutorId,
            subscriptionId: subscription.id,
            status: TutorPaymentStatus.PAID,
            amount: subscription.amount,
            transactionType: TutorTransactionType.PAYMENT,
          });

          tutor.balance = Number(tutor.balance) + Number(subscription.amount);
          await tutor.save();
        }

        // Create TutorSessions for recurring payment if offer exists
        const offer = await Offer.findByPk(subscription.offerId);
        if (offer) {
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

          // Check if session already exists for this month
          const existingSession = await TutorSessions.findOne({
            where: {
              tutorId: subscription.tutorId,
              parentId: subscription.parentId,
              offerId: subscription.offerId,
              month: currentMonth,
              status: "active",
            },
          });

          if (!existingSession) {
            await TutorSessions.create({
              tutorId: subscription.tutorId,
              parentId: subscription.parentId,
              childName: offer.childName,
              startTime: offer.startTime,
              endTime: offer.endTime,
              offerId: subscription.offerId,
              daysOfWeek: offer.daysOfWeek,
              price: Math.round(subscription.amount * 100),
              status: "active",
              month: currentMonth,
              totalSessions: offer.sessions,
              sessionsCompleted: 0,
              meta: {
                recurringPayment: true,
                paymentProvider: "PAYFAST",
                paidAt: new Date(),
              },
            });
          }
        }
      } else {
        // Payment failed
        const failureCount = (subscription.failureCount || 0) + 1;

        if (failureCount >= 3) {
          // Suspend subscription after 3 failures
          await subscription.update({
            status: ParentSubscriptionStatus.EXPIRED, // Using EXPIRED as suspended status
            failureCount,
          });

          // 🔔 Notify parent subscription suspended
          try {
            await this.pushToUser(
              subscription.parentId,
              "⚠️ Subscription Suspended",
              "Your subscription has been suspended after multiple failed payments. Please update your payment method.",
              {
                type: "SUBSCRIPTION_SUSPENDED",
                subscriptionId: subscription.id,
                basketId: data.basketId,
                errCode: data.errCode,
                errMsg: data.errMsg || "",
                failureCount,
              },
              undefined,
              `/subscriptions/${subscription.id}`
            );
          } catch (e) {
            console.error("❌ Error sending suspension notification:", e);
          }
        } else {
          await subscription.update({
            failureCount,
          });

          // 🔔 Notify parent recurring payment failed
          try {
            await this.pushToUser(
              subscription.parentId,
              "❌ Recurring Payment Failed",
              "Your recurring payment failed. Please try again or update your payment method.",
              {
                type: "RECURRING_PAYMENT_FAILED",
                subscriptionId: subscription.id,
                basketId: data.basketId,
                errCode: data.errCode,
                errMsg: data.errMsg || "",
                failureCount,
              },
              undefined,
              `/subscriptions/${subscription.id}`
            );
          } catch (e) {
            console.error(
              "❌ Error sending recurring failure notification:",
              e
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in handleRecurringPaymentIPN:", error);
      throw error;
    }
  }

  /**
   * Get subscription status by basket ID
   */
  async getSubscriptionStatusByBasketId(basketId: string) {
    try {
      const transaction = await ParentTransaction.findOne({
        where: { basketId },
        include: [{ model: ParentSubscription }],
      });

      if (!transaction) {
        throw new NotFoundError("Order not found");
      }

      const subscription = await ParentSubscription.findOne({
        where: { basketId },
      });

      return {
        basketId,
        orderStatus: transaction.orderStatus || "PENDING",
        subscriptionStatus: subscription?.status || null,
        subscriptionId: subscription?.id || null,
        transactionId: transaction.invoiceId,
        errorCode: transaction.orderStatus === "FAILED" ? "001" : null,
        errorMessage:
          transaction.orderStatus === "FAILED" ? "Payment failed" : null,
        createdAt: transaction.createdAt,
        completedAt:
          transaction.orderStatus === "SUCCESS" ? transaction.updatedAt : null,
      };
    } catch (error) {
      console.error("Error in getSubscriptionStatusByBasketId:", error);
      throw error;
    }
  }

  /**
   * Manually charge recurring subscription
   */
  async chargeRecurringSubscription(subscriptionId: string) {
    try {
      const subscription = await ParentSubscription.findByPk(subscriptionId);

      if (!subscription) {
        throw new NotFoundError("Subscription not found");
      }

      if (subscription.status !== ParentSubscriptionStatus.ACTIVE) {
        throw new BadRequestError(
          `Subscription is not active. Current status: ${subscription.status}`
        );
      }

      if (!subscription.instrumentToken) {
        throw new BadRequestError(
          "No instrument token available for this subscription"
        );
      }

      // Get user for email/phone
      const user = await User.findByPk(subscription.parentId);

      // Generate recurring basket ID
      const basketId = this.payfastService.generateBasketId("RECUR");

      // Create invoice/transaction
      const offer = await Offer.findByPk(subscription.offerId);
      const invoice = await ParentTransaction.create({
        parentId: subscription.parentId,
        subscriptionId: subscription.id,
        invoiceId: basketId,
        basketId,
        status: "created",
        orderStatus: "PENDING",
        amount: subscription.amount,
        childName: offer?.childName || "",
      });

      // Charge using PayFast
      const result = await this.payfastService.chargeRecurringPayment({
        instrumentToken: subscription.instrumentToken,
        basketId,
        amount: subscription.amount,
        customerEmail: user?.email,
        customerMobile: user?.phone || undefined,
      });

      return {
        success: true,
        message: "Recurring charge initiated",
        invoiceId: invoice.id,
        basketId,
        result,
      };
    } catch (error) {
      console.error("Error in chargeRecurringSubscription:", error);
      throw error;
    }
  }

  /**
   * Get lists of instruments for a user
   */
  async getListsOfInstruments(userId: string) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const userMobileNumber = user.phone || "";

      const result =
        await this.payfastService.getListsOfInstruments(userMobileNumber);

      const cards = result.map((item: any) => ({
        cardNumber: item.instrument_alias || "",
        isExpired: item.is_expired ? true : false,
        id: item.unique_identifier || "",
      }));

      return cards;
    } catch (error) {
      console.error("Error in getListsOfInstruments:", error);
      throw error;
    }
  }

  /**
   * Recurring Transaction OTP
   * User sends CVV and cardId, everything else is fetched from user's active subscription or instruments list
   */
  async recurringTransactionOTP(
    userId: string,
    data: {
      cvv: string;
      cardId: string;
      offerId: string;
    }
  ) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const merchantUserId = user.phone;
      const userMobileNumber = user.phone || "";

      // Find user's subscription
      const subscription = await ParentSubscription.findOne({
        where: {
          parentId: userId,
          offerId: data.offerId,
        },
        order: [["createdAt", "DESC"]],
      });

      let instrumentToken: string;

      // Check if subscription has instrumentToken
      if (subscription && subscription.instrumentToken) {
        // Use instrumentToken from subscription
        instrumentToken = subscription.instrumentToken;
      } else {
        // Fetch instruments list and match cardId with unique_identifier
        const instruments =
          await this.payfastService.getListsOfInstruments(userMobileNumber);

        // Find the instrument matching the cardId (unique_identifier)
        const matchedInstrument = instruments.find(
          (item: any) => item.unique_identifier === data.cardId
        );

        if (!matchedInstrument) {
          throw new UnProcessableEntityError(
            `No payment instrument found with cardId: ${data.cardId}`
          );
        }

        if (!matchedInstrument.instrument_token) {
          throw new UnProcessableEntityError(
            "Selected payment instrument does not have an instrument_token"
          );
        }

        instrumentToken = matchedInstrument.instrument_token;
      }

      // Generate new basket ID for this transaction
      const basketId = this.payfastService.generateBasketId("RECUR");

      // Generate order date (current date in required format)
      const orderDate = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      // Get amount from subscription if available, otherwise use a default or throw error
      let txnamt: string;
      if (subscription && subscription.amount) {
        txnamt = Number(subscription.amount).toFixed(2);
      } else {
        // If no subscription, you might want to get amount from offer or throw error
        throw new UnProcessableEntityError(
          "No subscription found. Cannot determine transaction amount."
        );
      }

      // Get callback URLs from PayFast service config
      const data3dsCallbackUrl = `${process.env.API_BASE_URL || "https://63fa2444770f.ngrok-free.app"}/parent/payfast/3dscallback`;
      const checkoutUrl = this.payfastService.getCheckoutUrl();

      // Get currency code from PayFast service config
      const currencyCode = this.payfastService.getCurrencyCode();

      const result = await this.payfastService.recurringTransactionOTP({
        instrumentToken,
        merchantUserId,
        userMobileNumber,
        basketId,
        orderDate,
        txnamt,
        cvv: data.cvv,
        currencyCode: currencyCode,
        data3dsCallbackUrl,
        checkoutUrl,
      });

      return result;
    } catch (error) {
      console.error("Error in recurringTransactionOTP:", error);
      throw error;
    }
  }

  /**
   * Initiate Recurring Payment
   */
  async initiateRecurringPayment(
    userId: string,
    data: {
      cvv: string;
      cardId: string;
      otp?: string;
      transactionId?: string;
      data3dsSecureId?: string;
      data3dsPares?: string;
    }
  ) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const merchantUserId = user.phone;
      const userMobileNumber = user.phone || "";

      // Find user's subscription
      const subscription = await ParentSubscription.findOne({
        where: {
          parentId: userId,
        },
        order: [["createdAt", "DESC"]],
      });

      let instrumentToken: string;

      // Check if subscription has instrumentToken
      if (subscription && subscription.instrumentToken) {
        instrumentToken = subscription.instrumentToken;
      } else {
        // Fetch instruments list and match cardId with unique_identifier
        const instruments =
          await this.payfastService.getListsOfInstruments(userMobileNumber);

        const matchedInstrument = instruments.find(
          (item: any) => item.unique_identifier === data.cardId
        );

        if (!matchedInstrument) {
          throw new UnProcessableEntityError(
            `No payment instrument found with cardId: ${data.cardId}`
          );
        }

        if (!matchedInstrument.instrument_token) {
          throw new UnProcessableEntityError(
            "Selected payment instrument does not have an instrument_token"
          );
        }

        instrumentToken = matchedInstrument.instrument_token;
      }

      // Generate basket/order date like OTP endpoint
      const basketId = this.payfastService.generateBasketId("RECUR");
      const orderDate = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      // Amount from subscription
      if (!subscription || !subscription.amount) {
        throw new UnProcessableEntityError(
          "No subscription found. Cannot determine transaction amount."
        );
      }
      const txnamt = Number(subscription.amount).toFixed(2);

      const checkoutUrl = this.payfastService.getCheckoutUrl();
      const currencyCode = this.payfastService.getCurrencyCode();
      const txndesc = "Recurring Subscription Payment";

      const result = await this.payfastService.initiateRecurringPayment({
        instrumentToken,
        merchantUserId,
        userMobileNumber,
        basketId,
        orderDate,
        txndesc,
        txnamt,
        cvv: data.cvv,
        otp: data.otp,
        data3dsSecureId: data.data3dsSecureId,
        data3dsPares: data.data3dsPares,
        transactionId: data.transactionId,
        currencyCode,
        checkoutUrl,
      });

      return result;
    } catch (error) {
      console.error("Error in initiateRecurringPayment:", error);
      throw error;
    }
  }

  /**
   * Handle PayFast Success Callback
   */
  async handlePayFastSuccess(queryParams: {
    err_code?: string;
    err_msg?: string;
    transaction_id?: string;
    basket_id?: string;
    order_date?: string;
    validation_hash?: string;
    transaction_amount?: string;
    merchant_amount?: string;
    Recurring_txn?: string;
    [key: string]: any;
  }) {
    try {
      const basketId = queryParams.basket_id;
      const errCode = queryParams.err_code || "000";
      const errMsg = queryParams.err_msg || "";
      const transactionId = queryParams.transaction_id;
      const validationHash = queryParams.validation_hash;
      const transactionAmount = queryParams.transaction_amount;
      const isRecurring = queryParams.Recurring_txn === "true";

      console.log("we here ");

      if (!basketId) {
        throw new BadRequestError("Missing basket_id in success callback");
      }

      // Validate hash if provided
      // if (validationHash) {
      //   const isValid = this.payfastService.validateIPNHash(
      //     basketId,
      //     errCode,
      //     validationHash
      //   );
      //   if (!isValid) {
      //     console.error("PayFast Success: Invalid validation hash", {
      //       basketId,
      //       errCode,
      //       receivedHash: validationHash,
      //     });
      //     throw new BadRequestError("Invalid validation hash");
      //   }
      // }

      // Find transaction by basketId
      const transaction = await ParentTransaction.findOne({
        where: { basketId },
        include: [{ model: ParentSubscription }],
      });

      if (!transaction) {
        throw new NotFoundError("Transaction not found for this basket ID");
      }

      const subscription = await ParentSubscription.findOne({
        where: { basketId },
      });

      if (!subscription) {
        throw new NotFoundError("Subscription not found for this basket ID");
      }

      // Update transaction status
      const orderStatus = errCode === "000" ? "SUCCESS" : "FAILED";
      await transaction.update({
        orderStatus,
        invoiceId: transactionId || transaction.invoiceId,
        status: errCode === "000" ? "paid" : "failed",
      });

      // Payment successful
      // if (isRecurring) {
      //   // Handle recurring payment
      //   const nextBillingDate = new Date();
      //   nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      //   await subscription.update({
      //     status: ParentSubscriptionStatus.ACTIVE,
      //     nextBillingDate,
      //     lastPaymentDate: new Date(),
      //     lastPaymentAmount: parseFloat(transactionAmount || "0"),
      //     failureCount: 0,
      //   });
      // } else {
      // Handle initial payment
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      console.log("FDSFAS");

      await subscription.update({
        status: ParentSubscriptionStatus.ACTIVE,
        instrumentToken:
          queryParams.instrument_token || subscription.instrumentToken,
        nextBillingDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: parseFloat(transactionAmount || "0"),
        failureCount: 0,
      });

      // Create TutorTransaction and TutorSessions for initial payment
      const offer = await Offer.findByPk(subscription.offerId);

      console.log("FSDFSDFSDFS");

      if (offer) {
        const tutor = await Tutor.findOne({
          where: { userId: subscription.tutorId },
        });
        if (tutor) {
          await TutorTransaction.create({
            tutorId: subscription.tutorId,
            subscriptionId: subscription.id,
            status: TutorPaymentStatus.PAID,
            amount: subscription.amount,
            transactionType: TutorTransactionType.PAYMENT,
          });

          tutor.balance = Number(tutor.balance) + Number(subscription.amount);
          await tutor.save();

          // Create TutorSessions entry
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

          await TutorSessions.create({
            tutorId: subscription.tutorId,
            parentId: subscription.parentId,
            childName: offer.childName,
            startTime: offer.startTime,
            endTime: offer.endTime,
            offerId: subscription.offerId,
            daysOfWeek: offer.daysOfWeek,
            price: Number(subscription.amount),
            status: "active",
            month: currentMonth,
            totalSessions: offer.sessions,
            sessionsCompleted: 0,
            meta: {
              createdFromOffer: true,
              offerAcceptedAt: new Date(),
              paymentProvider: "PAYFAST",
            },
          });
        }
      }

      offer.status = OfferStatus.ACCEPTED;
      offer.save();

      return {
        success: errCode === "000",
        basketId,
        transactionId,
        subscriptionId: subscription.id,
        orderStatus,
        message: errCode === "000" ? "Payment successful" : errMsg,
      };
    } catch (error) {
      console.error("Error in handlePayFastSuccess:", error);
      throw error;
    }
  }

  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await notification.destroy();
  }

  async deleteNotifications(
    notificationIds: string[],
    userId: string
  ): Promise<void> {
    await Notification.destroy({
      where: {
        id: notificationIds,
        userId,
      },
    });
  }
  async updateParentDocuments(
    userId: string,
    data: {
      idFront?: Express.Multer.File;
      idBack?: Express.Multer.File;
    }
  ) {
    try {
      const parent = await Parent.findOne({ where: { userId } });
      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      const userFolder = path.join("uploads", "parents", userId.toString());
      const updateData: any = {};

      const uploadPromises = [];
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
        await parent.update(updateData);
      }

      return parent;
    } catch (error) {
      console.error("Error in updateParentDocuments:", error);
      throw error;
    }
  }
}

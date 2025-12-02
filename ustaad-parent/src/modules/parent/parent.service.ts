import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
import { NotFoundError } from "../../errors/not-found-error";
import { BadRequestError } from "../../errors/bad-request-error";
import { IParentOnboardingDTO } from "./parent.dto";
import bcrypt from "bcrypt";
import {
  Parent,
  User,
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
  Child,
  ContractReview,
  TutorSessionsDetail,
  PaymentRequests,
  sendNotificationToUser,
  NotificationType,
  TutorTransactionType,
  TutorSessionStatus,
  ParentSubscriptionStatus
} from "@ustaad/shared";
import Stripe from "stripe";
import { TutorPaymentStatus, OfferStatus } from "@ustaad/shared";
import { Op } from "sequelize";
import PayFastService from "../../services/payfast.service";

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

      return {
        user,
        totalSessions,
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

  async createPaymentMethod(userId: string, paymentMethodId: string) {
    if (!this.stripe) {
      throw new Error(
        "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
      );
    }

    try {
      // Find parent by userId
      let user = await User.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      let parent = await Parent.findOne({
        where: { userId: userId },
      });

      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      // If parent does not have a customerId, create one in Stripe and update parent
      if (!parent.customerId) {
        // You can add more info to customer creation if needed (e.g., email, name)
        const stripeCustomer = await this.stripe.customers.create({
          email: user.email,
          metadata: { parentId: parent.userId.toString() },
        });

        await parent.update({ customerId: stripeCustomer.id });
        parent.customerId = stripeCustomer.id; // update local variable for further use
      }

      // Retrieve payment method from Stripe
      const stripePaymentMethod =
        await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (!stripePaymentMethod) {
        throw new UnProcessableEntityError(
          "Payment method not found in Stripe"
        );
      }

      // Check if payment method already exists
      const existingPaymentMethod = await PaymentMethod.findOne({
        where: { stripePaymentMethodId: paymentMethodId },
      });

      if (existingPaymentMethod) {
        throw new ConflictError("Payment method already exists");
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: parent.customerId,
      });

      // Create payment method record
      const paymentMethod = await PaymentMethod.create({
        parentId: parent.userId,
        stripePaymentMethodId: paymentMethodId,
        cardBrand: stripePaymentMethod.card?.brand || "unknown",
        cardLast4: stripePaymentMethod.card?.last4 || "",
        cardExpMonth: stripePaymentMethod.card?.exp_month || 0,
        cardExpYear: stripePaymentMethod.card?.exp_year || 0,
        isDefault: false,
      });

      // If this is the first payment method, make it default
      const paymentMethodCount = await PaymentMethod.count({
        where: { parentId: parent.userId },
      });

      if (paymentMethodCount === 1) {
        await paymentMethod.update({ isDefault: true });

        // Set as default payment method in Stripe
        await this.stripe.customers.update(parent.customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return paymentMethod;
    } catch (error) {
      console.error("Error in createPaymentMethod:", error);
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

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    isDefault?: boolean
  ) {
    try {
      const parent = await Parent.findOne({
        where: { userId },
      });

      if (!parent) {
        throw new UnProcessableEntityError("Parent profile not found");
      }

      const paymentMethod = await PaymentMethod.findOne({
        where: {
          id: paymentMethodId,
          parentId: parent.userId,
        },
      });

      if (!paymentMethod) {
        throw new UnProcessableEntityError("Payment method not found");
      }

      // If setting as default, unset other default payment methods
      if (isDefault) {
        await PaymentMethod.update(
          { isDefault: false },
          { where: { parentId: parent.userId } }
        );

        // Set as default in Stripe
        if (parent.customerId) {
          await this.stripe?.customers.update(parent.customerId, {
            invoice_settings: {
              default_payment_method: paymentMethod.stripePaymentMethodId,
            },
          });
        }
      }

      // Update the payment method
      await paymentMethod.update({ isDefault });

      return paymentMethod;
    } catch (error) {
      console.error("Error in updatePaymentMethod:", error);
      throw error;
    }
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string) {
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

      const paymentMethod = await PaymentMethod.findOne({
        where: {
          id: paymentMethodId,
          parentId: parent.userId,
        },
      });

      if (!paymentMethod) {
        throw new UnProcessableEntityError("Payment method not found");
      }

      // Check if this is the default payment method
      const isDefault = paymentMethod.isDefault;

      // Delete from Stripe
      await this.stripe.paymentMethods.detach(
        paymentMethod.stripePaymentMethodId
      );

      // Delete from database
      await paymentMethod.destroy();

      // If this was the default payment method, set another one as default
      if (isDefault) {
        const remainingPaymentMethod = await PaymentMethod.findOne({
          where: { parentId: parent.userId },
          order: [["createdAt", "DESC"]],
        });

        if (remainingPaymentMethod) {
          await remainingPaymentMethod.update({ isDefault: true });

          // Set as default in Stripe
          if (parent.customerId) {
            await this.stripe.customers.update(parent.customerId, {
              invoice_settings: {
                default_payment_method:
                  remainingPaymentMethod.stripePaymentMethodId,
              },
            });
          }
        }
      }

      return { message: "Payment method deleted successfully" };
    } catch (error) {
      console.error("Error in deletePaymentMethod:", error);
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
            attributes: ["institute", "startDate", "endDate", "description"],
          },
          {
            model: TutorExperience,
            attributes: ["company", "startDate", "endDate", "description"],
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
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      // Format reviews with parent information
      const formattedReviews = reviews.map((review) => {
        const reviewData = review.toJSON() as any;
        return {
          id: review.id,
          rating: review.rating,
          review: review.review,
          parent: reviewData.reviewer ? {
            id: reviewData.reviewer.id,
            fullName: reviewData.reviewer.fullName,
            email: reviewData.reviewer.email,
            image: reviewData.reviewer.image,
          } : null,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      });

      // Return user data with reviews
      return {
        ...user.toJSON(),
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



      const tutor = await Tutor.findOne({where: {userId: offer.senderId}});
      if (!tutor) {
        throw new UnProcessableEntityError("Tutor not found");
      }

        // Check if subscription already exists for this offer
        const existingSubscription = await ParentSubscription.findOne({
          where: { offerId: offerId, status: { [Op.in]: [ParentSubscriptionStatus.ACTIVE, ParentSubscriptionStatus.CREATED] } },
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
          stripeSubscriptionId: payfastResult.basketId, // Using basketId as subscription ID
          basketId: payfastResult.basketId,
          status: ParentSubscriptionStatus.CREATED, // Will be activated after IPN confirms payment
          planType: "monthly",
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

  async handleStripeWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case "invoice.created":
          await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      throw error;
    }
  }

  private async handleInvoiceCreated(invoice: any) {
    console.log(
      "hello invoice payment succeeded",
      invoice.id,
      invoice.status,
      invoice.customer,
      invoice.amount_paid
    );
    console.log(
      "hello invoice payment succeeded",
      invoice?.subscription,
      invoice?.subscription_details?.metadata?.offerId
    );

    const offer = await Offer.findOne({
      where: {
        id: invoice?.subscription_details?.metadata?.offerId,
        status: OfferStatus.ACCEPTED,
      },
    });

    if (!offer) {
      console.log("offer not found");
      return;
    }
    const parentSubscription = await ParentSubscription.findOne({
      where: { offerId: offer.id },
    });
    if (parentSubscription) {
      parentSubscription.status = ParentSubscriptionStatus.ACTIVE;
      await parentSubscription.save();
    }

    const subscription = await ParentSubscription.findOne({
      where: { stripeSubscriptionId: invoice?.subscription },
    });

    const parent = await Parent.findOne({
      where: { customerId: invoice?.customer },
    });

    const tx = await ParentTransaction.findOne({
      where: { invoiceId: invoice.id, status: "created" },
    });
    if (tx) {
      return;
    }

    if (parent) {
      const parentTransaction = await ParentTransaction.create({
        invoiceId: invoice.id,
        parentId: parent?.userId,
        childName: offer.childName,
        subscriptionId: subscription?.id,
        amount: invoice?.amount_paid / 100,
        status: "created",
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: any) {
    console.log("subscription", subscription);

    // console.log("Subscription deleted:", subscription.id);
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

      // Cancel subscription in Stripe
      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      console.log("stripeSubscription", stripeSubscription);

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
          await sendNotificationToUser({
            userId: subscription.tutorId,
            type: NotificationType.SUBSCRIPTION_CANCELLED_BY_PARENT,
            title: '❌ Subscription Cancelled',
            body: `${parentUser?.fullName || 'A parent'} has cancelled the subscription for ${offer.childName}`,
            relatedEntityId: subscriptionId,
            relatedEntityType: 'subscription',
            actionUrl: `/subscriptions/${subscriptionId}`,
            metadata: {
              parentName: parentUser?.fullName || 'Unknown',
              childName: offer.childName,
              subject: offer.subject,
            },
          });
          console.log(`✅ Sent subscription cancelled notification to tutor ${subscription.tutorId}`);
        }
      } catch (notificationError) {
        console.error('❌ Error sending subscription cancellation notification:', notificationError);
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

  async getAllSubscriptions(userId: string) {
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
      const result = [];

      for (const dbSub of dbSubscriptions) {
        const stripeSub = stripeSubsMap.get(dbSub.stripeSubscriptionId);
        if (!stripeSub) continue;

        // Get created date
        const createdDate =
          dbSub.createdAt ||
          (stripeSub.created ? new Date(stripeSub.created * 1000) : null);

        // Get card details
        let cardDetail = null;
        if (
          stripeSub.default_payment_method &&
          stripeSub.default_payment_method.card
        ) {
          const card = stripeSub.default_payment_method.card;
          cardDetail = {
            brand: card.brand,
            last4: card.last4,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
          };
        }

        // Get plan amount
        let planAmount = null;
        if (stripeSub.plan && stripeSub.plan.amount) {
          planAmount = stripeSub.plan.amount / 100; // Stripe stores in cents
        }

        // Get offerId from plan.metadata
        let offerId = null;
        if (
          stripeSub.plan &&
          stripeSub.plan.metadata &&
          stripeSub.plan.metadata.offerId
        ) {
          offerId = stripeSub.plan.metadata.offerId;
        }

        // Get childName from Offer if offerId exists
        let childName = null;
        if (offerId) {
          const offer = await Offer.findOne({
            where: { id: offerId },
          });
          if (offer && offer.childName) {
            childName = offer.childName;
          }
        }

        result.push({
          tutorId: dbSub.tutorId,
          subscriptionId: dbSub.id,
          createdDate,
          cardDetail,
          planAmount,
          offerId,
          childName,
          status: dbSub.status,
        });
      }

      return result;
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
          status: {
            [Op.in]: ['created', 'paid', 'completed'], // Include successful transactions
          },
        },
        order: [['createdAt', 'ASC']],
      });

      // Group transactions by month and calculate spending
      const monthlyData: { [key: string]: { month: string; spending: number; count: number; children: Set<string> } } = {};
      
      // Initialize last 6 months with zero spending
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
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
        const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        
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
        .map(key => ({
          month: monthlyData[key].month,
          spending: parseFloat(monthlyData[key].spending.toFixed(2)),
          transactionCount: monthlyData[key].count,
          childrenCount: monthlyData[key].children.size,
        }));

      // Calculate total spending and statistics
      const totalSpending = result.reduce((sum, month) => sum + month.spending, 0);
      const totalTransactions = result.reduce((sum, month) => sum + month.transactionCount, 0);
      const avgMonthlySpending = totalSpending / 6;

      // Get unique children from all transactions
      const allChildren = new Set<string>();
      transactions.forEach(transaction => {
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
          period: '6 months',
        },
      };
    } catch (error) {
      console.error('Error in getMonthlySpending:', error);
      throw error;
    }
  }

  async terminateContract(
    parentId: string,
    contractId: string,
    status: ParentSubscriptionStatus.DISPUTE | ParentSubscriptionStatus.PENDING_COMPLETION,
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
      if ([ParentSubscriptionStatus.COMPLETED, ParentSubscriptionStatus.DISPUTE, ParentSubscriptionStatus.CANCELLED].includes(contract.status as any)) {
        throw new BadRequestError(`Contract is already ${contract.status}`);
      }

      // 3. Validate reason if status is dispute
      if (status === ParentSubscriptionStatus.DISPUTE && (!reason || reason.trim().length === 0)) {
        throw new BadRequestError("Cancellation reason is required for dispute");
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
          status: 'dispute',
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
          await sendNotificationToUser({
            userId: contract.tutorId,
            type: NotificationType.CONTRACT_DISPUTED,
            title: '⚠️ Contract Disputed',
            body: `${parent?.fullName || 'A parent'} has disputed the contract${offer?.childName ? ` for ${offer.childName}` : ''}. Reason: ${reason?.substring(0, 50) || ''}${reason && reason.length > 50 ? '...' : ''}`,
            relatedEntityId: contract.id,
            relatedEntityType: 'contract',
            actionUrl: `/contracts/${contract.id}`,
            metadata: {
              contractId: contract.id,
              disputedBy: parentId,
              reason: reason?.substring(0, 100) || '',
            },
          });
          console.log(`✅ Sent dispute notification to tutor ${contract.tutorId}`);
        } else if (status === ParentSubscriptionStatus.PENDING_COMPLETION) {
          await sendNotificationToUser({
            userId: contract.tutorId,
            type: NotificationType.CONTRACT_COMPLETED,
            title: '✅ Contract Completed',
            body: `${parent?.fullName || 'A parent'} has marked the contract${offer?.childName ? ` for ${offer.childName}` : ''} as completed.`,
            relatedEntityId: contract.id,
            relatedEntityType: 'contract',
            actionUrl: `/contracts/${contract.id}`,
            metadata: {
              contractId: contract.id,
              completedBy: parentId,
            },
          });
          console.log(`✅ Sent completion notification to tutor ${contract.tutorId}`);
        }
      } catch (notificationError) {
        console.error('❌ Error sending notification:', notificationError);
      }

      // 7. Return contract with completed sessions count
      return {
        contract,
        // completedSessions,
        message: status === ParentSubscriptionStatus.DISPUTE 
          ? 'Contract has been disputed and forwarded to admin for review'
          : 'Contract has been marked as completed',
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
        reviewerRole: 'PARENT',
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


        await TutorSessions.update({
          status: "cancelled",
        }, {
          where: {
            offerId: contract.offerId,
            tutorId: contract.tutorId,
            parentId: contract.parentId,
            status: "active",
          },
        });

        // Notify both parties
        try {
          const parent = await User.findByPk(parentId);
          const tutor = await User.findByPk(contract.tutorId);
          
          await sendNotificationToUser({
            userId: contract.tutorId,
            type: NotificationType.CONTRACT_COMPLETED,
            title: '✅ Contract Completed',
            body: 'Both parties have submitted their ratings. Contract is now completed.',
            relatedEntityId: contract.id,
            relatedEntityType: 'contract',
            actionUrl: `/contracts/${contract.id}`,
          });

          await sendNotificationToUser({
            userId: parentId,
            type: NotificationType.CONTRACT_COMPLETED,
            title: '✅ Contract Completed',
            body: 'Both parties have submitted their ratings. Contract is now completed.',
            relatedEntityId: contract.id,
            relatedEntityType: 'contract',
            actionUrl: `/contracts/${contract.id}`,
          });
        } catch (notificationError) {
          console.error('❌ Error sending completion notification:', notificationError);
        }
      } else {
        // Only parent rated - mark as pending_completion
        await contract.update({
          status: ParentSubscriptionStatus.PENDING_COMPLETION,
        });

        // Notify tutor to submit rating
        try {
          const parent = await User.findByPk(parentId);
          
          await sendNotificationToUser({
            userId: contract.tutorId,
            type: NotificationType.CONTRACT_RATING_SUBMITTED,
            title: '⭐ Rating Request',
            body: `${parent?.fullName || 'The parent'} has submitted their rating. Please submit yours to complete the contract.`,
            relatedEntityId: contract.id,
            relatedEntityType: 'contract',
            actionUrl: `/contracts/${contract.id}`,
            metadata: {
              contractId: contract.id,
              rating: rating.toString(),
            },
          });
        } catch (notificationError) {
          console.error('❌ Error sending rating notification:', notificationError);
        }
      }

      return {
        contract,
        message: tutorReview 
          ? 'Contract completed! Both parties have rated.' 
          : 'Rating submitted. Waiting for tutor to rate.',
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
            foreignKey: 'tutorId',
            attributes: ['id', 'fullName', 'email', 'image', 'phone'],
          },
          {
            model: Offer,
            attributes: [
              'id',
              'childName',
              'subject',
              'amountMonthly',
              'startDate',
              'startTime',
              'endTime',
              'daysOfWeek',
              'description',
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
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
              status: 'active',
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
                as: 'reviewer',
                attributes: ['id', 'fullName', 'email', 'image'],
              },
              {
                model: User,
                as: 'reviewed',
                attributes: ['id', 'fullName', 'email', 'image'],
              },
            ],
            order: [['createdAt', 'DESC']],
          });

          // Get tutor user details
          const tutor = await User.findByPk(contract.tutorId, {
            attributes: ['id', 'fullName', 'email', 'image', 'phone'],
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
            order: [['createdAt', 'DESC']],
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
            parentReview: parentReview ? {
              id: parentReview.id,
              reviewerId: parentReview.reviewerId,
              reviewedId: parentReview.reviewedId,
              reviewerRole: parentReview.reviewerRole,
              rating: parentReview.rating,
              review: parentReview.review,
              createdAt: parentReview.createdAt,
            } : null,
            tutorReview: tutorReview ? {
              id: tutorReview.id,
              reviewerId: tutorReview.reviewerId,
              reviewedId: tutorReview.reviewedId,
              reviewerRole: tutorReview.reviewerRole,
              rating: tutorReview.rating,
              review: tutorReview.review,
              createdAt: tutorReview.createdAt,
            } : null,
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
      console.error('Error in getActiveContractsForDispute:', error);
      throw error;
    }
  }

  // ==================== PayFast Payment Methods ====================

  /**
   * Initiate PayFast subscription payment
   */
  async initiatePayFastSubscription(data: {
    userId: string;
    offerId: string;
  }) {
    try {
      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new UnProcessableEntityError("User not found");
      }

      const offer = await Offer.findByPk(data.offerId);
      if (!offer) {
        throw new NotFoundError("Offer not found");
      }



      if(offer.receiverId !== user.id) {
        throw new UnProcessableEntityError("You are not the receiver of this offer");
      }


      // Get user email and phone if not provided
      const customerEmail = user.email;
      const customerMobile =user.phone;

      // Initiate PayFast subscription
      const payfastResult = await this.payfastService.initiateSubscription({
        userId: user.id,
        amount: offer.amountMonthly,
        customerEmail,
        customerMobile,
        offerId: offer.id,
        childName: offer.childName,
      });


      // console.log("payfastResult", payfastResult);
      

      // Create order/transaction record with PENDING status
      // let transaction: ParentTransaction | null = null;
      // if (data.offerId) {
      //   // Find or create subscription record
      //   const offer = await Offer.findByPk(data.offerId);
      //   if (!offer) {
      //     throw new NotFoundError("Offer not found");
      //   }

      //   // Check if subscription already exists
      //   let subscription = await ParentSubscription.findOne({
      //     where: { offerId: data.offerId, basketId: payfastResult.basketId },
      //   });

      //   if (!subscription) {
      //     subscription = await ParentSubscription.create({
      //       offerId: data.offerId,
      //       parentId: data.userId,
      //       tutorId: offer.senderId,
      //       stripeSubscriptionId: payfastResult.basketId, // Using basketId as subscription ID
      //       basketId: payfastResult.basketId,
      //       status: ParentSubscriptionStatus.CREATED,
      //       planType: "monthly",
      //       startDate: new Date(),
      //       amount: offer.amountMonthly,
      //       failureCount: 0,
      //     });
      //   }

      //   // Create transaction record
      //   transaction = await ParentTransaction.create({
      //     parentId: data.userId,
      //     subscriptionId: subscription.id,
      //     invoiceId: payfastResult.basketId, // Using basketId as invoice ID initially
      //     basketId: payfastResult.basketId,
      //     status: "created",
      //     orderStatus: "PENDING",
      //     amount: offer.amountMonthly,
      //     childName: offer.childName,
      //   });
      // }

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
        ipnData.err_msg ||
        ipnData.ERR_MSG ||
        ipnData.errMsg ||
        ipnData.ErrMsg;
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
        console.error(`PayFast IPN: Transaction not found for basketId: ${data.basketId}`);
        return;
      }

      const subscription = await ParentSubscription.findOne({
        where: { basketId: data.basketId },
      });

      if (!subscription) {
        console.error(`PayFast IPN: Subscription not found for basketId: ${data.basketId}`);
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
            stripePaymentMethodId: `payfast_${data.basketId}`, // Using basketId as identifier
            cardBrand: "PayFast",
            cardLast4: "****",
            cardExpMonth: 12,
            cardExpYear: new Date().getFullYear() + 10,
            isDefault: true,
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

          // Create TutorTransaction and TutorSessions
          const offer = await Offer.findByPk(subscription.offerId);
          if (offer) {
            const tutor = await Tutor.findOne({ where: { userId: subscription.tutorId } });
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
        console.error(`PayFast IPN: Recurring transaction not found for basketId: ${data.basketId}`);
        return;
      }

      const subscription = transaction.subscriptionId
        ? await ParentSubscription.findByPk(transaction.subscriptionId)
        : null;

      if (!subscription) {
        console.error(`PayFast IPN: Subscription not found for recurring payment`);
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

        // Create TutorTransaction
        const tutor = await Tutor.findOne({ where: { userId: subscription.tutorId } });
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
        } else {
          await subscription.update({
            failureCount,
          });
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
        errorMessage: transaction.orderStatus === "FAILED" ? "Payment failed" : null,
        createdAt: transaction.createdAt,
        completedAt: transaction.orderStatus === "SUCCESS" ? transaction.updatedAt : null,
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
        throw new BadRequestError("No instrument token available for this subscription");
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
}

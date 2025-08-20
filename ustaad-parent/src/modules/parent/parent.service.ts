import { ConflictError } from "../../errors/conflict-error";
import { GenericError } from "../../errors/generic-error";
import { uploadFile } from "../../helper/file-upload";
import path from "path";
import { UnProcessableEntityError } from "../../errors/unprocessable-entity.error";
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
  TutorReview,
} from "@ustaad/shared";
import Stripe from "stripe";
import { OfferStatus } from "src/constant/enums";
import { TutorPaymentStatus } from "@ustaad/shared/dist/constant/enums";
import { log } from "console";

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

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-06-30.basil",
      });
    }
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

      return user;
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

      return user;
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

      // const parent = await Parent.findOne({
      //   where: { userId: offer.receiverId },
      // });

      // if (!parent.customerId) {
      //   throw new UnProcessableEntityError(
      //     "Parent is not registered with stripe"
      //   );
      // }

      // const stripeCustomer = await this.stripe?.customers.retrieve(
      //   parent.customerId
      // );
      // if (!stripeCustomer) {
      //   throw new UnProcessableEntityError(
      //     "Parent is not registered with stripe"
      //   );
      // }

      // const paymentMethod = await PaymentMethod.findOne({
      //   where: { parentId: parent.userId, isDefault: true },
      // });

      // const stripePaymentMethod = await this.stripe?.paymentMethods.retrieve(
      //   paymentMethod.stripePaymentMethodId
      // );

      // if (!stripePaymentMethod) {
      //   throw new UnProcessableEntityError(
      //     "Parent does not have a payment method"
      //   );
      // }

      // const stripeSubscription = await this.stripe?.subscriptions.list({
      //   customer: parent.customerId,
      // });
      // // console.log("stripeSubscription", stripeSubscription);
      // if (!stripeSubscription) {
      //   throw new UnProcessableEntityError(
      //     "Parent is not registered with stripe"
      //   );
      // }

      // const parentSubscription = await ParentSubscription.findOne({
      //   where: { offerId: offerId },
      // });
      // if (parentSubscription) {
      //   throw new UnProcessableEntityError(
      //     "Parent already has a subscription against this offer"
      //   );
      // }

      // // Create a product
      // const product = await this.stripe?.products.create({
      //   name: `Ustaad Subscription for ${offer.id}`,
      //   metadata: {
      //     offerId: offerId,
      //   },
      // });

      // Create a monthly price
      // const price = await this.stripe?.prices.create({
      //   unit_amount: Math.round(offer.amountMonthly * 100),
      //   currency: "pkr",
      //   recurring: { interval: "month" },
      //   product: product.id,
      //   metadata: {
      //     offerId: offerId,
      //   },
      // });

      // // Create a subscription
      // const subscription = await this.stripe?.subscriptions.create({
      //   customer: parent.customerId,
      //   items: [{ price: price.id }],
      //   default_payment_method: paymentMethod.stripePaymentMethodId,
      //   metadata: {
      //     offerId: offerId,
      //   },
      // });

      // if (!subscription) {
      //   throw new UnProcessableEntityError("Failed to create subscription");
      // }

      // Create a parent subscription
      // await ParentSubscription.create({
      //   offerId: offerId,
      //   parentId: parent.userId,
      //   tutorId: offer.senderId,
      //   stripeSubscriptionId: subscription.id,
      //   status: "created",
      //   planType: "monthly",
      //   startDate: new Date(),
      //   amount: offer.amountMonthly,
      // });

      // If status is ACCEPTED, create entries in required tables
      if (status === OfferStatus.ACCEPTED) {
        // Check if subscription already exists for this offer
        const existingSubscription = await ParentSubscription.findOne({
          where: { offerId: offerId },
        });

        if (existingSubscription) {
          throw new UnProcessableEntityError(
            "Parent already has a subscription against this offer"
          );
        }

        // Generate random stripe subscription ID for testing
        const randomStripeSubscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        // 1. Create ParentSubscription entry
        const parentSubscription = await ParentSubscription.create({
          offerId: offerId,
          parentId: offer.receiverId,
          tutorId: offer.senderId,
          stripeSubscriptionId: randomStripeSubscriptionId,
          status: "active",
          planType: "monthly",
          startDate: new Date(),
          amount: offer.amountMonthly,
        });

        // Generate random invoice ID for testing
        const randomInvoiceId = `in_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        // 2. Create ParentTransaction entry
        await ParentTransaction.create({
          parentId: offer.receiverId,
          subscriptionId: parentSubscription.id,
          invoiceId: randomInvoiceId,
          status: "created",
          amount: offer.amountMonthly,
          childName: offer.childName,
        });

        // 3. Create TutorTransaction entry
        await TutorTransaction.create({
          tutorId: offer.senderId,
          subscriptionId: parentSubscription.id,
          status: TutorPaymentStatus.PENDING,
          amount: offer.amountMonthly,
        });

        // 4. Create TutorSessions entry
        // Generate current month in yyyy-mm format
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

        await TutorSessions.create({
          tutorId: offer.senderId,
          parentId: offer.receiverId,
          childName: offer.childName,
          startTime: offer.startTime,
          endTime: offer.endTime,
          offerId: offerId,
          daysOfWeek: offer.daysOfWeek,
          price: Math.round(offer.amountMonthly * 100), // Convert to cents
          status: "active",
          month: currentMonth,
          meta: {
            createdFromOffer: true,
            offerAcceptedAt: new Date(),
          },
        });
      }

      // Update offer status
      offer.status = status as OfferStatus;
      await offer.save();

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
      parentSubscription.status = "active";
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
        status: "cancelled",
        endDate: new Date(),
      });

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

  async createTutorReview(
    parentId: string,
    tutorId: string,
    rating: number,
    review: string
  ) {
    try {
      // Check if tutor exists in users table
      const tutorUser = await User.findOne({
        where: { id: tutorId, role: "TUTOR" },
      });

      if (!tutorUser) {
        throw new UnProcessableEntityError("Tutor not found");
      }

      // Check if parent already reviewed this tutor
      const existingReview = await TutorReview.findOne({
        where: { parentId, tutorId },
      });

      if (existingReview) {
        throw new ConflictError("You have already reviewed this tutor");
      }

      // Create the review
      const tutorReview = await TutorReview.create({
        parentId,
        tutorId,
        rating,
        review,
      });

      return tutorReview;
    } catch (error) {
      console.error("Error in createTutorReview:", error);
      throw error;
    }
  }
}

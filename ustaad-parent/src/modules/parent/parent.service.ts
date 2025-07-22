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
} from "@ustaad/shared";
import Stripe from "stripe";

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
  private stripe: Stripe | null = null;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-06-30.basil",
      });
    }
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

  async createStripeSubscription(customerId: string, price: number, tutorId: string, parentId: string) {
    if (!this.stripe) {
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
    }

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: "usd",
              product: `prod_tutoring_subscription_${tutorId}_${parentId}`,
              unit_amount: Math.round(price * 100), // Convert to cents
              recurring: {
                interval: "month",
              },
            },
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });
      return subscription;
    } catch (error) {
      console.error("Error creating Stripe subscription:", error);
      throw error;
    }
  }

  async createSubscription(data: {
    customerId: string;
    planType: string;
    amount: number;
    startDate: Date;
    endDate: Date;
    tutorId: string;
  }) {
    try {
      // Find parent using the customerId that was already created and saved
      const parent = await Parent.findOne({
        where: { customerId: data.customerId },
      });
      if (!parent) {
        throw new UnProcessableEntityError(
          "Parent not found with provided customer ID"
        );
      }

      // Create Stripe subscription using the existing customerId and provided price
      const stripeSubscription = await this.createStripeSubscription(
        data.customerId,
        data.amount,
        data.tutorId,
        parent.id
      );

      // Create local subscription record
      const subscription = await ParentSubscription.create({
        ...data,
        parentId: parent.id,
        tutorId: data.tutorId,
        stripeSubscriptionId: stripeSubscription.id,
        status: "active",
      });

      return {
        subscription,
        stripeSubscription,
        clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent
          ?.client_secret,
      };
    } catch (error) {
      console.error("Error in createSubscription:", error);
      throw error;
    }
  }

  async cancelSubscription(stripeSubscriptionId: string) {
    if (!this.stripe) {
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
    }

    try {
      const subscription = await ParentSubscription.findOne({
        where: { stripeSubscriptionId, status: "active" },
      });

      if (!subscription) {
        throw new UnProcessableEntityError(
          "No active subscription found for this customer"
        );
      }

      // Cancel the subscription in Stripe
      await this.stripe.subscriptions.cancel(stripeSubscriptionId);

      // Update local subscription status
      await subscription.update({ status: "cancelled" });
      return subscription;
    } catch (error) {
      console.error("Error in cancelSubscription:", error);
      throw error;
    }
  }
}

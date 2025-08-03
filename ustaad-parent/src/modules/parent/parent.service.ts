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
} from "@ustaad/shared";
import Stripe from "stripe";
import { OfferStatus } from "src/constant/enums";

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
        attributes: { exclude: ["password", "isActive", "isEmailVerified", "isPhoneVerified", "deviceId", 'phone'] },
        include: [
          {
            model: Tutor,
            attributes: [
              "subjects",
              "about",
              "grade",
            ],
          },
          {
            model: TutorSettings,
            attributes: [
              "minSubjects",
              "maxStudentsDaily",
              "subjectCosts",
            ],
          },
          {
            model: TutorEducation,
            attributes: [
              "institute",
              "startDate",
              "endDate",
              "description",
            ],
          },
          {
            model: TutorExperience,
            attributes: [
              "company",
              "startDate",
              "endDate",
              "description",
            ],
          },
        ],
      });

      return user;
    } catch (error) {
      console.error("Error in getTutorProfile:", error);
      throw error;
    }
  }


  async updateOffer(offerId: string, status: string) {
    try {
      const offer = await Offer.findByPk(offerId);
      if (!offer) {
        throw new UnProcessableEntityError("Offer not found");
      }

      // Validate status
      if (!Object.values(OfferStatus).includes(status as OfferStatus)) {
        throw new UnProcessableEntityError("Invalid offer status");
      }

      // Update offer status
      offer.status = status as OfferStatus;
      await offer.save();

      return offer;
    } catch (error :any) {
      if(error instanceof UnProcessableEntityError){
        throw error;
      }
      throw new GenericError(error, "Failed to update offer status");
    }
  }
}

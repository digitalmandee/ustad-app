import * as cron from "node-cron";
import {
  ParentTransaction,
  Offer,
  TutorSessions,
  ParentSubscription,
  ParentSubscriptionStatus,
} from "@ustaad/shared";
import { Op } from "sequelize";
import PayFastService from "./payfast.service";

export class CronService {
  private payfastService: PayFastService;
  private cancelledSubscriptionCron: cron.ScheduledTask | null = null;
  private recurringPaymentCron: cron.ScheduledTask | null = null;
  private lastCancelledSubscriptionRun: Date | null = null;
  private lastRecurringPaymentRun: Date | null = null;

  constructor() {
    this.payfastService = new PayFastService();
  }

  /**
   * Start the cancelled subscription cron job that runs every 10 minutes
   */
  startCancelledSubscriptionCron(): void {
    // Run every 10 minutes
    this.cancelledSubscriptionCron = cron.schedule(
      "*/10 * * * *",
      async () => {
        console.log("🕐 Running cancelled subscription cron job...");
        try {
          this.lastCancelledSubscriptionRun = new Date();
          await this.handleCancelledSubscriptions();
          console.log(
            "✅ Cancelled subscription cron job completed successfully"
          );
        } catch (error) {
          console.error("❌ Error in cancelled subscription cron job:", error);
        }
      },
      {
        timezone: "UTC",
      }
    );

    this.cancelledSubscriptionCron.start();
    console.log(
      "🚀 Cancelled subscription cron job started - runs every 10 minutes"
    );
  }

  /**
   * Stop the cancelled subscription cron job
   */
  stopCancelledSubscriptionCron(): void {
    if (this.cancelledSubscriptionCron) {
      this.cancelledSubscriptionCron.stop();
      this.cancelledSubscriptionCron.destroy();
      this.cancelledSubscriptionCron = null;
      console.log("🛑 Cancelled subscription cron job stopped");
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAllCronJobs(): void {
    this.stopCancelledSubscriptionCron();
    this.stopRecurringPaymentCron();
    console.log("🛑 All cron jobs stopped");
  }

  /**
   * Start recurring payment cron job for PayFast subscriptions
   */
  startRecurringPaymentCron(): void {
    // Run hourly at minute 0
    this.recurringPaymentCron = cron.schedule(
      "0 * * * *",
      async () => {
        console.log("🕐 Running recurring payment cron job...");
        try {
          this.lastRecurringPaymentRun = new Date();
          await this.processRecurringPayments();
          console.log("✅ Recurring payment cron job completed successfully");
        } catch (error) {
          console.error("❌ Error in recurring payment cron job:", error);
        }
      },
      {
        timezone: "UTC",
      }
    );

    this.recurringPaymentCron.start();
    console.log("🚀 Recurring payment cron job started - runs every hour");
  }

  /**
   * Stop recurring payment cron job
   */
  stopRecurringPaymentCron(): void {
    if (this.recurringPaymentCron) {
      this.recurringPaymentCron.stop();
      this.recurringPaymentCron.destroy();
      this.recurringPaymentCron = null;
      console.log("🛑 Recurring payment cron job stopped");
    }
  }

  /**
   * Process recurring payments for due subscriptions
   */
  async processRecurringPayments(): Promise<void> {
    try {
      const now = new Date();

      // Find all active subscriptions that are due for billing
      const dueSubscriptions = await ParentSubscription.findAll({
        where: {
          status: ParentSubscriptionStatus.ACTIVE,
          instrumentToken: { [Op.ne]: null },
          [Op.or]: [
            { nextBillingDate: { [Op.lte]: now } },
            { nextBillingDate: null },
          ],
        },
        include: [
          {
            model: Offer,
            attributes: ["childName"],
          },
        ],
      });

      console.log(
        `📊 Found ${dueSubscriptions.length} subscriptions due for billing`
      );

      if (dueSubscriptions.length === 0) {
        return;
      }

      // Process each subscription
      for (const subscription of dueSubscriptions) {
        try {
          await this.chargeRecurringSubscription(subscription);
        } catch (error) {
          console.error(
            `❌ Error charging subscription ${subscription.id}:`,
            error
          );
          // Continue with other subscriptions
        }
      }
    } catch (error) {
      console.error("❌ Error in processRecurringPayments:", error);
      throw error;
    }
  }

  /**
   * Charge a single recurring subscription
   */
  private async chargeRecurringSubscription(subscription: any): Promise<void> {
    try {
      if (!subscription.instrumentToken) {
        console.log(
          `⚠️ Subscription ${subscription.id} has no instrument token, skipping...`
        );
        return;
      }

      // Get user for email/phone
      const user = await require("@ustaad/shared").User.findByPk(
        subscription.parentId
      );
      if (!user) {
        console.log(
          `⚠️ User not found for subscription ${subscription.id}, skipping...`
        );
        return;
      }

      // Generate recurring basket ID
      const basketId = this.payfastService.generateBasketId("RECUR");

      // Create invoice/transaction
      const offer =
        subscription.offer ||
        (await require("@ustaad/shared").Offer.findByPk(subscription.offerId));
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
        customerEmail: user.email,
        customerMobile: user.phone || undefined,
      });

      console.log(
        `✅ Recurring charge initiated for subscription ${subscription.id}, basketId: ${basketId}`
      );

      // Note: The actual payment confirmation will come via IPN
      // IPN handler will update subscription nextBillingDate and invoice status
    } catch (error) {
      console.error(
        `❌ Error charging subscription ${subscription.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Start all cron jobs
   */
  startAllCronJobs(): void {
    // this.startCancelledSubscriptionCron();
    this.startRecurringPaymentCron();
    console.log("🚀 All cron jobs started");
  }

  /**
   * Main method to handle cancelled subscriptions
   */
  async handleCancelledSubscriptions(): Promise<void> {
    try {
      // 1. Get all cancelled subscriptions
      const cancelledSubscriptions = await ParentSubscription.findAll({
        where: {
          status: "cancelled",
        },
        include: [
          {
            model: Offer,
            as: "offer",
            required: false,
          },
        ],
      });

      console.log(
        `📊 Found ${cancelledSubscriptions.length} cancelled subscriptions to process`
      );

      if (cancelledSubscriptions.length === 0) {
        return;
      }

      // 2. Process each cancelled subscription
      for (const subscription of cancelledSubscriptions) {
        try {
          await this.processCancelledSubscription(subscription);
        } catch (error) {
          console.error(
            `❌ Error processing cancelled subscription ${subscription.id}:`,
            error
          );
          // Continue with other subscriptions
        }
      }
    } catch (error) {
      console.error("❌ Error in handleCancelledSubscriptions:", error);
      throw error;
    }
  }

  /**
   * Process a single cancelled subscription
   */
  private async processCancelledSubscription(subscription: any): Promise<void> {
    try {
      console.log(`🔍 Processing cancelled subscription ${subscription.id}`);

      // Get the offer from the subscription
      const offer = subscription.offer;
      if (!offer) {
        console.log(
          `⚠️ Subscription ${subscription.id} has no associated offer, skipping...`
        );
        return;
      }

      console.log(
        `📋 Found offer ${offer.id} for subscription ${subscription.id}`
      );

      // 1. Update offer status to "cancelled"
      await offer.update({ status: "cancelled" });
      console.log(`✅ Offer ${offer.id} status updated to cancelled`);

      // 2. Cancel all tutor sessions associated with this subscription
      // Since TutorSessions doesn't have offerId, we'll match by subscription criteria
      const cancelledSessions = await TutorSessions.update(
        { status: "cancelled" },
        {
          where: {
            tutorId: subscription.tutorId,
            parentId: subscription.parentId,
            childName: offer.childName,
            status: "active", // Only cancel active sessions
          },
        }
      );

      console.log(
        `✅ Cancelled ${cancelledSessions[0]} tutor sessions for subscription ${subscription.id}`
      );

      // 3. Mark subscription as processed (optional - to avoid reprocessing)
      await subscription.update({
        status: "cancelled_processed",
        updatedAt: new Date(),
      });

      console.log(`✅ Subscription ${subscription.id} marked as processed`);
    } catch (error) {
      console.error(
        `❌ Error processing cancelled subscription ${subscription.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get cron job status for all jobs
   */
  getCronStatus(): {
    cancelledSubscription: { isRunning: boolean; lastRun?: Date };
    recurringPayment: { isRunning: boolean; lastRun?: Date };
  } {
    return {
      cancelledSubscription: {
        isRunning:
          this.cancelledSubscriptionCron?.getStatus() === "scheduled" || false,
        lastRun: this.lastCancelledSubscriptionRun,
      },
      recurringPayment: {
        isRunning:
          this.recurringPaymentCron?.getStatus() === "scheduled" || false,
        lastRun: this.lastRecurringPaymentRun,
      },
    };
  }

  /**
   * Manually trigger recurring payment processing (for testing)
   */
  async processDueSubscriptions(): Promise<{
    processed: number;
    timestamp: Date;
  }> {
    await this.processRecurringPayments();
    return {
      processed: 0, // Will be updated by processRecurringPayments
      timestamp: new Date(),
    };
  }
}

export default CronService;

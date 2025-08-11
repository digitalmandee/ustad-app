import * as cron from "node-cron";
import Stripe from "stripe";
import {
  ParentTransaction,
  Offer,
  TutorSessions,
  ParentSubscription,
} from "@ustaad/shared";

export class CronService {
  private stripe: Stripe | null = null;
  private paymentVerificationCron: cron.ScheduledTask | null = null;
  private cancelledSubscriptionCron: cron.ScheduledTask | null = null;
  private lastPaymentVerificationRun: Date | null = null;
  private lastCancelledSubscriptionRun: Date | null = null;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-06-30.basil",
      });
    }
  }

  /**
   * Start the payment verification cron job that runs every 5 minutes
   */
  startPaymentVerificationCron(): void {
    if (!this.stripe) {
      console.error("❌ Stripe is not configured. Cron job cannot start.");
      return;
    }

    // Run every 5 minutes
    this.paymentVerificationCron = cron.schedule(
      "*/5 * * * *",
      async () => {
        console.log("🕐 Running payment verification cron job...");
        try {
          this.lastPaymentVerificationRun = new Date();
          await this.verifyCompletedTransactions();
          console.log(
            "✅ Payment verification cron job completed successfully"
          );
        } catch (error) {
          console.error("❌ Error in payment verification cron job:", error);
        }
      },
      {
        timezone: "UTC",
      }
    );

    this.paymentVerificationCron.start();
    console.log(
      "🚀 Payment verification cron job started - runs every 5 minutes"
    );
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
   * Stop the payment verification cron job
   */
  stopPaymentVerificationCron(): void {
    if (this.paymentVerificationCron) {
      this.paymentVerificationCron.stop();
      this.paymentVerificationCron.destroy();
      this.paymentVerificationCron = null;
      console.log("🛑 Payment verification cron job stopped");
    }
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
    this.stopPaymentVerificationCron();
    this.stopCancelledSubscriptionCron();
    console.log("🛑 All cron jobs stopped");
  }

  /**
   * Start all cron jobs
   */
  startAllCronJobs(): void {
    this.startPaymentVerificationCron();
    this.startCancelledSubscriptionCron();
    console.log("🚀 All cron jobs started");
  }

  /**
   * Main method to verify completed transactions
   */
  async verifyCompletedTransactions(): Promise<void> {
    try {
      // 1. Get all completed transactions
      const completedTransactions = await ParentTransaction.findAll({
        where: {
          status: "created",
          // Note: 'paid' field might not exist in the model, using status instead
        },
      });

      console.log(
        `📊 Found ${completedTransactions.length} completed transactions to verify`
      );

      if (completedTransactions.length === 0) {
        return;
      }

      // 2. Check each transaction's payment status on Stripe
      for (const transaction of completedTransactions) {
        try {
          await this.verifyTransactionPayment(transaction);
        } catch (error) {
          console.error(
            `❌ Error verifying transaction ${transaction.id}:`,
            error
          );
          // Continue with other transactions
        }
      }
    } catch (error) {
      console.error("❌ Error in verifyCompletedTransactions:", error);
      throw error;
    }
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
      console.log(
        `🔍 Processing cancelled subscription ${subscription.id}`
      );

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
        updatedAt: new Date()
      });

      console.log(
        `✅ Subscription ${subscription.id} marked as processed`
      );

    } catch (error) {
      console.error(
        `❌ Error processing cancelled subscription ${subscription.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Verify a single transaction's payment status on Stripe
   */
  private async verifyTransactionPayment(transaction: any): Promise<void> {
    try {
      if (!transaction.invoiceId) {
        console.log(
          `⚠️ Transaction ${transaction.id} has no invoice ID, skipping...`
        );
        return;
      }

      console.log(
        `🔍 Verifying payment for transaction ${transaction.id} with invoice ${transaction.invoiceId}`
      );

      // Get invoice from Stripe
      const invoice = await this.stripe!.invoices.retrieve(
        transaction.invoiceId
      );

      if (!invoice) {
        console.log(`⚠️ Invoice ${transaction.invoiceId} not found on Stripe`);
        return;
      }

      // Check if invoice is paid
      if (invoice.status === "paid") {
        console.log(
          `✅ Invoice ${transaction.invoiceId} is paid on Stripe, processing payment...`
        );

        // Process the payment using the existing logic
        await this.handleInvoicePaymentSucceeded(invoice);

        // Update transaction status
        await transaction.update({
          status: "paid",
        });

        console.log(`✅ Transaction ${transaction.id} marked as paid`);
      } else {
        console.log(
          `⏳ Invoice ${transaction.invoiceId} is not paid yet (status: ${invoice.status})`
        );
      }
    } catch (error) {
      console.error(`❌ Error verifying transaction ${transaction.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment (copied from parent.service.ts)
   */
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    console.log("Invoice payment succeeded:", invoice.id);
    const subID = invoice?.parent?.subscription_details?.subscription;
    const offerId = invoice?.parent?.subscription_details?.metadata?.offerId;

    console.log("subID", subID);
    console.log("offerId", offerId);

    const parentTransaction = await ParentTransaction.findOne({
      where: { invoiceId: invoice.id, status: "created" },
    });

    const parentSubscription = await ParentSubscription.findOne({
      where: { stripeSubscriptionId: subID },
    });

    if (!parentSubscription) {
      console.log("subscription id mismatch");
      return;
    }

    const offer = await Offer.findOne({
      where: { id: offerId },
    });
    if (parentTransaction && offer) {
      parentTransaction.status = "paid";
      await parentTransaction.save();

      const tutorSession = await TutorSessions.create({
        tutorId: offer?.senderId,
        parentId: parentTransaction.parentId,
        childName: offer?.childName,
        startTime: offer?.startTime,
        endTime: offer?.endTime,
        daysOfWeek: offer?.daysOfWeek,
        month: new Date().toISOString().split("T")[0],
        price: parentTransaction.amount,
        status: "active",
      });
      console.log("tutorsession created");
    }
  }

  /**
   * Get cron job status for all jobs
   */
  getCronStatus(): { 
    paymentVerification: { isRunning: boolean; lastRun?: Date };
    cancelledSubscription: { isRunning: boolean; lastRun?: Date };
  } {
    return {
      paymentVerification: {
        isRunning: this.paymentVerificationCron?.getStatus() === "scheduled" || false,
        lastRun: this.lastPaymentVerificationRun,
      },
      cancelledSubscription: {
        isRunning: this.cancelledSubscriptionCron?.getStatus() === "scheduled" || false,
        lastRun: this.lastCancelledSubscriptionRun,
      },
    };
  }
}

export default CronService;

import * as cron from 'node-cron';
import Stripe from 'stripe';
import { ParentTransaction, Offer, TutorSessions } from '@ustaad/shared';

export class CronService {
  private stripe: Stripe | null = null;
  private cronJob: cron.ScheduledTask | null = null;
  private lastRunTime: Date | null = null;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-06-30.basil',
      });
    }
  }

  /**
   * Start the cron job that runs every 10 minutes
   */
  startPaymentVerificationCron(): void {
    if (!this.stripe) {
      console.error('❌ Stripe is not configured. Cron job cannot start.');
      return;
    }

    // Run every 10 minutes
    this.cronJob = cron.schedule('*/10 * * * *', async () => {
      console.log('🕐 Running payment verification cron job...');
      try {
        this.lastRunTime = new Date();
        await this.verifyCompletedTransactions();
        console.log('✅ Payment verification cron job completed successfully');
      } catch (error) {
        console.error('❌ Error in payment verification cron job:', error);
      }
    }, {
      timezone: 'UTC'
    });

    this.cronJob.start();
    console.log('🚀 Payment verification cron job started - runs every 10 minutes');
  }

  /**
   * Stop the cron job
   */
  stopPaymentVerificationCron(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('🛑 Payment verification cron job stopped');
    }
  }

  /**
   * Main method to verify completed transactions
   */
  async verifyCompletedTransactions(): Promise<void> {
    try {
      // 1. Get all completed transactions
      const completedTransactions = await ParentTransaction.findAll({
        where: { 
          status: 'created'
          // Note: 'paid' field might not exist in the model, using status instead
        }
      });

      console.log(`📊 Found ${completedTransactions.length} completed transactions to verify`);

      if (completedTransactions.length === 0) {
        return;
      }

      // 2. Check each transaction's payment status on Stripe
      for (const transaction of completedTransactions) {
        try {
          await this.verifyTransactionPayment(transaction);
        } catch (error) {
          console.error(`❌ Error verifying transaction ${transaction.id}:`, error);
          // Continue with other transactions
        }
      }
    } catch (error) {
      console.error('❌ Error in verifyCompletedTransactions:', error);
      throw error;
    }
  }

  /**
   * Verify a single transaction's payment status on Stripe
   */
  private async verifyTransactionPayment(transaction: any): Promise<void> {
    try {
      if (!transaction.invoiceId) {
        console.log(`⚠️ Transaction ${transaction.id} has no invoice ID, skipping...`);
        return;
      }

      console.log(`🔍 Verifying payment for transaction ${transaction.id} with invoice ${transaction.invoiceId}`);

      // Get invoice from Stripe
      const invoice = await this.stripe!.invoices.retrieve(transaction.invoiceId);
      
      if (!invoice) {
        console.log(`⚠️ Invoice ${transaction.invoiceId} not found on Stripe`);
        return;
      }

      // Check if invoice is paid
      if (invoice.status === 'paid') {
        console.log(`✅ Invoice ${transaction.invoiceId} is paid on Stripe, processing payment...`);
        
        // Process the payment using the existing logic
        await this.handleInvoicePaymentSucceeded(invoice);
        
        // Update transaction status
        await transaction.update({ 
          status: 'paid'
        });
        
        console.log(`✅ Transaction ${transaction.id} marked as paid`);
      } else {
        console.log(`⏳ Invoice ${transaction.invoiceId} is not paid yet (status: ${invoice.status})`);
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

    const offerId = invoice?.subscription_details?.metadata?.offerId;
    const parentTransaction = await ParentTransaction.findOne({
      where: { invoiceId: invoice.id, status: "created" },
    });

    console.log("offerId", offerId);

    const offer = await Offer.findOne({
      where: { id: offerId },
    });

    console.log(offer);

    console.log("we herere 2", parentTransaction);
    if (parentTransaction && offer) {
      console.log("we herere 3");
      parentTransaction.status = "paid";
      await parentTransaction.save();

      console.log("paid added");

      const tutorSession = await TutorSessions.create({
        tutorId: offer?.senderId,
        parentId: parentTransaction.parentId,
        childName: offer?.childName,
        startTime: offer?.startTime,
        endTime: offer?.endTime,
        daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
        month: new Date().toISOString().split("T")[0],
        price: parentTransaction.amount,
        status: "active",
      });

      console.log("tutorsession created");
    }
  }

  /**
   * Get cron job status
   */
  getCronStatus(): { isRunning: boolean; lastRun?: Date } {
    if (!this.cronJob) {
      return { isRunning: false };
    }
    
    return {
      isRunning: this.cronJob.getStatus() === 'scheduled',
      lastRun: this.lastRunTime
    };
  }
}

export default CronService; 
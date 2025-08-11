import { Request, Response } from 'express';
import { sendSuccessResponse } from '../../helper/response';
import { GenericError } from '../../errors/generic-error';
import { AuthenticatedRequest } from '../../middlewares/auth';

export default class CronController {
  /**
   * Get the status of all cron jobs
   */
  getCronStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      const status = cronService.getCronStatus();
      
      sendSuccessResponse(
        res,
        'Cron status retrieved successfully',
        200,
        status
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error retrieving cron status');
    }
  };

  /**
   * Manually trigger the payment verification cron job
   */
  triggerPaymentVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      console.log('🔄 Manually triggering payment verification...');
      
      // Call the public method to verify completed transactions
      await cronService.verifyCompletedTransactions();
      
      sendSuccessResponse(
        res,
        'Payment verification triggered successfully',
        200,
        { message: 'Payment verification process completed' }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error triggering payment verification');
    }
  };

  /**
   * Stop all cron jobs
   */
  stopCronJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      cronService.stopPaymentVerificationCron();
      
      sendSuccessResponse(
        res,
        'Cron jobs stopped successfully',
        200,
        { message: 'All cron jobs have been stopped' }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error stopping cron jobs');
    }
  };

  /**
   * Start all cron jobs
   */
  startCronJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      cronService.startPaymentVerificationCron();
      
      sendSuccessResponse(
        res,
        'Cron jobs started successfully',
        200,
        { message: 'All cron jobs have been started' }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error starting cron jobs');
    }
  };
} 
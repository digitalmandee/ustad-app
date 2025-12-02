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
   * Manually trigger recurring payment processing
   */
  triggerRecurringPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      console.log('🔄 Manually triggering recurring payment processing...');
      
      const result = await cronService.processDueSubscriptions();
      
      sendSuccessResponse(
        res,
        'Recurring payments processed successfully',
        200,
        {
          success: true,
          message: 'Due subscriptions processed',
          result,
        }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error triggering recurring payments');
    }
  };

  /**
   * Manually trigger the cancelled subscription cron job
   */
  triggerCancelledSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      console.log('🔄 Manually triggering cancelled subscription processing...');
      
      // Call the public method to handle cancelled subscriptions
      await cronService.handleCancelledSubscriptions();
      
      sendSuccessResponse(
        res,
        'Cancelled subscription processing triggered successfully',
        200,
        { message: 'Cancelled subscription processing completed' }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error triggering cancelled subscription processing');
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
      
      cronService.stopAllCronJobs();
      
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
      
      cronService.startAllCronJobs();
      
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

  /**
   * Stop cancelled subscription cron job
   */
  stopCancelledSubscriptionCron = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      cronService.stopCancelledSubscriptionCron();
      
      sendSuccessResponse(
        res,
        'Cancelled subscription cron job stopped successfully',
        200,
        { message: 'Cancelled subscription cron job has been stopped' }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error stopping cancelled subscription cron job');
    }
  };

  /**
   * Start cancelled subscription cron job
   */
  startCancelledSubscriptionCron = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cronService = (global as any).cronService;
      
      if (!cronService) {
        throw new GenericError(new Error('Cron service not initialized'), 'Cron service not available');
      }
      
      cronService.startCancelledSubscriptionCron();
      
      sendSuccessResponse(
        res,
        'Cancelled subscription cron job started successfully',
        200,
        { message: 'Cancelled subscription cron job has been started' }
      );
    } catch (error: any) {
      throw new GenericError(error, 'Error starting cancelled subscription cron job');
    }
  };
} 
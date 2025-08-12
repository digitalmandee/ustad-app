import CronService from '../services/cron.service';

export default async () => {
  try {
    console.log('🔄 Initializing cron services...');
    
    const cronService = new CronService();
    
    // Start both cron jobs
    cronService.startAllCronJobs();
    
    // Store the cron service instance globally for potential management
    (global as any).cronService = cronService;
    
    console.log('✅ Cron services initialized successfully');
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, stopping cron jobs...');
      cronService.stopAllCronJobs();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, stopping cron jobs...');
      cronService.stopAllCronJobs();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize cron services:', error);
    throw error;
  }
}; 
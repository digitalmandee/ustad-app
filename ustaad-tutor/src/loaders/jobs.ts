import cron from "node-cron";
import { runSessionCompletionCron } from "../services/cron";

export default () => {
  console.log("⏳ Initializing cron jobs...");

  // Run every 5 minutes
  cron.schedule("*/30 * * * * *", async () => {
    console.log("⏰ Triggering 5-minute cron jobs...");
    await runSessionCompletionCron();
  });

  console.log("✅ Cron jobs scheduled.");
};

import * as cron from "node-cron";
import {
  TutorSessions,
  TutorSessionsDetail,
  User,
  NotificationType,
} from "@ustaad/shared";
import { Op } from "sequelize";
import { sendNotificationToUser } from "./notification.service";

/**
 * Service for handling session reminder notifications
 * Sends notifications 10 minutes before a session starts
 */
export class SessionReminderService {
  private static sentReminders = new Set<string>(); // Track sent reminders to avoid duplicates

  /**
   * Start the cron job that runs every minute to check for upcoming sessions
   */
  static startReminderCron() {
    // Run every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
      await this.checkUpcomingSessions();
    });

    console.log("✅ Session reminder cron started (runs every 10 minutes)");

    // Clean up sent reminders set every day at midnight
    cron.schedule("0 0 * * *", () => {
      this.sentReminders.clear();
      console.log("🧹 Cleared session reminder cache");
    });
  }

  /**
   * Check for sessions starting in 10 minutes and send reminders
   */
  private static async checkUpcomingSessions() {
    try {
      const now = new Date();
      const tenMinutesLater = new Date(now.getTime() + 10 * 60000); // 10 minutes in milliseconds

      // Get today's day of week (e.g., 'monday', 'tuesday')
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const today = daysOfWeek[now.getDay()];

      // Format current time as HH:MM
      const formatTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      const currentTime = formatTime(now);
      const reminderTime = formatTime(tenMinutesLater);

      console.log(
        `⏰ Checking for sessions between ${currentTime} and ${reminderTime} on ${today}`
      );

      // Find active sessions that:
      // 1. Are scheduled for today
      // 2. Start time is within the next 10 minutes
      const upcomingSessions = await TutorSessions.findAll({
        where: {
          status: "active",
          daysOfWeek: {
            [Op.contains]: [today],
          },
          startTime: {
            [Op.between]: [currentTime, reminderTime],
          },
        },
      });

      console.log(`📋 Found ${upcomingSessions.length} upcoming sessions`);

      for (const session of upcomingSessions) {
        // Create unique key for this session today
        const today = new Date().toDateString();
        const reminderKey = `${session.id}_${today}`;

        // Check if we already sent a reminder for this session today
        if (this.sentReminders.has(reminderKey)) {
          continue; // Skip if already sent
        }

        try {
          await this.sendSessionReminders(session);

          // Mark as sent
          this.sentReminders.add(reminderKey);

          console.log(`✅ Sent reminders for session ${session.id}`);
        } catch (error) {
          console.error(
            `❌ Error sending reminders for session ${session.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("❌ Error in session reminder cron:", error);
    }
  }

  /**
   * Send reminder notifications to both tutor and parent
   */
  private static async sendSessionReminders(session: TutorSessions) {
    try {
      const [tutor, parent] = await Promise.all([
        User.findByPk(session.tutorId),
        User.findByPk(session.parentId),
      ]);

      // 🔔 SEND TO TUTOR
      if (tutor?.deviceId) {
        await sendNotificationToUser(
          session.tutorId,
          tutor.deviceId,
          "⏰ Session Starting Soon",
          `Your session with ${session.childName} starts in 10 minutes (${session.startTime})`,
          {
            type: NotificationType.SESSION_REMINDER,
            sessionId: session.id,
            childName: session.childName,
            startTime: session.startTime,
            endTime: session.endTime || "N/A",
            parentName: `${parent?.firstName} ${parent?.lastName}`,
          },
          undefined,
          `/sessions/${session.id}`
        );
        console.log(
          `  ✅ Sent reminder to tutor ${tutor.firstName} ${tutor.lastName}`
        );
      }

      // 🔔 SEND TO PARENT
      if (parent?.deviceId) {
        await sendNotificationToUser(
          session.parentId,
          parent.deviceId,
          "⏰ Session Starting Soon",
          `${tutor?.firstName} ${tutor?.lastName}'s session with ${session.childName} starts in 10 minutes (${session.startTime})`,
          {
            type: NotificationType.SESSION_REMINDER,
            sessionId: session.id,
            childName: session.childName,
            startTime: session.startTime,
            endTime: session.endTime || "N/A",
            tutorName: `${tutor?.firstName} ${tutor?.lastName}`,
          },
          undefined,
          `/sessions/${session.id}`
        );
        console.log(
          `  ✅ Sent reminder to parent ${parent.firstName} ${parent.lastName}`
        );
      }
    } catch (error) {
      console.error("❌ Error sending session reminders:", error);
      throw error;
    }
  }

  /**
   * Manually trigger a check (useful for testing)
   */
  static async triggerManualCheck() {
    console.log("🔔 Manually triggered session reminder check");
    await this.checkUpcomingSessions();
  }
}

import {
  TutorSessionsDetail,
  TutorSessions,
  Offer,
  TutorSessionStatus,
  User,
  NotificationType,
} from "@ustaad/shared";
import { Op } from "sequelize";
import { sendNotificationToUser } from "../notification.service";

export const runSessionCompletionCron = async () => {
  try {
    console.log("⏰ Running Tutor Session Completion Cron...");

    const createdSessions = await TutorSessionsDetail.findAll({
      where: {
        status: TutorSessionStatus.CREATED,
      },
      include: [
        {
          model: TutorSessions,
          include: [
            {
              model: Offer,
            },
          ],
        },
      ],
    });

    console.log(
      `Found ${createdSessions.length} sessions with status CREATED.`
    );

    for (const sessionDetail of createdSessions) {
      try {
        const tutorSession =
          (sessionDetail as any).TutorSessions ||
          (sessionDetail as any).TutorSession;

        if (!tutorSession) {
          console.warn(
            `Session details found for id ${sessionDetail.id} but associated TutorSession is missing.`
          );
          continue;
        }

        const offer =
          tutorSession.Offer || (await Offer.findByPk(tutorSession.offerId));

        // If offer is missing (e.g. direct session without offer?), we might need fallback duration.
        // But typically sessions have offers.
        // If no offer, let's look at TutorSessions startTime and endTime if available.

        let expectedDurationMs = 0;

        if (offer) {
          // Calculate duration from Offer
          const startDate = new Date(`1970-01-01T${offer.startTime}`); // arbitrary date to calc time diff
          const endDate = new Date(`1970-01-01T${offer.endTime}`);
          expectedDurationMs = endDate.getTime() - startDate.getTime();
        } else if (tutorSession.startTime && tutorSession.endTime) {
          // Fallback to session times
          const startDate = new Date(`1970-01-01T${tutorSession.startTime}`);
          const endDate = new Date(`1970-01-01T${tutorSession.endTime}`);
          expectedDurationMs = endDate.getTime() - startDate.getTime();
        } else {
          console.warn(
            `Could not determine duration for session ${tutorSession.id}. Skipping.`
          );
          continue;
        }

        if (expectedDurationMs <= 0) {
          console.warn(
            `Invalid duration ${expectedDurationMs} for session ${tutorSession.id}. Skipping.`
          );
          continue;
        }

        const createdAtTime = new Date(sessionDetail.createdAt).getTime();
        const now = Date.now();
        const elapsedTime = now - createdAtTime;

        // Add a small buffer (e.g., 1 minute) to avoid premature completion?
        // The user requirement says "if 1 hr and 1 hr has passed".
        // Exact completion is fine.

        if (elapsedTime >= expectedDurationMs) {
          console.log(
            `Marking session detail ${sessionDetail.id} as COMPLETED.`
          );

          await sessionDetail.update({ status: TutorSessionStatus.COMPLETED });

          // Send Notification
          const tutorUser = await User.findByPk(sessionDetail.tutorId);
          const parentId = sessionDetail.parentId;

          if (tutorUser && parentId) {
            // Notification Logic
            const title = "👋 Session Completed";
            const body = `${tutorUser.firstName} ${tutorUser.lastName} has completed the session with ${tutorSession.childName}`;

            await sendNotificationHelper(parentId, title, body, {
              type: NotificationType.TUTOR_CHECKED_OUT,
              relatedEntityId: sessionDetail.id,
              relatedEntityType: "sessionDetail",
              tutorName: `${tutorUser.firstName} ${tutorUser.lastName}`,
              childName: tutorSession.childName,
              status: TutorSessionStatus.COMPLETED,
              sessionId: sessionDetail.sessionId,
            });
          }
        }
      } catch (err) {
        console.error(
          `Error processing session detail ${sessionDetail.id}:`,
          err
        );
      }
    }
  } catch (error) {
    console.error("Error in runSessionCompletionCron:", error);
  }
};

async function sendNotificationHelper(
  targetUserId: string,
  headline: string,
  message: string,
  data?: any,
  imageUrl?: string,
  clickAction: string = "/session"
) {
  try {
    const target = await User.findByPk(targetUserId);
    const token = target?.deviceId;
    if (!token) return;

    await sendNotificationToUser(
      targetUserId,
      token,
      headline,
      message,
      data,
      imageUrl,
      clickAction,
      data?.type
    );
    console.log(`✅ Sent notification to ${targetUserId}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "develop.env") });

import {
  connectToPostgres,
  User,
  TutorSessions,
  TutorSessionsDetail,
  TutorSessionStatus,
} from "@ustaad/shared";
import { runSessionCompletionCron } from "../services/cron/completeSessionCron";
import { Op } from "sequelize";

async function runTest() {
  try {
    console.log("🚀 Starting Test...");
    await connectToPostgres();

    // 1. Get a tutor and a parent
    const tutor = await User.findOne({ where: { role: "TUTOR" } });
    const parent = await User.findOne({ where: { role: "PARENT" } });

    if (!tutor || !parent) {
      console.error(
        "❌ Need at least one tutor and one parent in DB to run test."
      );
      return;
    }

    console.log(`Using Tutor: ${tutor.id} and Parent: ${parent.id}`);

    // 2. Create a TutorSession (Direct session with start/end time, no offer for simplicity)
    // Duration: 1 hour (10:00 - 11:00)
    const session = await TutorSessions.create({
      tutorId: tutor.id,
      parentId: parent.id,
      childName: "Test Child",
      startTime: "10:00",
      endTime: "11:00",
      daysOfWeek: ["mon"],
      price: 1000,
      status: "active",
      month: "2023-10-01",
      totalSessions: 1,
      sessionsCompleted: 0,
    });

    console.log(`✅ Created Test Session: ${session.id}`);

    // 3. Create TutorSessionsDetail
    // Created 2 hours ago. Duration is 1 hour. Should be completed.
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const sessionDetail = await TutorSessionsDetail.create({
      tutorId: tutor.id,
      parentId: parent.id,
      sessionId: session.id,
      status: TutorSessionStatus.CREATED,
    });

    // Manually update createdAt since create() sets it to now
    // We need to use setDataValue or raw update usually, but update() works for fields.
    // createdAt is readonly in model usually, but direct update might work or sequelize.query.
    // Let's try direct update using silent: true or just raw query if needed.
    // Or simpler: just pass it in create if model allows (it might ignore it).
    // Let's try updating it.

    await TutorSessionsDetail.update(
      { createdAt: twoHoursAgo },
      { where: { id: sessionDetail.id }, silent: true }
    );

    console.log(
      `✅ Created Session Detail: ${sessionDetail.id} with createdAt: ${twoHoursAgo}`
    );

    // Verify createdAt update
    const verifyDetail = await TutorSessionsDetail.findByPk(sessionDetail.id);
    console.log(`   Verified createdAt: ${verifyDetail?.createdAt}`);

    // 4. Run Cron
    console.log("🏃 Running Cron...");
    await runSessionCompletionCron();

    // 5. Check Result
    const updatedDetail = await TutorSessionsDetail.findByPk(sessionDetail.id);
    console.log(`📊 Status after cron: ${updatedDetail?.status}`);

    if (updatedDetail?.status === TutorSessionStatus.COMPLETED) {
      console.log("✅ TEST PASSED: Session marked as COMPLETED.");
    } else {
      console.error(
        "❌ TEST FAILED: Session status is " + updatedDetail?.status
      );
    }

    // 6. Cleanup
    console.log("🧹 Cleaning up...");
    await sessionDetail.destroy();
    await session.destroy();
    console.log("✅ Cleanup complete.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test Error:", error);
    process.exit(1);
  }
}

runTest();

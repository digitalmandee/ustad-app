import { Sequelize } from "sequelize";
import { connectToPostgres } from "./shared/db";
import { User, Child } from "@ustaad/shared";

async function migrate() {
  console.log(
    "🚀 Starting data migration: Splitting fullName into firstName and lastName..."
  );

  // 1. Connect and initialize models
  const sequelize = await connectToPostgres();

  try {
    // 2. Ensure columns exist (sync alter)
    console.log("📦 Syncing database schema...");
    await sequelize.sync({ alter: true });

    // 3. Migrate User names
    console.log("👤 Migrating User names...");
    const users = await User.findAll({
      where: {
        firstName: null,
        lastName: null,
      },
    } as any);

    let userCount = 0;
    for (const user of users) {
      const fullName = (user as any).fullName;
      if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || "."; // Use dot if no last name provided

        await user.update({
          firstName,
          lastName,
        });
        userCount++;
      }
    }
    console.log(`✅ Migrated ${userCount} users.`);

    // 4. Migrate Child names
    console.log("👶 Migrating Child names...");
    const children = await Child.findAll({
      where: {
        firstName: null,
        lastName: null,
      },
    } as any);

    let childCount = 0;
    for (const child of children) {
      const fullName = (child as any).fullName;
      if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || ".";

        await child.update({
          firstName,
          lastName,
        });
        childCount++;
      }
    }
    console.log(`✅ Migrated ${childCount} children.`);

    console.log("🎉 Data migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sequelize.close();
  }
}

migrate();

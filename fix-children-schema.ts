import { Sequelize, DataTypes } from "sequelize";
import { connectToPostgres } from "./shared/db";

async function runFix() {
  console.log("🛠️ Starting database schema fix...");

  const sequelize = await connectToPostgres();
  const queryInterface = sequelize.getQueryInterface();

  try {
    // 1. Check/Add curriculum column to children table
    console.log("📝 Checking 'curriculum' column in 'children' table...");
    const tableInfo = await queryInterface.describeTable("children");

    if (!tableInfo.curriculum) {
      console.log("➕ Adding 'curriculum' column...");
      await queryInterface.addColumn("children", "curriculum", {
        type: DataTypes.STRING,
        allowNull: true, // Start as null to avoid issues with existing data
      });
      console.log("✅ Added 'curriculum' column.");

      // If you want it to be required later, you can update existing rows and then change it to allowNull: false
      // For now, let's just make it exist.
    } else {
      console.log("ℹ️ 'curriculum' column already exists.");
    }

    // 2. Ensure image column is TEXT (for base64)
    if (tableInfo.image && tableInfo.image.type !== "TEXT") {
      console.log("🔄 Updating 'image' column to TEXT...");
      await queryInterface.changeColumn("children", "image", {
        type: DataTypes.TEXT,
        allowNull: true,
      });
      console.log("✅ Updated 'image' column to TEXT.");
    }

    console.log("🎉 Database schema fix completed successfully!");
  } catch (error) {
    console.error("❌ Fix failed:", error);
  } finally {
    await sequelize.close();
  }
}

runFix();

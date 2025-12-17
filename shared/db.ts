import { Sequelize } from "sequelize";
import { initAllModels, User } from "./models";
import { Gender, UserRole, IsOnBaord } from "./constant/enums";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

let sequelize: Sequelize;

export const connectToPostgres = async (retryCount = 0): Promise<Sequelize> => {
  const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = process.env;

  if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST) {
    throw new Error("❌ Missing DB env vars");
  }

  try {
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
      dialect: "postgres",
      logging: false,
    });

    await sequelize.authenticate();
    console.info("✅ Connected to PostgreSQL");

    initAllModels(sequelize);

    // Ensure a super admin exists
    await createSuperAdmin();

    // Temporarily use force: true to recreate tables with new enum
    // await sequelize.sync({ force: true }); // This will drop and recreate all tables
    // await sequelize.sync({alter: true }); // Use this after first run
    return sequelize;
  } catch (err) {
    console.error("❌ DB connection error:", err);
    if (retryCount < MAX_RETRIES) {
      await new Promise(res => setTimeout(res, RETRY_DELAY));
      return connectToPostgres(retryCount + 1);
    }
    process.exit(1);
  }
};

export { sequelize };

/**
 * Creates a super admin user if it does not already exist.
 * Uses environment variables SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD if provided,
 * otherwise falls back to defaults. Password can be null; downstream services can
 * update it as needed.
 */
async function createSuperAdmin() {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || "admin@ustaad.com";
    const password = process.env.SUPER_ADMIN_PASSWORD || "Pass123@";
    const phone = process.env.SUPER_ADMIN_PHONE || "03000000000";

    // Check if super admin already exists
    const existing = await User.findOne({
      where: { email, role: UserRole.SUPER_ADMIN },
    });

    if (existing) {
      return;
    }

    await User.create({
      email,
      password,
      role: UserRole.SUPER_ADMIN,
      fullName: "Super Admin",
      phone,
      gender: Gender.OTHER,
      isActive: true,
      isAdminVerified: true,
      isOnBoard: IsOnBaord.APPROVED,
      isEmailVerified: true,
      isPhoneVerified: true,
      cnic: null,
      address: "",
      city: "",
      state: "",
      country: "",
      image: null,
      googleId: null,
      deviceId: null,
      isDeleted: false,
    });

    console.info("✅ Super admin user created/ensured");
  } catch (error) {
    console.error("❌ Failed to create super admin user:", error);
  }
}

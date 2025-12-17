"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.connectToPostgres = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const enums_1 = require("./constant/enums");
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
let sequelize;
const connectToPostgres = async (retryCount = 0) => {
    const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = process.env;
    if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST) {
        throw new Error("❌ Missing DB env vars");
    }
    try {
        exports.sequelize = sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASS, {
            host: DB_HOST,
            port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
            dialect: "postgres",
            logging: false,
        });
        await sequelize.authenticate();
        console.info("✅ Connected to PostgreSQL");
        (0, models_1.initAllModels)(sequelize);
        // Ensure a super admin exists
        await createSuperAdmin();
        // Temporarily use force: true to recreate tables with new enum
        // await sequelize.sync({ force: true }); // This will drop and recreate all tables
        // await sequelize.sync({alter: true }); // Use this after first run
        return sequelize;
    }
    catch (err) {
        console.error("❌ DB connection error:", err);
        if (retryCount < MAX_RETRIES) {
            await new Promise(res => setTimeout(res, RETRY_DELAY));
            return (0, exports.connectToPostgres)(retryCount + 1);
        }
        process.exit(1);
    }
};
exports.connectToPostgres = connectToPostgres;
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
        const existing = await models_1.User.findOne({
            where: { email, role: enums_1.UserRole.SUPER_ADMIN },
        });
        if (existing) {
            return;
        }
        await models_1.User.create({
            email,
            password,
            role: enums_1.UserRole.SUPER_ADMIN,
            fullName: "Super Admin",
            phone,
            gender: enums_1.Gender.OTHER,
            isActive: true,
            isAdminVerified: true,
            isOnBoard: enums_1.IsOnBaord.APPROVED,
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
    }
    catch (error) {
        console.error("❌ Failed to create super admin user:", error);
    }
}

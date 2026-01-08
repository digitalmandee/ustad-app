import { Sequelize } from "sequelize";
import { initAllModels } from "./models";

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

      timezone: "+00:00", // ✅ Force UTC
      dialectOptions: {
        useUTC: true, // ✅ PostgreSQL reads/writes UTC
      },
    });

    await sequelize.authenticate();
    console.info("✅ Connected to PostgreSQL");

    initAllModels(sequelize);

    // Temporarily use force: true to recreate tables with new enum
    // await sequelize.sync({ force: true }); // This will drop and recreate all tables
    // await sequelize.sync({alter: true }); // Use this after first run
    return sequelize;
  } catch (err) {
    console.error("❌ DB connection error:", err);
    if (retryCount < MAX_RETRIES) {
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectToPostgres(retryCount + 1);
    }
    process.exit(1);
  }
};

export { sequelize };

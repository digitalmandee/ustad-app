import { Sequelize } from "sequelize";
import { initUserModel } from "../models/User";
import { initTutorModel } from "../models/Tutor";
import { initSubjectModel } from "../models/Subjects";
import { initTutorExperienceModel } from "../models/TutorExperience";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // milliseconds

let sequelize: Sequelize;

/**
 * Connects to PostgreSQL using Sequelize and initializes all models.
 * Retries connection if it fails (up to MAX_RETRIES).
 * @param retryCount - Current retry attempt
 * @returns {Promise<Sequelize>}
 */
export const connectToPostgres = async (retryCount = 0): Promise<Sequelize> => {
  const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = process.env;

  if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST) {
    throw new Error("❌ Missing required database environment variables.");
  }

  try {
    // Initialize Sequelize instance
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
      dialect: "postgres",
      logging: false, // Change to true to enable SQL query logs
    });

    // Attempt to authenticate with the database
    await sequelize.authenticate();
    console.info("✅ Connected to PostgreSQL");

    // Initialize models
    initUserModel(sequelize);
    initTutorModel(sequelize);
    initSubjectModel(sequelize);
    initTutorExperienceModel(sequelize);

    // Sync models with the database
    await sequelize.sync({ alter: true }); // Use force: true only in dev or reset migrations

    return sequelize;
  } catch (error) {
    console.error(`❌ Database connection error: ${error}`);

    if (retryCount < MAX_RETRIES) {
      console.warn(`🔁 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectToPostgres(retryCount + 1);
    }

    console.error("🚫 Max retries reached. Exiting application.");
    process.exit(1);
  }
};

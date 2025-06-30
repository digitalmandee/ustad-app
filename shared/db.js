"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.connectToPostgres = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
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
        await sequelize.sync(); // or alter: true in dev
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

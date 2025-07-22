import { Sequelize } from "sequelize";
declare let sequelize: Sequelize;
export declare const connectToPostgres: (retryCount?: number) => Promise<Sequelize>;
export { sequelize };

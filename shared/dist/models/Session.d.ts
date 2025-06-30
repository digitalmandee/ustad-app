import { Model, Sequelize } from 'sequelize';
export interface SessionAttributes {
    id: number;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Session extends Model<SessionAttributes> implements SessionAttributes {
    id: number;
    userId: string;
    token: string;
    expiresAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initSessionModel(sequelize: Sequelize): typeof Session;

import { Model, Optional, Sequelize } from 'sequelize';
export interface SessionAttributes {
    id: number;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export type SessionCreationAttributes = Optional<SessionAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export declare class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
    id: number;
    userId: string;
    token: string;
    expiresAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initSessionModel(sequelize: Sequelize): typeof Session;

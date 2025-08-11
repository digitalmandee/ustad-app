import { Model, Sequelize, Optional } from "sequelize";
export interface TutorSessionsAttributes {
    id: string;
    tutorId: string;
    parentId: string;
    childName: string;
    startTime: string;
    endTime?: string;
    daysOfWeek: string[];
    price: number;
    meta?: object;
    status: 'active' | 'cancelled';
    createdAt?: Date;
    updatedAt?: Date;
    month: string;
}
export type TutorSessionsCreationAttributes = Optional<TutorSessionsAttributes, "id">;
export declare class TutorSessions extends Model<TutorSessionsAttributes, TutorSessionsCreationAttributes> implements TutorSessionsAttributes {
    id: string;
    tutorId: string;
    parentId: string;
    childName: string;
    startTime: string;
    endTime?: string;
    daysOfWeek: string[];
    price: number;
    meta?: object;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    status: 'active' | 'cancelled';
    month: string;
}
export declare function initTutorSessionsModel(sequelize: Sequelize): typeof TutorSessions;

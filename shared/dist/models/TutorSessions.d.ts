import { Model, Sequelize, Optional } from "sequelize";
export interface TutorSessionsAttributes {
    id: string;
    tutorId: string;
    parentId: string;
    childId: string;
    startedAt: Date;
    endedAt?: Date;
    duration: number;
    daysOfWeek: string[];
    price: number;
    meta?: object;
    createdAt?: Date;
    updatedAt?: Date;
}
export type TutorSessionsCreationAttributes = Optional<TutorSessionsAttributes, "id">;
export declare class TutorSessions extends Model<TutorSessionsAttributes, TutorSessionsCreationAttributes> implements TutorSessionsAttributes {
    id: string;
    tutorId: string;
    parentId: string;
    childId: string;
    startedAt: Date;
    endedAt?: Date;
    duration: number;
    daysOfWeek: string[];
    price: number;
    meta?: object;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorSessionsModel(sequelize: Sequelize): typeof TutorSessions;

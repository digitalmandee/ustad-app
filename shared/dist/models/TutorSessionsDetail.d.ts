import { Model, Sequelize, Optional } from "sequelize";
import { TutorSessionStatus } from "../constant/enums";
export interface TutorSessionsDetailAttributes {
    id?: string;
    tutorId: string;
    sessionId: string;
    status: TutorSessionStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
export type TutorSessionsDetailCreationAttributes = Optional<TutorSessionsDetailAttributes, "id">;
export declare class TutorSessionsDetail extends Model<TutorSessionsDetailAttributes, TutorSessionsDetailCreationAttributes> implements TutorSessionsDetailAttributes {
    id: string;
    tutorId: string;
    sessionId: string;
    status: TutorSessionStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorSessionsDetailModel(sequelize: Sequelize): typeof TutorSessionsDetail;

import { Model, Sequelize, Optional } from "sequelize";
export interface SubjectCostSetting {
    cost: number;
    active: boolean;
}
export interface TutorSettingsAttributes {
    id: string;
    tutorId: string;
    minSubjects: number;
    maxStudentsDaily: number;
    subjectCosts: Record<string, SubjectCostSetting>;
    createdAt?: Date;
    updatedAt?: Date;
}
export type TutorSettingsCreationAttributes = Optional<TutorSettingsAttributes, "id">;
export declare class TutorSettings extends Model<TutorSettingsAttributes, TutorSettingsCreationAttributes> implements TutorSettingsAttributes {
    id: string;
    tutorId: string;
    minSubjects: number;
    maxStudentsDaily: number;
    subjectCosts: Record<string, SubjectCostSetting>;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorSettingsModel(sequelize: Sequelize): typeof TutorSettings;

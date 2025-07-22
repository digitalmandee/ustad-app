import { Model, Sequelize } from "sequelize";
export interface TutorExperienceAttributes {
    id: number;
    tutorId: string;
    company: string;
    startDate: Date;
    endDate: Date;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class TutorExperience extends Model<TutorExperienceAttributes> {
    id: number;
    tutorId: string;
    company: string;
    startDate: Date;
    endDate: Date;
    description: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorExperienceModel(sequelize: Sequelize): typeof TutorExperience;

import { Model, Sequelize } from "sequelize";
export interface TutorEducationAttributes {
    id: number;
    tutorId: string;
    institute: string;
    startDate: Date;
    endDate?: Date | string | null;
    description: string;
    degree?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class TutorEducation extends Model<TutorEducationAttributes> {
    id: number;
    tutorId: string;
    institute: string;
    startDate: Date;
    endDate?: Date | string | null;
    description: string;
    degree?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorEducationModel(sequelize: Sequelize): typeof TutorEducation;

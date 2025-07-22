import { Model, Sequelize, Optional } from "sequelize";
export interface TutorAttributes {
    id: string;
    userId: string;
    bankName: string;
    accountNumber: string;
    subjects: string[];
    ifscCode?: string;
    upiId?: string;
    resumeUrl: string;
    idFrontUrl: string;
    idBackUrl: string;
    about: string;
    grade: string;
    balance: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export type TutorCreationAttributes = Optional<TutorAttributes, "id" | "balance">;
export declare class Tutor extends Model<TutorAttributes, TutorCreationAttributes> implements TutorAttributes {
    id: string;
    userId: string;
    bankName: string;
    accountNumber: string;
    subjects: string[];
    resumeUrl: string;
    idFrontUrl: string;
    idBackUrl: string;
    about: string;
    grade: string;
    balance: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorModel(sequelize: Sequelize): typeof Tutor;

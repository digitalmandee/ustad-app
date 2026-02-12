import { Model, Sequelize, Optional } from "sequelize";
export interface TutorAttributes {
    id: string;
    userId: string;
    idFrontUrl: string;
    idBackUrl: string;
    customerId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    accountNumber?: string;
    bankName?: string;
}
export type TutorCreationAttributes = Optional<TutorAttributes, "id">;
export declare class Parent extends Model<TutorAttributes, TutorCreationAttributes> implements TutorAttributes {
    id: string;
    userId: string;
    idFrontUrl: string;
    idBackUrl: string;
    customerId?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    accountNumber: string;
    bankName: string;
}
export declare function initParentModel(sequelize: Sequelize): typeof Parent;

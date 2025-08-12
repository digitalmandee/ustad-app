import { Model, Sequelize, Optional } from "sequelize";
import { TutorPaymentStatus } from "../constant/enums";
export interface TutorTransactionAttributes {
    id: string;
    tutorId: string;
    subscriptionId: string;
    status: TutorPaymentStatus;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export type TutorTransactionCreationAttributes = Optional<TutorTransactionAttributes, "id">;
export declare class TutorTransaction extends Model<TutorTransactionAttributes, TutorTransactionCreationAttributes> implements TutorTransactionAttributes {
    id: string;
    tutorId: string;
    subscriptionId: string;
    status: TutorPaymentStatus;
    amount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorTransactionModel(sequelize: Sequelize): typeof TutorTransaction;

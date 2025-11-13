import { Model, Sequelize, Optional } from "sequelize";
import { TutorPaymentStatus, TutorTransactionType } from "../constant/enums";
export interface TutorTransactionAttributes {
    id: string;
    tutorId: string;
    subscriptionId: string;
    status: TutorPaymentStatus;
    amount: number;
    transactionType: TutorTransactionType;
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
    transactionType: TutorTransactionType;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorTransactionModel(sequelize: Sequelize): typeof TutorTransaction;

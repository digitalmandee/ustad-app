import { Model, Sequelize, Optional } from "sequelize";
export interface ParentTransactionAttributes {
    id: string;
    parentId: string;
    subscriptionId: string;
    invoiceId: string;
    status: string;
    amount: number;
    childName: string;
    basketId?: string;
    orderStatus?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export type ParentTransactionCreationAttributes = Optional<ParentTransactionAttributes, "id">;
export declare class ParentTransaction extends Model<ParentTransactionAttributes, ParentTransactionCreationAttributes> implements ParentTransactionAttributes {
    id: string;
    parentId: string;
    subscriptionId: string;
    invoiceId: string;
    status: string;
    amount: number;
    childName: string;
    basketId?: string;
    orderStatus?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initParentTransactionModel(sequelize: Sequelize): typeof ParentTransaction;

import { Model, Sequelize, Optional } from "sequelize";
import { PaymentStatus } from "../constant/enums";
export interface PaymentRequestAttributes {
    id: string;
    tutorId: string;
    amount: number;
    status: PaymentStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
export type PaymentRequestCreationAttributes = Optional<PaymentRequestAttributes, "id">;
export declare class PaymentRequest extends Model<PaymentRequestAttributes, PaymentRequestCreationAttributes> implements PaymentRequestAttributes {
    id: string;
    tutorId: string;
    amount: number;
    status: PaymentStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initPaymentRequestModel(sequelize: Sequelize): typeof PaymentRequest;

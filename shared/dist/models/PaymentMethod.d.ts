import { Model, Sequelize, Optional } from "sequelize";
export interface PaymentMethodAttributes {
    id: string;
    parentId: string;
    stripePaymentMethodId: string;
    cardBrand: string;
    cardLast4: string;
    cardExpMonth: number;
    cardExpYear: number;
    isDefault: boolean;
    instrumentToken?: string;
    paymentProvider?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export type PaymentMethodCreationAttributes = Optional<PaymentMethodAttributes, "id">;
export declare class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes> implements PaymentMethodAttributes {
    id: string;
    parentId: string;
    stripePaymentMethodId: string;
    cardBrand: string;
    cardLast4: string;
    cardExpMonth: number;
    cardExpYear: number;
    isDefault: boolean;
    instrumentToken?: string;
    paymentProvider?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initPaymentMethodModel(sequelize: Sequelize): typeof PaymentMethod;

import { Model, Sequelize, Optional } from "sequelize";
export interface ParentSubscriptionAttributes {
    id: string;
    parentId: string;
    tutorId: string;
    offerId: string;
    stripeSubscriptionId: string;
    status: string;
    planType: string;
    startDate: Date;
    endDate?: Date;
    amount: number;
    disputeReason?: string;
    disputedBy?: string;
    disputedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export type ParentSubscriptionCreationAttributes = Optional<ParentSubscriptionAttributes, "id">;
export declare class ParentSubscription extends Model<ParentSubscriptionAttributes, ParentSubscriptionCreationAttributes> implements ParentSubscriptionAttributes {
    id: string;
    parentId: string;
    tutorId: string;
    offerId: string;
    stripeSubscriptionId: string;
    status: string;
    planType: string;
    startDate: Date;
    endDate?: Date;
    amount: number;
    disputeReason?: string;
    disputedBy?: string;
    disputedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initParentSubscriptionModel(sequelize: Sequelize): typeof ParentSubscription;

import { Model, Optional, Sequelize } from 'sequelize';
import { OfferStatus } from '../constant/enums';
interface OfferAttributes {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    messageId: string;
    childName: string;
    amountMonthly: number;
    subject: string;
    startDate: Date;
    startTime: string;
    endTime: string;
    description?: string;
    status: OfferStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
interface OfferCreationAttributes extends Optional<OfferAttributes, 'id' | 'description' | 'status' | 'createdAt' | 'updatedAt'> {
}
export declare class Offer extends Model<OfferAttributes, OfferCreationAttributes> implements OfferAttributes {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    messageId: string;
    childName: string;
    amountMonthly: number;
    subject: string;
    startDate: Date;
    startTime: string;
    endTime: string;
    description: string;
    status: OfferStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initOfferModel(sequelize: Sequelize): typeof Offer;
export {};

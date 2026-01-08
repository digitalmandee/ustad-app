import { Model, Optional, Sequelize } from "sequelize";
import { MessageType, MessageStatus } from "../constant/enums";
export interface MessageAttributes {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: MessageType;
    status: MessageStatus;
    replyToId?: string;
    editedAt?: Date;
    metadata?: object;
    createdAt?: Date;
    updatedAt?: Date;
}
export type MessageCreationAttributes = Optional<MessageAttributes, "id" | "status" | "replyToId" | "editedAt" | "metadata" | "createdAt" | "updatedAt">;
export declare class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: MessageType;
    status: MessageStatus;
    replyToId: string;
    editedAt: Date;
    metadata: object;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initMessageModel(sequelize: Sequelize): typeof Message;

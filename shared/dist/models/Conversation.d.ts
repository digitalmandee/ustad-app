import { Model, Optional, Sequelize } from 'sequelize';
import { ConversationType, ConversationStatus } from '../constant/enums';
export interface ConversationAttributes {
    id: string;
    name?: string;
    description?: string;
    type: ConversationType;
    status: ConversationStatus;
    createdBy: string;
    lastMessageAt?: Date;
    isPrivate: boolean;
    maxParticipants?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export type ConversationCreationAttributes = Optional<ConversationAttributes, 'id' | 'name' | 'description' | 'status' | 'lastMessageAt' | 'isPrivate' | 'maxParticipants' | 'createdAt' | 'updatedAt'>;
export declare class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
    id: string;
    name: string;
    description: string;
    type: ConversationType;
    status: ConversationStatus;
    createdBy: string;
    lastMessageAt: Date;
    isPrivate: boolean;
    maxParticipants: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initConversationModel(sequelize: Sequelize): typeof Conversation;

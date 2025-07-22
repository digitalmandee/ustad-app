import { Model, Optional, Sequelize } from 'sequelize';
export interface ConversationParticipantAttributes {
    id: string;
    conversationId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    lastReadAt?: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export type ConversationParticipantCreationAttributes = Optional<ConversationParticipantAttributes, 'id' | 'role' | 'lastReadAt' | 'isActive' | 'createdAt' | 'updatedAt'>;
export declare class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
    id: string;
    conversationId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    lastReadAt: Date;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initConversationParticipantModel(sequelize: Sequelize): typeof ConversationParticipant;

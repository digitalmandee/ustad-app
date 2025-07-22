"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationParticipant = void 0;
exports.initConversationParticipantModel = initConversationParticipantModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const Conversation_1 = require("./Conversation");
class ConversationParticipant extends sequelize_1.Model {
}
exports.ConversationParticipant = ConversationParticipant;
function initConversationParticipantModel(sequelize) {
    ConversationParticipant.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        conversationId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'conversations',
                key: 'id',
            },
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        role: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            defaultValue: 'member',
        },
        joinedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        lastReadAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'conversation_participants',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'conversationId'],
            },
        ],
    });
    Conversation_1.Conversation.hasMany(ConversationParticipant, {
        foreignKey: 'conversationId',
        as: 'participants',
    });
    ConversationParticipant.belongsTo(Conversation_1.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation',
    });
    ConversationParticipant.belongsTo(User_1.User, { foreignKey: 'userId' });
    User_1.User.hasMany(ConversationParticipant, { foreignKey: 'userId' });
    return ConversationParticipant;
}

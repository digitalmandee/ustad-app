"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
exports.initConversationModel = initConversationModel;
const sequelize_1 = require("sequelize");
const enums_1 = require("../constant/enums");
class Conversation extends sequelize_1.Model {
}
exports.Conversation = Conversation;
function initConversationModel(sequelize) {
    Conversation.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.ConversationType)),
            allowNull: false,
            defaultValue: enums_1.ConversationType.DIRECT,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.ConversationStatus)),
            allowNull: false,
            defaultValue: enums_1.ConversationStatus.ACTIVE,
        },
        createdBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        lastMessageAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        isPrivate: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        maxParticipants: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
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
        tableName: 'conversations',
        sequelize,
        timestamps: true,
    });
    return Conversation;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
exports.initMessageModel = initMessageModel;
const sequelize_1 = require("sequelize");
const enums_1 = require("../constant/enums");
const User_1 = require("./User");
class Message extends sequelize_1.Model {
}
exports.Message = Message;
function initMessageModel(sequelize) {
    Message.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        conversationId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "conversations",
                key: "id",
            },
        },
        senderId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.MessageType)),
            allowNull: false,
            defaultValue: enums_1.MessageType.TEXT,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.MessageStatus)),
            allowNull: false,
            defaultValue: enums_1.MessageStatus.SENT,
        },
        replyToId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: "messages",
                key: "id",
            },
        },
        editedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
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
        tableName: "messages",
        sequelize,
        timestamps: true,
    });
    Message.belongsTo(User_1.User, { foreignKey: "senderId", as: "sender" });
    return Message;
}

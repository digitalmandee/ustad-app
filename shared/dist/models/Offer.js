"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offer = void 0;
exports.initOfferModel = initOfferModel;
const sequelize_1 = require("sequelize");
const Conversation_1 = require("./Conversation");
const User_1 = require("./User");
const Message_1 = require("./Message");
class Offer extends sequelize_1.Model {
}
exports.Offer = Offer;
function initOfferModel(sequelize) {
    Offer.init({
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
            onDelete: 'CASCADE',
        },
        senderId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        receiverId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        messageId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'messages',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        childName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        amountMonthly: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        subject: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        startDate: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false,
        },
        startTime: {
            type: sequelize_1.DataTypes.TIME,
            allowNull: false,
        },
        endTime: {
            type: sequelize_1.DataTypes.TIME,
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        daysOfWeek: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: 'offers',
        timestamps: true,
    });
    // Associations
    Offer.belongsTo(Conversation_1.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
    Offer.belongsTo(User_1.User, { foreignKey: 'senderId', as: 'sender' });
    Offer.belongsTo(User_1.User, { foreignKey: 'receiverId', as: 'receiver' });
    Offer.belongsTo(Message_1.Message, { foreignKey: 'messageId', as: 'message' });
    Message_1.Message.hasOne(Offer, { foreignKey: 'messageId', as: 'offer' });
    return Offer;
}

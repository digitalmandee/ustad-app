"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
exports.initNotificationModel = initNotificationModel;
const sequelize_1 = require("sequelize");
class Notification extends sequelize_1.Model {
}
exports.Notification = Notification;
function initNotificationModel(sequelize) {
    Notification.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM('NEW_MESSAGE', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'SESSION_REMINDER', 'SESSION_CANCELLED_BY_PARENT', 'SESSION_CANCELLED_BY_TUTOR', 'TUTOR_CHECKED_IN', 'TUTOR_CHECKED_OUT', 'TUTOR_ON_LEAVE', 'TUTOR_HOLIDAY', 'SUBSCRIPTION_CANCELLED_BY_PARENT', 'SUBSCRIPTION_CANCELLED_BY_TUTOR', 'REVIEW_RECEIVED_TUTOR', 'REVIEW_RECEIVED_CHILD', 'SYSTEM_NOTIFICATION'),
            allowNull: false,
            comment: "Notification type",
        },
        title: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        body: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        isRead: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        sentAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        readAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        deviceToken: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: "Firebase device token",
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('pending', 'sent', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        relatedEntityId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            comment: "ID of related entity (offer, message, session, etc.)",
        },
        relatedEntityType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: "Type of related entity (offer, message, session, review, etc.)",
        },
        actionUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: "Deep link URL to navigate to when notification is clicked",
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            comment: "Additional metadata for the notification",
        },
    }, {
        sequelize,
        tableName: "notifications",
        timestamps: true,
    });
    return Notification;
}

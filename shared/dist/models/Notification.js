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
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            comment: "Notification type (e.g., 'booking_confirmation', 'session_reminder')",
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
    }, {
        sequelize,
        tableName: "notifications",
        timestamps: true,
    });
    return Notification;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
exports.initFileModel = initFileModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const Conversation_1 = require("./Conversation");
class File extends sequelize_1.Model {
}
exports.File = File;
function initFileModel(sequelize) {
    File.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        conversationId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        filename: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        originalName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        mimetype: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        size: {
            type: sequelize_1.DataTypes.BIGINT, // allows very large file sizes
            allowNull: false,
        },
        url: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'deleted', 'expired'),
            allowNull: false,
            defaultValue: 'active',
        },
        thumbnailUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        expiresAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB, // flexible for extra info
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
        tableName: 'files',
        sequelize,
        timestamps: true,
        indexes: [
            { fields: ['conversationId'] },
            { fields: ['userId'] },
            { fields: ['status'] },
        ],
    });
    // User -> File
    User_1.User.hasMany(File, {
        foreignKey: "userId",
        onDelete: "CASCADE", // delete all files when user is deleted
    });
    File.belongsTo(User_1.User, { foreignKey: "userId" });
    // Conversation -> File
    Conversation_1.Conversation.hasMany(File, {
        foreignKey: "conversationId",
        onDelete: "CASCADE", // delete all files when conversation is deleted
    });
    File.belongsTo(Conversation_1.Conversation, { foreignKey: "conversationId" });
    return File;
}

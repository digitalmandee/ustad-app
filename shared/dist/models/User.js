"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
exports.initUserModel = initUserModel;
// user.model.ts
const sequelize_1 = require("sequelize");
const enums_1 = require("../constant/enums");
const enums_2 = require("../constant/enums");
class User extends sequelize_1.Model {
}
exports.User = User;
function initUserModel(sequelize) {
    User.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        role: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.UserRole)),
            allowNull: false,
            defaultValue: enums_1.UserRole.PARENT,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isAdminVerified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isOnBoard: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_2.IsOnBaord)),
            allowNull: false,
            defaultValue: enums_2.IsOnBaord.REQUIRED,
        },
        fullName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        cnic: {
            type: sequelize_1.DataTypes.STRING(13),
            allowNull: true,
            unique: true,
        },
        address: sequelize_1.DataTypes.STRING,
        city: sequelize_1.DataTypes.STRING,
        state: sequelize_1.DataTypes.STRING,
        country: sequelize_1.DataTypes.STRING,
        // Store profilePic as TEXT to accommodate large base64 strings
        profilePic: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
            comment: "Base64-encoded profile picture",
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        isEmailVerified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        phone: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        isPhoneVerified: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        googleId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            unique: true,
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
        tableName: "users",
        sequelize,
        timestamps: true,
    });
    return User;
}

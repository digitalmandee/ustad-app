"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = void 0;
exports.initOtpModel = initOtpModel;
// otp.model.ts
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const enums_1 = require("../constant/enums");
class Otp extends sequelize_1.Model {
}
exports.Otp = Otp;
function initOtpModel(sequelize) {
    Otp.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: User_1.User.tableName,
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        type: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.OtpType)),
            allowNull: false,
        },
        purpose: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.OtpPurpose)),
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.OtpStatus)),
            allowNull: false,
        },
        otp: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        expiry: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        usedAt: {
            type: sequelize_1.DataTypes.DATE,
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
        tableName: 'otps',
        sequelize,
        timestamps: true,
    });
    Otp.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
    User_1.User.hasMany(Otp, { foreignKey: 'userId', as: 'otps' });
    return Otp;
}

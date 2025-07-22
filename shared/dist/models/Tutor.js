"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tutor = void 0;
exports.initTutorModel = initTutorModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class Tutor extends sequelize_1.Model {
}
exports.Tutor = Tutor;
function initTutorModel(sequelize) {
    Tutor.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: "users",
                key: "id",
            },
        },
        bankName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        accountNumber: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        subjects: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: false,
        },
        resumeUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        idFrontUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        idBackUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        about: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        grade: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        balance: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        sequelize,
        tableName: "tutors",
    });
    Tutor.belongsTo(User_1.User, { foreignKey: "userId" });
    User_1.User.hasOne(Tutor, { foreignKey: "userId" });
    return Tutor;
}

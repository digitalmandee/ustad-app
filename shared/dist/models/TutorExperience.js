"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorExperience = void 0;
exports.initTutorExperienceModel = initTutorExperienceModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class TutorExperience extends sequelize_1.Model {
}
exports.TutorExperience = TutorExperience;
function initTutorExperienceModel(sequelize) {
    TutorExperience.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        company: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        startDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        endDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        designation: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            field: "dasignation",
        },
    }, {
        sequelize,
        tableName: "tutor_experiences",
    });
    TutorExperience.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(TutorExperience, { foreignKey: "tutorId" });
    return TutorExperience;
}

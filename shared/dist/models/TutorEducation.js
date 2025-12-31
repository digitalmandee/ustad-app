"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorEducation = void 0;
exports.initTutorEducationModel = initTutorEducationModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class TutorEducation extends sequelize_1.Model {
}
exports.TutorEducation = TutorEducation;
function initTutorEducationModel(sequelize) {
    TutorEducation.init({
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
        institute: {
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
        degree: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: "tutor_educations",
    });
    TutorEducation.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(TutorEducation, { foreignKey: "tutorId" });
    return TutorEducation;
}

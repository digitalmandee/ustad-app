"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorExperience = void 0;
exports.initTutorExperienceModel = initTutorExperienceModel;
const sequelize_1 = require("sequelize");
const Tutor_1 = require("./Tutor");
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
                model: "tutors",
                key: "userId",
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
    }, {
        sequelize,
        tableName: "tutor_experiences",
    });
    TutorExperience.belongsTo(Tutor_1.Tutor, { foreignKey: "tutorId" });
    Tutor_1.Tutor.hasMany(TutorExperience, { foreignKey: "tutorId" });
    return TutorExperience;
}

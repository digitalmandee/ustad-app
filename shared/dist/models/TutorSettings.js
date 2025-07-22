"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSettings = void 0;
exports.initTutorSettingsModel = initTutorSettingsModel;
const sequelize_1 = require("sequelize");
const Tutor_1 = require("./Tutor");
class TutorSettings extends sequelize_1.Model {
}
exports.TutorSettings = TutorSettings;
function initTutorSettingsModel(sequelize) {
    TutorSettings.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "tutors",
                key: "id",
            },
            unique: true,
        },
        minSubjects: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        maxStudentsDaily: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        subjectCosts: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    }, {
        sequelize,
        tableName: "tutor_settings",
    });
    TutorSettings.belongsTo(Tutor_1.Tutor, { foreignKey: "tutorId" });
    Tutor_1.Tutor.hasOne(TutorSettings, { foreignKey: "tutorId" });
    return TutorSettings;
}

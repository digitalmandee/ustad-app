"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSettings = void 0;
exports.initTutorSettingsModel = initTutorSettingsModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
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
                model: "users",
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
    TutorSettings.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasOne(TutorSettings, { foreignKey: "tutorId" });
    return TutorSettings;
}

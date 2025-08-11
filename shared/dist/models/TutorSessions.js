"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSessions = void 0;
exports.initTutorSessionsModel = initTutorSessionsModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class TutorSessions extends sequelize_1.Model {
}
exports.TutorSessions = TutorSessions;
function initTutorSessionsModel(sequelize) {
    TutorSessions.init({
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
        },
        parentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        childName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        startTime: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        endTime: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        daysOfWeek: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: false,
            comment: "Array of days like ['mon', 'tue', 'fri'] or ['mon-fri']",
        },
        price: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "Price per session in cents (e.g., 2500 for $25.00)",
        },
        meta: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'cancelled'),
            allowNull: false,
            defaultValue: 'active',
        },
        month: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            comment: "Month in yyyy-mm-dd format",
        },
    }, {
        sequelize,
        tableName: "tutorSessions",
    });
    TutorSessions.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(TutorSessions, { foreignKey: "tutorId" });
    TutorSessions.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(TutorSessions, { foreignKey: "parentId" });
    return TutorSessions;
}

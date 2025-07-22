"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSessions = void 0;
exports.initTutorSessionsModel = initTutorSessionsModel;
const sequelize_1 = require("sequelize");
const Tutor_1 = require("./Tutor");
const Parent_1 = require("./Parent");
const Child_1 = require("./Child");
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
                model: "tutors",
                key: "id",
            },
        },
        parentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "parents",
                key: "id",
            },
        },
        childId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "children",
                key: "id",
            },
        },
        startedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        endedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        duration: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            comment: "Duration in minutes (e.g., 60 for 1 hour, 120 for 2 hours)",
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
    }, {
        sequelize,
        tableName: "tutorSessions",
    });
    TutorSessions.belongsTo(Tutor_1.Tutor, { foreignKey: "tutorId" });
    Tutor_1.Tutor.hasMany(TutorSessions, { foreignKey: "tutorId" });
    TutorSessions.belongsTo(Parent_1.Parent, { foreignKey: "parentId" });
    Parent_1.Parent.hasMany(TutorSessions, { foreignKey: "parentId" });
    TutorSessions.belongsTo(Child_1.Child, { foreignKey: "childId" });
    Child_1.Child.hasMany(TutorSessions, { foreignKey: "childId" });
    return TutorSessions;
}

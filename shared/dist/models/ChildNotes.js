"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildNotes = void 0;
exports.initChildNotesModel = initChildNotesModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const TutorSessionsDetail_1 = require("./TutorSessionsDetail");
class ChildNotes extends sequelize_1.Model {
}
exports.ChildNotes = ChildNotes;
function initChildNotesModel(sequelize) {
    ChildNotes.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        sessionId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "tutorSessionsDetail",
                key: "id",
            },
        },
        childName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        headline: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "childNotes",
    });
    ChildNotes.belongsTo(TutorSessionsDetail_1.TutorSessionsDetail, { foreignKey: "sessionId" });
    TutorSessionsDetail_1.TutorSessionsDetail.hasMany(ChildNotes, { foreignKey: "sessionId" });
    ChildNotes.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(ChildNotes, { foreignKey: "tutorId" });
    return ChildNotes;
}

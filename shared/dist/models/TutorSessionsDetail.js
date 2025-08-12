"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorSessionsDetail = void 0;
exports.initTutorSessionsDetailModel = initTutorSessionsDetailModel;
const sequelize_1 = require("sequelize");
const enums_1 = require("../constant/enums");
const TutorSessions_1 = require("./TutorSessions");
const User_1 = require("./User");
class TutorSessionsDetail extends sequelize_1.Model {
}
exports.TutorSessionsDetail = TutorSessionsDetail;
function initTutorSessionsDetailModel(sequelize) {
    TutorSessionsDetail.init({
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
        sessionId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "tutorSessions",
                key: "id",
            },
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.TutorSessionStatus)),
            allowNull: false,
            defaultValue: enums_1.TutorSessionStatus.CREATED,
        },
    }, {
        sequelize,
        tableName: "tutorSessionsDetail",
    });
    TutorSessionsDetail.belongsTo(TutorSessions_1.TutorSessions, { foreignKey: "sessionId" });
    TutorSessions_1.TutorSessions.hasMany(TutorSessionsDetail, { foreignKey: "sessionId" });
    TutorSessionsDetail.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(TutorSessionsDetail, { foreignKey: "tutorId" });
    TutorSessionsDetail.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(TutorSessionsDetail, { foreignKey: "parentId" });
    return TutorSessionsDetail;
}

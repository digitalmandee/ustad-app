"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpRequests = void 0;
exports.initHelpRequestsModel = initHelpRequestsModel;
const sequelize_1 = require("sequelize");
const enums_1 = require("../constant/enums");
class HelpRequests extends sequelize_1.Model {
}
exports.HelpRequests = HelpRequests;
function initHelpRequestsModel(sequelize) {
    HelpRequests.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        requesterId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        againstId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
        },
        requester: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.UserRole)),
            allowNull: false,
        },
        subject: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.HelpRequestStatus)),
            allowNull: false,
            defaultValue: enums_1.HelpRequestStatus.OPEN,
        },
        message: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.HelpRequestType)),
            allowNull: false,
            defaultValue: enums_1.HelpRequestType.GENERAL,
        },
        data: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: "help_requests",
        timestamps: true,
    });
    return HelpRequests;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorTransaction = void 0;
exports.initTutorTransactionModel = initTutorTransactionModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const ParentSubscription_1 = require("./ParentSubscription");
const enums_1 = require("../constant/enums");
class TutorTransaction extends sequelize_1.Model {
}
exports.TutorTransaction = TutorTransaction;
function initTutorTransactionModel(sequelize) {
    TutorTransaction.init({
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
        subscriptionId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "parent_subscriptions",
                key: "id",
            },
        },
        amount: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.TutorPaymentStatus)),
            allowNull: false,
            defaultValue: enums_1.TutorPaymentStatus.PENDING,
        },
    }, {
        sequelize,
        tableName: "tutor_transactions",
    });
    // Define associations
    TutorTransaction.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(TutorTransaction, { foreignKey: "tutorId" });
    TutorTransaction.belongsTo(ParentSubscription_1.ParentSubscription, {
        foreignKey: "subscriptionId",
    });
    ParentSubscription_1.ParentSubscription.hasMany(TutorTransaction, {
        foreignKey: "subscriptionId",
    });
    return TutorTransaction;
}

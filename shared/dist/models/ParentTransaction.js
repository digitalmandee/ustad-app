"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentTransaction = void 0;
exports.initParentTransactionModel = initParentTransactionModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const ParentSubscription_1 = require("./ParentSubscription");
class ParentTransaction extends sequelize_1.Model {
}
exports.ParentTransaction = ParentTransaction;
function initParentTransactionModel(sequelize) {
    ParentTransaction.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        parentId: {
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
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            defaultValue: "created",
        },
        invoiceId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        childName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        // PayFast fields
        basketId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        orderStatus: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            defaultValue: "PENDING",
            validate: {
                isIn: [["PENDING", "SUCCESS", "FAILED"]],
            },
        },
    }, {
        sequelize,
        tableName: "parent_transactions",
    });
    // Define associations
    ParentTransaction.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(ParentTransaction, { foreignKey: "parentId" });
    ParentTransaction.belongsTo(ParentSubscription_1.ParentSubscription, {
        foreignKey: "subscriptionId",
    });
    ParentSubscription_1.ParentSubscription.hasMany(ParentTransaction, {
        foreignKey: "subscriptionId",
    });
    return ParentTransaction;
}

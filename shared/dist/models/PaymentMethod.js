"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = void 0;
exports.initPaymentMethodModel = initPaymentMethodModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class PaymentMethod extends sequelize_1.Model {
}
exports.PaymentMethod = PaymentMethod;
function initPaymentMethodModel(sequelize) {
    PaymentMethod.init({
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
        cvv: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        // PayFast fields
        instrumentToken: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: "PayFast recurring payment token",
        },
        paymentProvider: {
            type: sequelize_1.DataTypes.ENUM("STRIPE", "PAYFAST"),
            allowNull: true,
            defaultValue: "STRIPE",
            comment: "Payment provider type",
        },
    }, {
        sequelize,
        tableName: "payment_methods",
    });
    PaymentMethod.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(PaymentMethod, { foreignKey: "parentId" });
    return PaymentMethod;
}

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
        stripePaymentMethodId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        cardBrand: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        cardLast4: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        cardExpMonth: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        cardExpYear: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        isDefault: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        sequelize,
        tableName: "payment_methods",
    });
    PaymentMethod.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(PaymentMethod, { foreignKey: "parentId" });
    return PaymentMethod;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRequest = void 0;
exports.initPaymentRequestModel = initPaymentRequestModel;
const sequelize_1 = require("sequelize");
const enums_1 = require("../constant/enums");
class PaymentRequest extends sequelize_1.Model {
}
exports.PaymentRequest = PaymentRequest;
function initPaymentRequestModel(sequelize) {
    PaymentRequest.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(...Object.values(enums_1.PaymentStatus)),
            defaultValue: enums_1.PaymentStatus.PENDING,
        },
    }, {
        sequelize,
        tableName: "paymentRequests",
        timestamps: true,
    });
    return PaymentRequest;
}

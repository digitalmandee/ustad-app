const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ParentTransaction = sequelize.define(
    "ParentTransaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "parent_subscriptions",
          key: "id",
        },
      },
      paid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "parent_transactions",
    }
  );

  ParentTransaction.associate = (models) => {
    ParentTransaction.belongsTo(models.User, { foreignKey: "parentId" });
    ParentTransaction.belongsTo(models.ParentSubscription, { foreignKey: "subscriptionId" });
  };

  return ParentTransaction;
}; 
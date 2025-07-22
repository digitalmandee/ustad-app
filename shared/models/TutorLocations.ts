import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Tutor } from "./Tutor";

export interface TutorLocationAttributes {
  id: string;
  tutorId: string;
  latitude: number;
  longitude: number;
  address: string;
  geoHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorLocationCreationAttributes = Optional<
  TutorLocationAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export class TutorLocation
  extends Model<TutorLocationAttributes, TutorLocationCreationAttributes>
  implements TutorLocationAttributes
{
  public id!: string;
  public tutorId!: string;
  public latitude!: number;
  public longitude!: number;
  public address!: string;
  public geoHash!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorLocationModel(
  sequelize: Sequelize
): typeof TutorLocation {
  TutorLocation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tutorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tutors",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      geoHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "tutor_locations",
      timestamps: true,
      indexes: [
        {
          name: "idx_geohash",
          fields: ["geoHash"],
        },
      ],
    }
  );

  Tutor.hasMany(TutorLocation, { foreignKey: "tutorId", as: "locations" });
  TutorLocation.belongsTo(Tutor, { foreignKey: "tutorId", as: "tutor" });

  return TutorLocation;
}

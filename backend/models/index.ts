import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import initUserModel from "./user";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: true,
    define: {
      timestamps: true,
    },
  }
);

const User = initUserModel(sequelize);

export {
  sequelize,
  User,
};
export default sequelize;

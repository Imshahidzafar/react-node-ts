import sequelize from "../models/index";
import { NextFunction } from "express";
const syncDatabase = async (next: NextFunction) => {
  try {
    await sequelize.sync({ logging: false, alter: true }); // Sync all models with the database
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
    next(error);
  }
};

export default syncDatabase;

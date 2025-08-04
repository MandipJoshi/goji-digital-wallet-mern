const { Sequelize } = require("sequelize");
require("dotenv").config();

const isTestEnv = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize(
//   isTestEnv ? process.env.TEST_DB_NAME : 
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST, // Changed to DB_HOST
    dialect: "mysql",
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    // Optionally: throw error;
  }
};

module.exports = { sequelize, connectDB }; 
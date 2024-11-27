import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const ConnectToDB = async () => {
  const DatabaseUrl = process.env.DB_URL as string;
  try {
    await mongoose.connect(DatabaseUrl);
    console.log("connected to db")
  } catch (error) {
    console.log("Error connecting to databases:", error);
  }
};

export default ConnectToDB;

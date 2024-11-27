"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ConnectToDB = async () => {
    const DatabaseUrl = process.env.DB_URL;
    try {
        await mongoose_1.default.connect(DatabaseUrl);
        console.log("connected to db");
    }
    catch (error) {
        console.log("Error connecting to databases:", error);
    }
};
exports.default = ConnectToDB;

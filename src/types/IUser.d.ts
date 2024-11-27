import { Document, ObjectId } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: String,
  salt: String,
  createdAt?: Date; 
  updatedAt?: Date; 
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export default IUser;

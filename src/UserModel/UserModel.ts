
import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  email: string;
  phoneNumber?: string;
  isActivated: boolean;
  oauthCredentials?: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
    scope?: string;
    token_type?: string;
  };
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  isActivated: { type: Boolean, default: false },
  oauthCredentials: {
    access_token: { type: String },
    refresh_token: { type: String },
    expiry_date: { type: Number },
    scope: { type: String },
    token_type: { type: String },
  },
});

export default mongoose.model<IUser>("User", userSchema);
import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type Goal = "lose_fat" | "maintain" | "gain_muscle";
export type Sex = "male" | "female" | "other";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  age: number;
  weight: number;
  height: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    age: { type: Number, required: true, min: 10, max: 120 },
    weight: { type: Number, required: true, min: 20, max: 500 },
    height: { type: Number, required: true, min: 50, max: 300 },
    sex: { type: String, enum: ["male", "female", "other"], required: true },
    activityLevel: {
      type: String,
      enum: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extra_active",
      ],
      required: true,
    },
    goal: {
      type: String,
      enum: ["lose_fat", "maintain", "gain_muscle"],
      required: true,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

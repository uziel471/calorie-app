import mongoose, { Schema, Document, Model } from "mongoose";
import { ActivityLevel, Goal, Sex } from "./User";

/**
 * WeightLog stores a weight entry AND a snapshot of the user's
 * stats/settings AT THAT MOMENT in time.
 *
 * This is critical for progress calculations: the calorie goals
 * should reflect what the user's targets were on that specific day
 * (based on their weight, age, activity level, goal at that time),
 * NOT the current values.
 *
 * Every time the user logs a weight or updates their profile,
 * a new snapshot is recorded.
 */
export interface IWeightLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weight: number; // kg — what the user weighed on this date

  // Snapshot of user stats at the time of this entry
  snapshot: {
    age: number;
    height: number;
    sex: Sex;
    activityLevel: ActivityLevel;
    goal: Goal;
    // Computed nutrition goals at this point in time
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    bmr: number;
    tdee: number;
  };

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeightLogSchema = new Schema<IWeightLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 20,
      max: 500,
    },
    snapshot: {
      age: { type: Number, required: true },
      height: { type: Number, required: true },
      sex: { type: String, enum: ["male", "female", "other"], required: true },
      activityLevel: {
        type: String,
        enum: ["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"],
        required: true,
      },
      goal: {
        type: String,
        enum: ["lose_fat", "maintain", "gain_muscle"],
        required: true,
      },
      calorieGoal: { type: Number, required: true },
      proteinGoal: { type: Number, required: true },
      carbsGoal: { type: Number, required: true },
      fatGoal: { type: Number, required: true },
      bmr: { type: Number, required: true },
      tdee: { type: Number, required: true },
    },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// One weight log per user per day (upsert by date)
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const WeightLog: Model<IWeightLog> =
  mongoose.models.WeightLog ||
  mongoose.model<IWeightLog>("WeightLog", WeightLogSchema);

export default WeightLog;

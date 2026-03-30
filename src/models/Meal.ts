import mongoose, { Schema, Document, Model } from "mongoose";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface IMeal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MealSchema = new Schema<IMeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0, default: 0 },
    carbs: { type: Number, required: true, min: 0, default: 0 },
    fat: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0.1, default: 1 },
    unit: { type: String, required: true, default: "porción" },
    notes: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Compound index for efficient daily queries
MealSchema.index({ userId: 1, date: 1 });

const Meal: Model<IMeal> =
  mongoose.models.Meal || mongoose.model<IMeal>("Meal", MealSchema);

export default Meal;

import { ActivityLevel, Goal, Sex } from "@/models/User";

interface TDEEInput {
  age: number;
  weight: number; // kg
  height: number; // cm
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose_fat: -500,
  maintain: 0,
  gain_muscle: 300,
};

const GOAL_MACRO_RATIOS: Record<Goal, { protein: number; fat: number; carbs: number }> = {
  lose_fat:    { protein: 0.35, fat: 0.30, carbs: 0.35 },
  maintain:    { protein: 0.25, fat: 0.30, carbs: 0.45 },
  gain_muscle: { protein: 0.30, fat: 0.25, carbs: 0.45 },
};

export interface NutritionGoals {
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
  bmr: number;
  tdee: number;
}

export function calculateNutritionGoals(input: TDEEInput): NutritionGoals {
  // Harris-Benedict BMR
  let bmr: number;
  if (input.sex === "male") {
    bmr = 88.362 + 13.397 * input.weight + 4.799 * input.height - 5.677 * input.age;
  } else {
    bmr = 447.593 + 9.247 * input.weight + 3.098 * input.height - 4.33 * input.age;
  }

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activityLevel]);
  const calories = Math.max(1200, tdee + GOAL_ADJUSTMENTS[input.goal]);

  const ratios = GOAL_MACRO_RATIOS[input.goal];
  const protein = Math.round((calories * ratios.protein) / 4);
  const carbs = Math.round((calories * ratios.carbs) / 4);
  const fat = Math.round((calories * ratios.fat) / 9);

  return { calories, protein, carbs, fat, bmr: Math.round(bmr), tdee };
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

export const MEAL_TYPE_EMOJIS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export const COMMON_UNITS = [
  "g", "kg", "ml", "l", "porción", "taza", "cdta", "cda", "pieza", "rebanada",
];

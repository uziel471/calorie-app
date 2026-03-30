import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import WeightLog from "@/models/WeightLog";
import User from "@/models/User";
import { calculateNutritionGoals } from "@/lib/nutrition";
import { z } from "zod";
import { endOfLocalDay, normalizeToLocalMidday, startOfLocalDay } from "@/lib/date";

const weightLogSchema = z.object({
  weight: z.coerce.number().min(20, "Peso mínimo 20 kg").max(500, "Peso máximo 500 kg"),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Fecha inválida" }),
  notes: z.string().max(300).optional(),
});

// GET /api/weight-log?limit=90
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "90"), 365);

    await connectDB();

    const logs = await WeightLog.find({ userId: session.user.id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    // Also return current user weight for reference
    const user = await User.findById(session.user.id).select("weight").lean();

    return NextResponse.json({ logs, currentWeight: user?.weight ?? null });
  } catch (error) {
    console.error("GET /api/weight-log error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/weight-log — create or update (upsert by date) a weight entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = weightLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).lean();
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Compute goals using the NEW weight (the one being logged)
    // combined with current age, height, activityLevel, goal
    const nutritionGoals = calculateNutritionGoals({
      age: user.age,
      weight: parsed.data.weight, // ← use the logged weight, NOT user.weight
      height: user.height,
      sex: user.sex,
      activityLevel: user.activityLevel,
      goal: user.goal,
    });

    const entryDate = normalizeToLocalMidday(parsed.data.date);

    // Upsert: one log per day
    const log = await WeightLog.findOneAndUpdate(
      {
        userId: session.user.id,
        date: {
          $gte: startOfLocalDay(entryDate),
          $lte: endOfLocalDay(entryDate),
        },
      },
      {
        $set: {
          userId: session.user.id,
          date: entryDate,
          weight: parsed.data.weight,
          notes: parsed.data.notes,
          snapshot: {
            age: user.age,
            height: user.height,
            sex: user.sex,
            activityLevel: user.activityLevel,
            goal: user.goal,
            calorieGoal: nutritionGoals.calories,
            proteinGoal: nutritionGoals.protein,
            carbsGoal: nutritionGoals.carbs,
            fatGoal: nutritionGoals.fat,
            bmr: nutritionGoals.bmr,
            tdee: nutritionGoals.tdee,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Also update user.weight so their profile stays current
    await User.findByIdAndUpdate(session.user.id, { weight: parsed.data.weight });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("POST /api/weight-log error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Meal from "@/models/Meal";
import User from "@/models/User";
import { calculateNutritionGoals } from "@/lib/nutrition";
import { addDaysLocal, endOfLocalDay, normalizeToLocalMidday, startOfLocalDay, toLocalDateString } from "@/lib/date";

// GET /api/dashboard/stats?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const timeZone = req.headers.get("x-timezone") || "UTC";
    const rawDate =
      searchParams.get("date") ??
      toLocalDateString(new Date(), timeZone);

    await connectDB();

    const user = await User.findById(session.user.id).lean();
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const goals = calculateNutritionGoals({
      age: user.age,
      weight: user.weight,
      height: user.height,
      sex: user.sex,
      activityLevel: user.activityLevel,
      goal: user.goal,
    });

    // 🔥 Fecha base NORMALIZADA
    const baseDate = normalizeToLocalMidday(rawDate, timeZone);

    // 🔥 Rango del día
    const todayStart = startOfLocalDay(baseDate, timeZone);
    const todayEnd = endOfLocalDay(baseDate, timeZone);

    // 🔥 Traer meals del día
    const todayMeals = await Meal.find({
      userId: session.user.id,
      date: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ date: 1 })
      .lean();

    const todayTotals = todayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // 🔥 Traer todos los meals de la semana en UNA query
    const weekStart = startOfLocalDay(addDaysLocal(baseDate, -6, timeZone), timeZone);
    const weekEnd = todayEnd;
    const weeklyMeals = await Meal.find({
      userId: session.user.id,
      date: { $gte: weekStart, $lte: weekEnd },
    }).lean();

    // 🔥 Agrupar por día (LOCAL)
    const mealsByDay: Record<string, typeof weeklyMeals> = {};

    for (const meal of weeklyMeals) {
      const key = toLocalDateString(new Date(meal.date), timeZone);
      if (!mealsByDay[key]) mealsByDay[key] = [];
      mealsByDay[key].push(meal);
    }

    // 🔥 Construir semana
    const weeklyData: {
      date: string;
      label: string;
      calories: number;
      percentage: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = addDaysLocal(baseDate, -i, timeZone);
      const key = toLocalDateString(d, timeZone);

      const dayMeals = mealsByDay[key] ?? [];
      const calories = dayMeals.reduce((sum, m) => sum + m.calories, 0);

      // 👇 AQUÍ generas el label correctamente
      const label = new Intl.DateTimeFormat("es-MX", {
        weekday: "short",
        timeZone,
      })
        .format(d)
        .replace(".", "")
        .slice(0, 1)
        .toUpperCase();

      weeklyData.push({
        date: key,
        label,
        calories,
        percentage:
          goals.calories > 0
            ? Math.round((calories / goals.calories) * 100)
            : 0,
      });
    }

    // 🔥 Agrupar meals por tipo
    const mealsByType = todayMeals.reduce(
      (acc, m) => {
        if (!acc[m.mealType]) acc[m.mealType] = [];
        acc[m.mealType].push(m);
        return acc;
      },
      {} as Record<string, typeof todayMeals>
    );

    return NextResponse.json({
      goals,
      today: {
        totals: todayTotals,
        meals: todayMeals,
        mealsByType,
      },
      weekly: weeklyData,
      user: {
        name: user.name,
        goal: user.goal,
        weight: user.weight,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

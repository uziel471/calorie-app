import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Meal from "@/models/Meal";
import User from "@/models/User";
import { calculateNutritionGoals } from "@/lib/nutrition";
import { addDaysLocal, endOfLocalDay, startOfLocalDay, toLocalDateString } from "@/lib/date";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const timeZone = req.headers.get("x-timezone") || "UTC";
    const days = Math.min(Number(searchParams.get("days") ?? 30), 90);

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

    // Build daily history for last N days
    const now = new Date();

    const today = endOfLocalDay(now, timeZone);
    const startDate = startOfLocalDay(addDaysLocal(now, -(days - 1), timeZone), timeZone);

    const allMeals = await Meal.find({
      userId: session.user.id,
      date: { $gte: startDate, $lte: today },
    }).lean();

    // Group meals by date string
    const mealsByDay: Record<string, typeof allMeals> = {};
    for (const meal of allMeals) {
      const key = toLocalDateString(new Date(meal.date), timeZone);
      if (!mealsByDay[key]) mealsByDay[key] = [];
      mealsByDay[key].push(meal);
    }

    // Build daily stats array
    const history: {
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      percentage: number;
      mealsCount: number;
      goalMet: boolean;
    }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = addDaysLocal(now, -i, timeZone);
      const key = toLocalDateString(d, timeZone);
      const dayMeals = mealsByDay[key] ?? [];

      const calories = dayMeals.reduce((s, m) => s + m.calories, 0);
      const protein = dayMeals.reduce((s, m) => s + m.protein, 0);
      const carbs = dayMeals.reduce((s, m) => s + m.carbs, 0);
      const fat = dayMeals.reduce((s, m) => s + m.fat, 0);
      const percentage = goals.calories > 0 ? Math.round((calories / goals.calories) * 100) : 0;

      history.push({
        date: key,
        calories,
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        percentage,
        mealsCount: dayMeals.length,
        goalMet: percentage >= 80 && percentage <= 120,
      });
    }

    // --- Streak calculation ---
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Current streak (from today backwards)
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].goalMet) {
        currentStreak++;
      } else if (history[i].mealsCount === 0 && i === history.length - 1) {
        // today has no meals yet — skip
        continue;
      } else {
        break;
      }
    }

    // Longest streak
    for (const day of history) {
      if (day.goalMet) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // --- Averages (days with at least 1 meal) ---
    const activeDays = history.filter((d) => d.mealsCount > 0);
    const avgCalories =
      activeDays.length > 0
        ? Math.round(activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length)
        : 0;
    const avgProtein =
      activeDays.length > 0
        ? Math.round(activeDays.reduce((s, d) => s + d.protein, 0) / activeDays.length)
        : 0;
    const avgCarbs =
      activeDays.length > 0
        ? Math.round(activeDays.reduce((s, d) => s + d.carbs, 0) / activeDays.length)
        : 0;
    const avgFat =
      activeDays.length > 0
        ? Math.round(activeDays.reduce((s, d) => s + d.fat, 0) / activeDays.length)
        : 0;

    // Best and worst days
    const bestDay = activeDays.reduce(
      (best, d) =>
        Math.abs(d.percentage - 100) < Math.abs((best?.percentage ?? 999) - 100) ? d : best,
      activeDays[0] ?? null
    );

    const daysOnGoal = history.filter((d) => d.goalMet).length;
    const adherence = history.length > 0 ? Math.round((daysOnGoal / history.length) * 100) : 0;

    // Macro breakdown for pie (use averages)
    const totalMacrosCal = avgProtein * 4 + avgCarbs * 4 + avgFat * 9;
    const macroBreakdown = totalMacrosCal > 0 ? {
      protein: Math.round((avgProtein * 4 / totalMacrosCal) * 100),
      carbs: Math.round((avgCarbs * 4 / totalMacrosCal) * 100),
      fat: Math.round((avgFat * 9 / totalMacrosCal) * 100),
    } : { protein: 0, carbs: 0, fat: 0 };

    // Weekly grouped averages for bar chart (last 4 weeks)
    const weeklyAverages: { week: string; avgCalories: number; percentage: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekDays = history.slice(
        Math.max(0, history.length - (w + 1) * 7),
        history.length - w * 7
      );
      const active = weekDays.filter((d) => d.mealsCount > 0);
      weeklyAverages.push({
        week: `Semana ${4 - w}`,
        avgCalories: active.length > 0 ? Math.round(active.reduce((s, d) => s + d.calories, 0) / active.length) : 0,
        percentage: active.length > 0 ? Math.round(active.reduce((s, d) => s + d.percentage, 0) / active.length) : 0,
      });
    }

    return NextResponse.json({
      goals,
      history,
      streaks: { current: currentStreak, longest: longestStreak },
      averages: { calories: avgCalories, protein: avgProtein, carbs: avgCarbs, fat: avgFat },
      adherence,
      daysOnGoal,
      activeDays: activeDays.length,
      bestDay: bestDay ?? null,
      macroBreakdown,
      weeklyAverages,
      user: {
        name: user.name,
        goal: user.goal,
        weight: user.weight,
        height: user.height,
      },
    });
  } catch (error) {
    console.error("GET /api/progress error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

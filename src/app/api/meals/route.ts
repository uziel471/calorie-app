import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Meal from "@/models/Meal";
import { mealSchema } from "@/lib/meal-validations";
import { endOfLocalDay, normalizeToLocalMidday, startOfLocalDay } from "@/lib/date";

// GET /api/meals?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    await connectDB();

    let query: Record<string, unknown> = { userId: session.user.id };
    const timeZone = req.headers.get("x-timezone") || "UTC";
    if (dateParam) {
      const baseDate = normalizeToLocalMidday(dateParam, timeZone);

      const start = startOfLocalDay(baseDate, timeZone);
      const end = endOfLocalDay(baseDate, timeZone);

      query.date = { $gte: start, $lte: end };
    }

    const meals = await Meal.find(query).sort({ date: 1 }).lean();

    return NextResponse.json({ meals });
  } catch (error) {
    console.error("GET /api/meals error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/meals
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = mealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const timeZone = req.headers.get("x-timezone") || "UTC";
    const normalizedDate = normalizeToLocalMidday(parsed.data.date, timeZone);
    const meal = await Meal.create({
      ...parsed.data,
      userId: session.user.id,
      date: normalizedDate,
    });

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    console.error("POST /api/meals error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

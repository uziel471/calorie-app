import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Meal from "@/models/Meal";
import { normalizeToLocalMidday } from "@/lib/date";

// DELETE /api/meals/[id]
export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
     const { id } = context.params as { id: string };

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    await connectDB();

    const meal = await Meal.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!meal) {
      return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Comida eliminada" });
  } catch (error) {
    console.error("DELETE /api/meals/[id] error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/meals/[id]
export async function PATCH(
  req: NextRequest,
  context: any
) {
  try {
     const { id } = context.params as { id: string };

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const timeZone = req.headers.get("x-timezone") || "UTC";

    const meal = await Meal.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        ...body,
        date: body.date
          ? normalizeToLocalMidday(body.date, timeZone)
          : undefined,
      },
      { new: true }
    );

    if (!meal) {
      return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ meal });
  } catch (error) {
    console.error("PATCH /api/meals/[id] error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
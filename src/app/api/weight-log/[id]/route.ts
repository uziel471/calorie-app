import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import WeightLog from "@/models/WeightLog";

// DELETE /api/weight-log/[id]
export async function DELETE(
  _req: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    await connectDB();
     const { id } = context.params as { id: string };
    const log = await WeightLog.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!log) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error) {
    console.error("DELETE /api/weight-log/[id] error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

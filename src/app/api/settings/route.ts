import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  age: z.coerce.number().min(10).max(120).optional(),
  weight: z.coerce.number().min(20).max(500).optional(),
  height: z.coerce.number().min(50).max(300).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  activityLevel: z
    .enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"])
    .optional(),
  goal: z.enum(["lose_fat", "maintain", "gain_muscle"]).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// GET /api/settings — return user profile (no password)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("-password")
      .lean();

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/settings — update profile fields or change password
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    // Handle password change separately
    if (body.currentPassword !== undefined) {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }

      const user = await User.findById(session.user.id);
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

      const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
      }

      user.password = await bcrypt.hash(parsed.data.newPassword, 12);
      await user.save();

      return NextResponse.json({ message: "Contraseña actualizada correctamente" });
    }

    // Profile update
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({ user: updated, message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

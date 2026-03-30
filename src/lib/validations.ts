import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  age: z.coerce.number().min(10, "Edad mínima 10 años").max(120, "Edad máxima 120 años"),
  weight: z.coerce.number().min(20, "Peso mínimo 20 kg").max(500, "Peso máximo 500 kg"),
  height: z.coerce.number().min(50, "Altura mínima 50 cm").max(300, "Altura máxima 300 cm"),
  sex: z.enum(["male", "female", "other"], { required_error: "Selecciona tu sexo" }),
  activityLevel: z.enum(
    ["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"],
    { required_error: "Selecciona tu nivel de actividad" }
  ),
  goal: z.enum(["lose_fat", "maintain", "gain_muscle"], {
    required_error: "Selecciona tu objetivo",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

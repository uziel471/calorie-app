import { z } from "zod";

export const mealSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    required_error: "Selecciona el tipo de comida",
  }),
  calories: z.coerce.number().min(1, "Las calorías deben ser mayores a 0").max(9999),
  protein: z.coerce.number().min(0).max(999).default(0),
  carbs: z.coerce.number().min(0).max(999).default(0),
  fat: z.coerce.number().min(0).max(999).default(0),
  quantity: z.coerce.number().min(0.1, "La cantidad debe ser mayor a 0").max(9999).default(1),
  unit: z.string().min(1, "Selecciona una unidad").default("porción"),
  notes: z.string().max(300).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Fecha inválida" }),
});

export type MealInput = z.infer<typeof mealSchema>;

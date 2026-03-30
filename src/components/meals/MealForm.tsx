"use client";

import { useState } from "react";
import { X, Loader2, Utensils, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateMeal } from "@/hooks/use-meals";
import { mealSchema, MealInput } from "@/lib/meal-validations";
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS, COMMON_UNITS } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  onClose: () => void;
  defaultMealType?: string;
}

const PRESET_FOODS = [
  { name: "Pechuga de pollo", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "g", quantity: 100 },
  { name: "Arroz cocido", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "g", quantity: 100 },
  { name: "Huevo entero", calories: 155, protein: 13, carbs: 1.1, fat: 11, unit: "pieza", quantity: 1 },
  { name: "Avena", calories: 389, protein: 17, carbs: 66, fat: 7, unit: "g", quantity: 100 },
  { name: "Plátano", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "pieza", quantity: 1 },
  { name: "Leche entera", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, unit: "ml", quantity: 100 },
  { name: "Atún en agua", calories: 116, protein: 26, carbs: 0, fat: 1, unit: "g", quantity: 100 },
  { name: "Pan integral", calories: 247, protein: 13, carbs: 41, fat: 4.2, unit: "rebanada", quantity: 1 },
];

type FormData = Omit<MealInput, "date">;

export function MealForm({ date, onClose, defaultMealType = "breakfast" }: Props) {
  const [form, setForm] = useState<FormData>({
    name: "",
    mealType: defaultMealType as MealInput["mealType"],
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    quantity: 1,
    unit: "porción",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState(true);
  const { mutate: createMeal, isPending } = useCreateMeal(date);

  const set = (key: keyof FormData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (p: typeof PRESET_FOODS[0]) => {
    setForm((f) => ({
      ...f,
      name: p.name,
      calories: p.calories,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
      unit: p.unit,
      quantity: p.quantity,
    }));
    setShowPresets(false);
  };

  // Auto-calculate calories from macros
  const calcCalories = () => {
    const cal = Math.round(form.protein * 4 + form.carbs * 4 + form.fat * 9);
    set("calories", cal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: MealInput = { ...form, date };
    const parsed = mealSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        errs[err.path[0] as string] = err.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    createMeal(parsed.data, { onSuccess: onClose });
  };

  const err = (k: string) =>
    errors[k] ? <p className="text-xs text-destructive mt-0.5">{errors[k]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none" style={{ fontFamily: "Syne, sans-serif" }}>
                Registrar comida
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Meal type selector */}
            <div className="grid grid-cols-4 gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("mealType", type)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all",
                    form.mealType === type
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-lg">{MEAL_TYPE_EMOJIS[type]}</span>
                  {MEAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Quick presets */}
            {showPresets && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Alimentos rápidos</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_FOODS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/40 text-left transition-colors group"
                    >
                      <span className="text-xs font-medium truncate">{p.name}</span>
                      <span className="text-xs text-primary ml-1 shrink-0">{p.calories} kcal</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPresets(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                >
                  + Ingresar manualmente
                </button>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Nombre del alimento *</Label>
              <Input
                placeholder="Ej: Pechuga a la plancha"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn("bg-secondary/50 border-border/60 focus:border-primary", errors.name && "border-destructive")}
              />
              {err("name")}
            </div>

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Cantidad *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.quantity || ""}
                  onChange={(e) => set("quantity", Number(e.target.value))}
                  className={cn("bg-secondary/50 border-border/60 focus:border-primary", errors.quantity && "border-destructive")}
                />
                {err("quantity")}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Unidad *</Label>
                <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                  <SelectTrigger className="bg-secondary/50 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Macros */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Macronutrientes</Label>
                <button
                  type="button"
                  onClick={calcCalories}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Calculator className="w-3 h-3" />
                  Calcular calorías
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-amber-400">Calorías (kcal) *</Label>
                  <Input
                    type="number"
                    value={form.calories || ""}
                    onChange={(e) => set("calories", Number(e.target.value))}
                    className={cn("bg-secondary/50 border-amber-500/30 focus:border-amber-500", errors.calories && "border-destructive")}
                  />
                  {err("calories")}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-400">Proteína (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.protein || ""}
                    onChange={(e) => set("protein", Number(e.target.value))}
                    className="bg-secondary/50 border-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-green-400">Carbohidratos (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.carbs || ""}
                    onChange={(e) => set("carbs", Number(e.target.value))}
                    className="bg-secondary/50 border-green-500/30 focus:border-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-rose-400">Grasas (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.fat || ""}
                    onChange={(e) => set("fat", Number(e.target.value))}
                    className="bg-secondary/50 border-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Notas (opcional)</Label>
              <Input
                placeholder="Ej: Con aceite de oliva"
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                className="bg-secondary/50 border-border/60 focus:border-primary"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border/60"
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                "Registrar comida"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

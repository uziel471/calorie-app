"use client";

import { Trash2, Beef, Zap, Droplets } from "lucide-react";
import { useDeleteMeal, MealDoc } from "@/hooks/use-meals";
import { MEAL_TYPE_EMOJIS } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

interface Props {
  meal: MealDoc;
  date: string;
}

export function MealCard({ meal, date }: Props) {
  const { mutate: deleteMeal, isPending } = useDeleteMeal(date);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-border/60 transition-all",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <span className="text-2xl shrink-0">{MEAL_TYPE_EMOJIS[meal.mealType] ?? "🍽️"}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{meal.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-blue-400 flex items-center gap-0.5">
            <Beef className="w-2.5 h-2.5" />{meal.protein}g P
          </span>
          <span className="text-xs text-green-400 flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />{meal.carbs}g C
          </span>
          <span className="text-xs text-rose-400 flex items-center gap-0.5">
            <Droplets className="w-2.5 h-2.5" />{meal.fat}g G
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{meal.calories}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <button
          onClick={() => deleteMeal(meal._id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

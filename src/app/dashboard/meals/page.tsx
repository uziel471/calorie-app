"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealForm } from "@/components/meals/MealForm";
import { MealCard } from "@/components/meals/MealCard";
import { useMeals } from "@/hooks/use-meals";
import { MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS } from "@/lib/nutrition";

function toLocalDateString(d: Date) {
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function dateStr(d: Date) {
  return d.toLocaleDateString("en-CA");
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function MealsPage() {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(new Date().setHours(12, 0, 0, 0))
  );
  const [showForm, setShowForm] = useState(false);
  const [defaultType, setDefaultType] = useState("breakfast");

  const currentDateStr = dateStr(selectedDate);
  const { data, isLoading } = useMeals(currentDateStr);

  const meals = data?.meals ?? [];

  const mealsByType = MEAL_TYPES.reduce(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.mealType === type);
      return acc;
    },
    {} as Record<string, typeof meals>
  );

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const prevDay = () => {
    setSelectedDate((prev) =>
      new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1, 12)
    );
  };

  const nextDay = () => {
    setSelectedDate((prev) =>
      new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1, 12)
    );
  };

  const isToday = dateStr(selectedDate) === dateStr(new Date());

  const openForm = (type: string) => {
    setDefaultType(type);
    setShowForm(true);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Mis Comidas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Registra y controla tu alimentación diaria
            </p>
          </div>
          <Button
            onClick={() => openForm("breakfast")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar comida
          </Button>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between mb-6 bg-card border border-border/50 rounded-2xl p-4">
          <button
            onClick={prevDay}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p
              className="font-bold text-lg capitalize"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {isToday ? "Hoy" : toLocalDateString(selectedDate)}
            </p>
            <p className="text-xs text-muted-foreground">{currentDateStr}</p>
          </div>
          <button
            onClick={nextDay}
            disabled={isToday}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Daily summary bar */}
        {meals.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Calorías", value: totals.calories, unit: "kcal", color: "text-primary" },
              { label: "Proteína", value: `${Math.round(totals.protein)}g`, unit: "", color: "text-blue-400" },
              { label: "Carbos", value: `${Math.round(totals.carbs)}g`, unit: "", color: "text-green-400" },
              { label: "Grasas", value: `${Math.round(totals.fat)}g`, unit: "", color: "text-rose-400" },
            ].map((s) => (
              <Card key={s.label} className="bg-card border-border/50">
                <CardContent className="p-4 text-center">
                  <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "Syne, sans-serif" }}>
                    {s.value}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">{s.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Meals by type */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
            Cargando comidas...
          </div>
        ) : (
          <div className="space-y-4">
            {MEAL_TYPES.map((type) => (
              <Card key={type} className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className="text-base flex items-center gap-2"
                      style={{ fontFamily: "Syne, sans-serif" }}
                    >
                      <span className="text-xl">{MEAL_TYPE_EMOJIS[type]}</span>
                      {MEAL_TYPE_LABELS[type]}
                      {mealsByType[type].length > 0 && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          · {mealsByType[type].reduce((s, m) => s + m.calories, 0)} kcal
                        </span>
                      )}
                    </CardTitle>
                    <button
                      onClick={() => openForm(type)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mealsByType[type].length === 0 ? (
                    <button
                      onClick={() => openForm(type)}
                      className="w-full py-4 rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      Sin comidas registradas · Toca para agregar
                    </button>
                  ) : (
                    mealsByType[type].map((meal) => (
                      <MealCard key={meal._id} meal={meal} date={currentDateStr} />
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <MealForm
          date={currentDateStr}
          defaultMealType={defaultType}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

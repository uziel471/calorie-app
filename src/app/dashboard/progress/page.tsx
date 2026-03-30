"use client";

import { useState } from "react";
import {
  TrendingUp, Flame, Beef, Zap, Droplets, Trophy, Target,
  Calendar, BarChart3, Loader2, CheckCircle2, XCircle, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeightLogPanel } from "@/components/progress/WeightLogPanel";
import { useProgress } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
];

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "🔥 Perder grasa",
  maintain: "⚖️ Mantener peso",
  gain_muscle: "💪 Ganar músculo",
};

// ── Calorie bar for chart ────────────────────────────────────────────────
function CalorieBar({
  day, isToday,
}: {
  day: {
    date: string; calories: number; calorieGoal: number;
    percentage: number; mealsCount: number; goalMet: boolean;
    snapshotSource: string;
  };
  isToday: boolean;
}) {
  const pct = Math.min(day.percentage, 150);
  const label = new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0 group relative">
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex z-10 flex-col">
        <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs whitespace-nowrap shadow-xl">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-primary">{day.calories} kcal consumidas</p>
          <p className="text-muted-foreground">Meta: {day.calorieGoal} kcal</p>
          <p className="text-muted-foreground">{day.percentage}% de meta</p>
          {day.snapshotSource !== "weight_log" && (
            <p className="text-amber-400/80 mt-1 text-[10px]">
              {day.snapshotSource === "interpolated"
                ? "⚠ Meta interpolada (sin peso ese día)"
                : "⚠ Usando perfil actual"}
            </p>
          )}
        </div>
        {/* Arrow */}
        <div className="self-center w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
      </div>

      {/* Bar */}
      <div className="w-full h-24 bg-secondary/40 rounded-lg overflow-hidden relative flex items-end">
        {day.mealsCount === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-border text-xs">—</span>
          </div>
        ) : (
          <div
            className={cn(
              "w-full rounded-t-md transition-all duration-500",
              day.goalMet
                ? "bg-primary"
                : day.percentage > 120
                ? "bg-rose-500"
                : "bg-amber-500"
            )}
            style={{ height: `${Math.max(4, (pct / 150) * 100)}%` }}
          />
        )}
        {/* Goal line at 100% = 100/150 * 100 = 66.7% from bottom */}
        <div
          className="absolute w-full border-t border-dashed border-primary/40"
          style={{ bottom: "66.7%" }}
        />
      </div>

      <span
        className={cn(
          "text-xs truncate w-full text-center",
          isToday ? "text-primary font-semibold" : "text-muted-foreground"
        )}
      >
        {isToday ? "Hoy" : label.split(",")[0]}
      </span>
    </div>
  );
}

// ── SVG Macro donut ──────────────────────────────────────────────────────
function MacroDonut({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat;
  if (total === 0) return <div className="w-32 h-32 rounded-full bg-secondary/50 mx-auto" />;

  const cx = 64, cy = 64, r = 54;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const arc = (startDeg: number, endDeg: number) => {
    if (Math.abs(endDeg - startDeg) >= 360) endDeg = startDeg + 359.99;
    const s = toRad(startDeg), e = toRad(endDeg);
    return [
      `M ${cx} ${cy}`,
      `L ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)}`,
      `A ${r} ${r} 0 ${endDeg - startDeg > 180 ? 1 : 0} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`,
      "Z",
    ].join(" ");
  };

  const proteinDeg = (protein / total) * 360;
  const carbsDeg = (carbs / total) * 360;

  return (
    <svg viewBox="0 0 128 128" className="w-32 h-32 mx-auto">
      <path d={arc(0, 360)} fill="hsl(var(--secondary))" />
      <path d={arc(0, proteinDeg)} fill="#60a5fa" opacity="0.9" />
      <path d={arc(proteinDeg, proteinDeg + carbsDeg)} fill="#4ade80" opacity="0.9" />
      <path d={arc(proteinDeg + carbsDeg, 360)} fill="#fb7185" opacity="0.9" />
      <circle cx="64" cy="64" r="34" fill="hsl(var(--card))" />
      <text x="64" y="60" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="11" fontWeight="bold">Macros</text>
      <text x="64" y="74" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9">promedio</text>
    </svg>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const [range, setRange] = useState(30);
  const { data, isLoading } = useProgress(range);
  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No se pudo cargar el progreso.</p>
      </div>
    );
  }

  const {
    goals, history, streaks, averages, adherence,
    daysOnGoal, activeDays, macroBreakdown, weeklyAverages, weightChange,
  } = data;

  const last14 = history.slice(-14);
  const hasHistoricalGoals = history.some((d) => d.snapshotSource === "weight_log");
  const hasInterpolated = history.some((d) => d.snapshotSource === "interpolated");

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Mi Progreso
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {GOAL_LABELS[data.user.goal] ?? data.user.goal} · {data.user.weight} kg · {data.user.height} cm
            </p>
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  range === opt.value
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Historical goals notice */}
        {!hasHistoricalGoals && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-sm">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-300">Sin registros de peso históricos</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Las metas calóricas se calculan con tu perfil actual. Para ver metas precisas por día,
                registra tu peso regularmente desde el panel "Registro de peso".
              </p>
            </div>
          </div>
        )}
        {hasHistoricalGoals && hasInterpolated && (
          <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl p-3 mb-6 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p>
              Las barras con ⚠ usan la meta del último peso registrado antes de ese día (interpolado).
              Registra tu peso más frecuentemente para mayor precisión.
            </p>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: Trophy, label: "Racha actual", value: streaks.current, unit: "días",
              color: "text-amber-400", bg: "bg-amber-500/15",
              sub: `Máx: ${streaks.longest} días`,
            },
            {
              icon: Target, label: "Adherencia", value: `${adherence}%`, unit: "",
              color: "text-primary", bg: "bg-primary/15",
              sub: `${daysOnGoal} días en meta`,
            },
            {
              icon: Calendar, label: "Días activos", value: activeDays, unit: `/ ${range}`,
              color: "text-green-400", bg: "bg-green-500/15",
              sub: `en últimos ${range} días`,
            },
            {
              icon: Flame, label: "Prom. calorías", value: averages.calories, unit: "kcal",
              color: "text-rose-400", bg: "bg-rose-500/15",
              sub: `Meta: ${goals.calories} kcal`,
            },
          ].map(({ icon: Icon, label, value, unit, color, bg, sub }) => (
            <Card key={label} className="bg-card border-border/50">
              <CardContent className="p-5">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${color}`} style={{ fontFamily: "Syne, sans-serif" }}>
                    {value}
                  </span>
                  {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calorie bar chart */}
        <Card className="bg-card border-border/50 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                <BarChart3 className="w-4 h-4 text-primary" />
                Calorías — últimos 14 días
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  (meta ajustada por peso histórico)
                </span>
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" />En meta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />Bajo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />Alto
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1.5 items-end">
              {last14.map((day) => (
                <CalorieBar key={day.date} day={day} isToday={day.date === today} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Línea punteada = meta calórica de cada día. Hover sobre las barras para ver detalles.
            </p>
          </CardContent>
        </Card>

        {/* Weight log + Macros + Weekly */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weight log panel - spans 1 col */}
          <div className="md:col-span-1">
            <WeightLogPanel />
          </div>

          {/* Macro donut */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base" style={{ fontFamily: "Syne, sans-serif" }}>
                Distribución de macros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MacroDonut
                protein={macroBreakdown.protein}
                carbs={macroBreakdown.carbs}
                fat={macroBreakdown.fat}
              />
              <div className="space-y-2 mt-4">
                {[
                  { label: "Proteína", pct: macroBreakdown.protein, g: averages.protein, color: "bg-blue-400" },
                  { label: "Carbos", pct: macroBreakdown.carbs, g: averages.carbs, color: "bg-green-400" },
                  { label: "Grasas", pct: macroBreakdown.fat, g: averages.fat, color: "bg-rose-400" },
                ].map(({ label, pct, g, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                    <span className="text-xs flex-1 text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium">{g}g</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Macros vs goals */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base" style={{ fontFamily: "Syne, sans-serif" }}>
                Macros vs meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Proteína", avg: averages.protein, goal: goals.protein, color: "text-blue-400", bg: "bg-blue-400", icon: Beef },
                { label: "Carbohidratos", avg: averages.carbs, goal: goals.carbs, color: "text-green-400", bg: "bg-green-400", icon: Zap },
                { label: "Grasas", avg: averages.fat, goal: goals.fat, color: "text-rose-400", bg: "bg-rose-400", icon: Droplets },
              ].map(({ label, avg, goal, color, bg, icon: Icon }) => {
                const pct = goal > 0 ? Math.min(Math.round((avg / goal) * 100), 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
                        <Icon className="w-3 h-3" /> {label}
                      </span>
                      <span className="text-xs text-muted-foreground">{avg}g / {goal}g</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bg} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border/50 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">TDEE (actual)</span>
                  <span className="font-semibold text-primary">{goals.tdee} kcal</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">BMR (actual)</span>
                  <span className="font-semibold">{goals.bmr} kcal</span>
                </div>
                {weightChange !== null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cambio de peso</span>
                    <span className={cn(
                      "font-semibold",
                      weightChange < 0 ? "text-green-400" : weightChange > 0 ? "text-rose-400" : ""
                    )}>
                      {weightChange > 0 ? "+" : ""}{weightChange} kg
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily log table */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
              <TrendingUp className="w-4 h-4 text-primary" />
              Registro diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {/* Header */}
              <div className="grid grid-cols-7 gap-1 px-3 py-1.5 text-xs text-muted-foreground font-medium border-b border-border/40">
                <span className="col-span-2">Fecha</span>
                <span className="text-right">Peso</span>
                <span className="text-right">Kcal</span>
                <span className="text-right text-blue-400">P</span>
                <span className="text-right text-green-400">C</span>
                <span className="text-right text-rose-400">G</span>
              </div>
              {[...history].reverse().map((day) => {
                const isToday2 = day.date === today;
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "grid grid-cols-7 gap-1 px-3 py-2 rounded-lg text-xs transition-colors",
                      day.mealsCount === 0 ? "text-muted-foreground/40" : "hover:bg-secondary/40",
                      isToday2 && "bg-primary/5 border border-primary/20"
                    )}
                  >
                    <span className="col-span-2 flex items-center gap-1.5">
                      {day.mealsCount > 0 ? (
                        day.goalMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )
                      ) : (
                        <span className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className={cn(isToday2 && "text-primary font-semibold")}>
                        {isToday2
                          ? "Hoy"
                          : new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", {
                              weekday: "short", day: "numeric", month: "short",
                            })}
                      </span>
                    </span>
                    <span className="text-right text-muted-foreground">
                      {day.weight ? `${day.weight}kg` : "—"}
                    </span>
                    <span className={cn(
                      "text-right font-semibold",
                      day.goalMet ? "text-primary" : day.calories > 0 ? "text-amber-400" : ""
                    )}>
                      {day.calories > 0 ? day.calories : "—"}
                    </span>
                    <span className="text-right text-blue-400">{day.protein > 0 ? `${day.protein}g` : "—"}</span>
                    <span className="text-right text-green-400">{day.carbs > 0 ? `${day.carbs}g` : "—"}</span>
                    <span className="text-right text-rose-400">{day.fat > 0 ? `${day.fat}g` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame, Beef, Droplets, Zap, TrendingUp, Calendar, Target,
  Plus, UtensilsCrossed, Loader2, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealForm } from "@/components/meals/MealForm";
import { MealCard } from "@/components/meals/MealCard";
import { useDashboardStats } from "@/hooks/use-meals";
import { getToday, toLocalDateString } from "@/lib/date";

const GOAL_LABELS: Record<string, string> = {
  lose_fat:    "🔥 Perder grasa",
  maintain:    "⚖️ Mantener peso",
  gain_muscle: "💪 Ganar músculo",
};

/* ── Calorie ring — hero card ─────────────────────────────────────────── */
function CalorieRing({
  consumed, goal, remaining,
}: {
  consumed: number; goal: number; remaining: number;
}) {
  const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
  // SVG donut
  const r = 52, cx = 64, cy = 64;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
      <CardContent className="p-5">
        {/* Mobile: horizontal layout. Desktop: stacked */}
        <div className="flex items-center gap-4 md:flex-col md:items-center md:gap-0 md:text-center">
          {/* SVG ring */}
          <div className="relative shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128" className="w-28 h-28 md:w-32 md:h-32 -rotate-90">
              {/* Track */}
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke="hsl(var(--primary) / 0.15)" strokeWidth="10" />
              {/* Progress */}
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke="hsl(var(--primary))" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-primary leading-none"
                style={{ fontFamily: "Syne, sans-serif" }}>
                {consumed}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">kcal</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 md:mt-3 md:w-full">
            <div className="flex items-center gap-2 md:justify-center mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow shadow-primary/30">
                <Flame className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Calorías hoy</span>
            </div>

            <div className="flex items-baseline gap-1 md:justify-center mb-3">
              <span className="text-2xl md:text-3xl font-bold text-primary"
                style={{ fontFamily: "Syne, sans-serif" }}>
                {consumed}
              </span>
              <span className="text-sm text-muted-foreground">/ {goal}</span>
            </div>

            {/* Progress bar (mobile only — ring covers this on desktop) */}
            <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden mb-2 md:hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }} />
            </div>

            <p className="text-xs text-muted-foreground">
              {remaining > 0
                ? <span><span className="font-semibold text-foreground">{remaining}</span> kcal restantes</span>
                : <span className="text-primary font-medium">¡Meta alcanzada! 🎉</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{pct}% de tu meta diaria</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Compact macro bar ────────────────────────────────────────────────── */
function MacroBar({
  label, consumed, goal, color, bgColor, icon: Icon,
}: {
  label: string; consumed: number; goal: number;
  color: string; bgColor: string; icon: React.ElementType;
}) {
  const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3 md:p-5">
        {/* Mobile: compact horizontal. Desktop: stacked */}
        <div className="flex items-center gap-2 md:block">
          <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg ${bgColor} flex items-center justify-center shrink-0 md:mb-3`}>
            <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <span className="text-xs text-muted-foreground font-medium md:hidden">{pct}%</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className={`text-base md:text-2xl font-bold ${color}`}
                style={{ fontFamily: "Syne, sans-serif" }}>
                {Math.round(consumed)}
              </span>
              <span className="text-xs text-muted-foreground">/ {goal}g</span>
            </div>
            <div className={`h-1 md:h-1.5 ${bgColor} rounded-full overflow-hidden`}>
              <div className={`h-full ${color.replace("text-", "bg-")} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium hidden md:block text-right">{pct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Weekly mini-chart ────────────────────────────────────────────────── */
function WeeklyChart({
  weekly, goals,
}: {
  weekly: { date: string; percentage: number; label?: string }[];
  goals: { tdee: number; bmr: number };
}) {
  const weekAvg =
    weekly.filter((w) => w.percentage > 0).length > 0
      ? Math.round(
          weekly.filter((w) => w.percentage > 0).reduce((s, w) => s + w.percentage, 0) /
            weekly.filter((w) => w.percentage > 0).length
        )
      : 0;

  const todayStr = toLocalDateString(new Date());

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2"
          style={{ fontFamily: "Syne, sans-serif" }}>
          <TrendingUp className="w-4 h-4 text-primary" />
          Esta semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {weekly.map((d) => {
            const pct = d.percentage;
            const isCurrentDay = toLocalDateString(new Date(d.date)) === todayStr;
            return (
              <div key={d.date} className="flex items-center gap-2">
                <span className={`text-xs w-4 font-medium shrink-0 ${
                  isCurrentDay ? "text-primary" : "text-muted-foreground"
                }`}>
                  {d.label}
                </span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    pct >= 90 ? "bg-primary" : pct >= 60 ? "bg-amber-500" : pct === 0 ? "bg-border" : "bg-rose-500"
                  }`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-7 text-right shrink-0">
                  {pct > 0 ? `${pct}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Promedio semanal</span>
            <span className="text-sm font-bold text-primary"
              style={{ fontFamily: "Syne, sans-serif" }}>{weekAvg}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">TDEE</p>
              <p className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{goals.tdee}</p>
              <p className="text-[10px] text-muted-foreground">kcal/día</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">BMR</p>
              <p className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{goals.bmr}</p>
              <p className="text-[10px] text-muted-foreground">kcal/día</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
interface Props {
  userName: string;
}

export function DashboardClient({ userName }: Props) {
  const today = getToday();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useDashboardStats(today);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const firstName = userName.split(" ")[0];

  const dateLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive text-sm">Error al cargar datos. Intenta recargar.</p>
      </div>
    );
  }

  const { goals, today: todayData, weekly } = data;
  const { totals, meals } = todayData;
  const remaining = Math.max(0, goals.calories - totals.calories);

  return (
    <div className="flex-1 overflow-auto mobile-page-bottom">
      {/*
        Mobile:  single column, tighter padding (px-4 py-4)
        Desktop: wider padding with max-width
      */}
      <div className="px-4 py-5 md:p-8 max-w-6xl md:mx-auto space-y-4 md:space-y-0">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="md:mb-8 animate-fade-in">
          {/* Mobile: stacked. Desktop: side by side */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs mb-0.5 flex items-center gap-1.5 capitalize">
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="truncate">{dateLabel}</span>
              </p>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight"
                style={{ fontFamily: "Syne, sans-serif" }}>
                {greeting},{" "}
                <span className="text-primary">{firstName}</span> 👋
              </h1>
            </div>

            {/* Goal badge — mobile: small pill. Desktop: normal */}
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5 shrink-0">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary hidden sm:inline">
                {GOAL_LABELS[data.user.goal] ?? data.user.goal}
              </span>
              <span className="text-sm sm:hidden">
                {GOAL_LABELS[data.user.goal]?.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile layout: everything in one column ─────────────── */}
        <div className="space-y-4 md:hidden">

          {/* Calorie ring card */}
          <CalorieRing consumed={totals.calories} goal={goals.calories} remaining={remaining} />

          {/* Macros — 3 compact cards in a row */}
          <div className="grid grid-cols-3 gap-2">
            <MacroBar label="Proteína"      consumed={totals.protein} goal={goals.protein}
              color="text-blue-400"  bgColor="bg-blue-500/15"  icon={Beef} />
            <MacroBar label="Carbos"        consumed={totals.carbs}   goal={goals.carbs}
              color="text-green-400" bgColor="bg-green-500/15" icon={Zap} />
            <MacroBar label="Grasas"        consumed={totals.fat}     goal={goals.fat}
              color="text-rose-400"  bgColor="bg-rose-500/15"  icon={Droplets} />
          </div>

          {/* Today's meals */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"
                  style={{ fontFamily: "Syne, sans-serif" }}>
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  Comidas de hoy
                </CardTitle>
                <Link href="/dashboard/meals"
                  className="flex items-center gap-0.5 text-xs text-primary font-medium">
                  Ver todas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {meals.length === 0 ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-8 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 text-muted-foreground"
                >
                  <span className="text-3xl">🍽️</span>
                  <p className="text-sm">Toca para registrar tu primera comida</p>
                </button>
              ) : (
                <div className="space-y-2">
                  {meals.slice(0, 4).map((meal) => (
                    <MealCard key={meal._id} meal={meal} date={today} />
                  ))}
                  {meals.length > 4 && (
                    <Link href="/dashboard/meals"
                      className="flex items-center justify-center gap-1 text-xs text-primary py-2">
                      Ver {meals.length - 4} comidas más <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly chart — collapsible feel, always visible on mobile */}
          <WeeklyChart weekly={weekly} goals={goals} />
        </div>

        {/* ── Desktop layout: original grid ───────────────────────── */}
        <div className="hidden md:block space-y-6">
          {/* Calorie + macros row */}
          <div className="grid grid-cols-4 gap-4">
            <CalorieRing consumed={totals.calories} goal={goals.calories} remaining={remaining} />
            <MacroBar label="Proteína"     consumed={totals.protein} goal={goals.protein}
              color="text-blue-400"  bgColor="bg-blue-500/20"  icon={Beef} />
            <MacroBar label="Carbohidratos" consumed={totals.carbs}   goal={goals.carbs}
              color="text-green-400" bgColor="bg-green-500/20" icon={Zap} />
            <MacroBar label="Grasas"       consumed={totals.fat}     goal={goals.fat}
              color="text-rose-400"  bgColor="bg-rose-500/20"  icon={Droplets} />
          </div>

          {/* Meals + weekly */}
          <div className="grid grid-cols-3 gap-4">
            {/* Meals — 2 cols */}
            <Card className="col-span-2 bg-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"
                    style={{ fontFamily: "Syne, sans-serif" }}>
                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                    Comidas de hoy
                  </CardTitle>
                  <Link href="/dashboard/meals"
                    className="text-xs text-primary hover:underline underline-offset-4">
                    Ver todas →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {meals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="text-4xl mb-3">🍽️</span>
                    <p className="text-muted-foreground text-sm mb-3">
                      Aún no has registrado comidas hoy
                    </p>
                    <Button size="sm" onClick={() => setShowForm(true)}
                      className="bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30"
                      variant="ghost">
                      <Plus className="w-3.5 h-3.5" /> Registrar primera comida
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meals.slice(0, 6).map((meal) => (
                      <MealCard key={meal._id} meal={meal} date={today} />
                    ))}
                    {meals.length > 6 && (
                      <Link href="/dashboard/meals"
                        className="block text-center text-xs text-primary hover:underline pt-1">
                        Ver {meals.length - 6} comidas más →
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <WeeklyChart weekly={weekly} goals={goals} />
          </div>
        </div>
      </div>

      {/* FAB — Add meal — mobile only, fixed bottom right */}
      <button
        onClick={() => setShowForm(true)}
        className="md:hidden fixed bottom-[calc(var(--bottom-nav-h)+1rem)] right-4 z-30
          w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40
          flex items-center justify-center
          active:scale-95 transition-transform"
        aria-label="Agregar comida"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showForm && (
        <MealForm date={today} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

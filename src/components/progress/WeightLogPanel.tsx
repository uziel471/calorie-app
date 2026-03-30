"use client";

import { useState } from "react";
import { Scale, Plus, Trash2, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeightLog, useLogWeight, useDeleteWeightLog } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { getToday, toLocalDateString } from "@/lib/date";

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "🔥 Perder grasa",
  maintain: "⚖️ Mantener",
  gain_muscle: "💪 Ganar músculo",
};

function WeightSparkline({ weights }: { weights: { date: string; weight: number }[] }) {
  if (weights.length < 2) return null;

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((w) => w.weight);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;

  const W = 300;
  const H = 60;
  const pts = sorted.map((w, i) => {
    const x = (i / (sorted.length - 1)) * W;
    const y = H - ((w.weight - min) / range) * H;
    return `${x},${y}`;
  });

  const polyline = pts.join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(28,95%,58%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(28,95%,58%)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#weightGrad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke="hsl(28,95%,58%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1].split(",");
        return (
          <circle
            cx={last[0]}
            cy={last[1]}
            r="3.5"
            fill="hsl(28,95%,58%)"
            stroke="hsl(var(--card))"
            strokeWidth="2"
          />
        );
      })()}
    </svg>
  );
}

export function WeightLogPanel() {
  const today = getToday();
  const { data, isLoading } = useWeightLog(90);
  const { mutate: logWeight, isPending: logging } = useLogWeight();
  const { mutate: deleteLog, isPending: deleting } = useDeleteWeightLog();

  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today);
  const [showForm, setShowForm] = useState(false);

  const logs = data?.logs ?? [];
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const firstLog = [...logs].sort((a, b) => a.date.localeCompare(b.date))[0];
  const lastLog = sortedLogs[0];

  const weightChange =
    firstLog && lastLog && firstLog._id !== lastLog._id
      ? Math.round((lastLog.weight - firstLog.weight) * 10) / 10
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w < 20 || w > 500) return;
    logWeight(
      { weight: w, date, notes: notes || undefined },
      {
        onSuccess: () => {
          setWeight("");
          setNotes("");
          setDate(today);
          setShowForm(false);
        },
      }
    );
  };

  // sparkline data (last 30 days)
  const sparkData = sortedLogs
    .slice(0, 30)
    .map((l) => ({
      date: toLocalDateString(new Date(l.date)),
      weight: l.weight,
    }));
  console.log('sortedLogs', sortedLogs);
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle
            className="text-lg flex items-center gap-2"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            <Scale className="w-4 h-4 text-primary" />
            Registro de peso
          </CardTitle>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-secondary/30 border border-border/50 rounded-xl p-4 space-y-3 animate-fade-in"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-secondary/50 border-border/60 focus:border-primary text-center"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input
                  type="date"
                  value={date}
                  max={today}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-secondary/50 border-border/60 focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
              <Input
                placeholder="Ej: En ayunas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary/50 border-border/60 focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="flex-1 border-border/60"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={logging || !weight}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
              >
                {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Scale className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin registros de peso aún</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Registra tu peso diariamente para ver tu evolución
            </p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/40 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Actual</p>
                <p className="text-xl font-bold text-primary" style={{ fontFamily: "Syne, sans-serif" }}>
                  {lastLog?.weight}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                </p>
              </div>
              <div className="bg-secondary/40 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Inicial</p>
                <p className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
                  {firstLog?.weight}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                </p>
              </div>
              <div className="bg-secondary/40 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Cambio</p>
                {weightChange !== null ? (
                  <p
                    className={cn(
                      "text-xl font-bold flex items-center justify-center gap-0.5",
                      weightChange < 0
                        ? "text-green-400"
                        : weightChange > 0
                        ? "text-rose-400"
                        : "text-muted-foreground"
                    )}
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {weightChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : weightChange < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    {weightChange > 0 ? "+" : ""}
                    {weightChange}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                  </p>
                ) : (
                  <p className="text-xl font-bold text-muted-foreground">—</p>
                )}
              </div>
            </div>

            {/* Sparkline */}
            {sparkData.length >= 2 && (
              <div className="px-1">
                <WeightSparkline weights={sparkData} />
              </div>
            )}

            {/* Log entries */}
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {sortedLogs.slice(0, 30).map((log) => {
                const date = new Date(log.date);

                const isValid = !isNaN(date.getTime());

                const logDate = isValid
                  ? date.toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  : "Fecha inválida";

                const isToday = toLocalDateString(new Date(log.date)) === today;

                return (
                  <div
                    key={log._id}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors",
                      isToday && "bg-primary/5 border border-primary/15"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs",
                            isToday ? "text-primary font-semibold" : "text-muted-foreground"
                          )}
                        >
                          {isToday ? "Hoy" : logDate}
                        </span>
                        {log.notes && (
                          <span className="text-xs text-muted-foreground/60 truncate">
                            · {log.notes}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/50">
                        {GOAL_LABELS[log.snapshot.goal] ?? log.snapshot.goal} ·{" "}
                        {log.snapshot.calorieGoal} kcal
                      </p>
                    </div>
                    <span className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                      {log.weight}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                    </span>
                    <button
                      onClick={() => deleteLog(log._id)}
                      disabled={deleting}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

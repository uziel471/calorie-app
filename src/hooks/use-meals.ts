"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MealInput } from "@/lib/meal-validations";
import { toast } from "@/hooks/use-toast";
import { getUserTimeZone } from "@/lib/date";

const MEALS_KEY = "meals";
const STATS_KEY = "dashboard-stats";
  const timeZone = getUserTimeZone();

// ── Fetch meals by date ────────────────────────────────────────────────────
async function fetchMeals(date: string) {
  const res = await fetch(`/api/meals?date=${date}`, {
    headers: {
      "x-timezone": timeZone,
    },
  });
  if (!res.ok) throw new Error("Error al cargar comidas");
  return res.json() as Promise<{ meals: MealDoc[] }>;
}

export interface MealDoc {
  _id: string;
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  notes?: string;
  date: string;
}

export function useMeals(date: string) {
  return useQuery({
    queryKey: [MEALS_KEY, date],
    queryFn: () => fetchMeals(date),
    staleTime: 30_000,
  });
}

// ── Create meal ────────────────────────────────────────────────────────────
async function createMeal(data: MealInput) {
  const res = await fetch("/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-timezone": timeZone },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al guardar");
  return json;
}

export function useCreateMeal(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      toast({ title: "✅ Comida registrada", description: "Se agregó correctamente." });
      qc.invalidateQueries({ queryKey: [MEALS_KEY, date] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

// ── Delete meal ────────────────────────────────────────────────────────────
async function deleteMeal(id: string) {
  const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
}

export function useDeleteMeal(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      toast({ title: "Comida eliminada" });
      qc.invalidateQueries({ queryKey: [MEALS_KEY, date] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

// ── Dashboard stats ────────────────────────────────────────────────────────
export interface DashboardStats {
  goals: { calories: number; protein: number; carbs: number; fat: number; bmr: number; tdee: number };
  today: {
    totals: { calories: number; protein: number; carbs: number; fat: number };
    meals: MealDoc[];
    mealsByType: Record<string, MealDoc[]>;
  };
  weekly: { date: string; calories: number; percentage: number, label: string }[];
  user: { name: string; goal: string; weight: number };
}

async function fetchStats(date: string): Promise<DashboardStats> {
  const res = await fetch(`/api/dashboard/stats?date=${date}`, {
    headers: {
      "x-timezone": timeZone,
    },
  });
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json();
}

export function useDashboardStats(date: string) {
  return useQuery({
    queryKey: [STATS_KEY, date],
    queryFn: () => fetchStats(date),
    staleTime: 30_000,
  });
}

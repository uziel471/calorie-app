"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getUserTimeZone } from "@/lib/date";

// ── Progress ───────────────────────────────────────────────────────────────

const timeZone = getUserTimeZone();

export interface DayHistory {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number | null;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  percentage: number;
  mealsCount: number;
  goalMet: boolean;
  snapshotSource: "weight_log" | "interpolated" | "current";
}

export interface WeightTrendPoint {
  date: string;
  weight: number;
  goal: string;
  calorieGoal: number;
  notes: string | null;
}

export interface ProgressData {
  goals: { calories: number; protein: number; carbs: number; fat: number; bmr: number; tdee: number };
  history: DayHistory[];
  streaks: { current: number; longest: number };
  averages: { calories: number; protein: number; carbs: number; fat: number };
  adherence: number;
  daysOnGoal: number;
  activeDays: number;
  bestDay: DayHistory | null;
  macroBreakdown: { protein: number; carbs: number; fat: number };
  weeklyAverages: { week: string; avgCalories: number; percentage: number }[];
  weightTrend: WeightTrendPoint[];
  weightChange: number | null;
  user: { name: string; goal: string; weight: number; height: number };
}

async function fetchProgress(days: number): Promise<ProgressData> {
  const res = await fetch(`/api/progress?days=${days}`, {
    headers: {
      "x-timezone": timeZone,
    },
  });
  if (!res.ok) throw new Error("Error al cargar progreso");
  return res.json();
}

export function useProgress(days = 30) {
  return useQuery({
    queryKey: ["progress", days],
    queryFn: () => fetchProgress(days),
    staleTime: 60_000,
  });
}

// ── Weight Log ─────────────────────────────────────────────────────────────

export interface WeightLogEntry {
  _id: string;
  date: string;
  weight: number;
  notes?: string;
  snapshot: {
    age: number;
    height: number;
    sex: string;
    activityLevel: string;
    goal: string;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    bmr: number;
    tdee: number;
  };
}

async function fetchWeightLog(limit: number): Promise<{ logs: WeightLogEntry[]; currentWeight: number | null }> {
  const res = await fetch(`/api/weight-log?limit=${limit}`);
  if (!res.ok) throw new Error("Error al cargar registro de peso");
  return res.json();
}

export function useWeightLog(limit = 90) {
  return useQuery({
    queryKey: ["weight-log", limit],
    queryFn: () => fetchWeightLog(limit),
    staleTime: 60_000,
  });
}

async function postWeightLog(data: { weight: number; date: string; notes?: string }) {
  const res = await fetch("/api/weight-log", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-timezone": timeZone },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al guardar peso");
  return json;
}

export function useLogWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postWeightLog,
    onSuccess: () => {
      toast({ title: "⚖️ Peso registrado", description: "Tu progreso ha sido actualizado." });
      qc.invalidateQueries({ queryKey: ["weight-log"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

async function deleteWeightLog(id: string) {
  const res = await fetch(`/api/weight-log/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar registro");
}

export function useDeleteWeightLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWeightLog,
    onSuccess: () => {
      toast({ title: "Registro eliminado" });
      qc.invalidateQueries({ queryKey: ["weight-log"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

// ── Settings / Profile ─────────────────────────────────────────────────────

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  sex: string;
  activityLevel: string;
  goal: string;
  createdAt: string;
}

async function fetchProfile(): Promise<{ user: UserProfile }> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Error al cargar perfil");
  return res.json();
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 120_000,
  });
}

async function patchProfile(data: Partial<UserProfile>): Promise<{ user: UserProfile; message: string }> {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al actualizar");
  return json;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchProfile,
    onSuccess: (data) => {
      toast({ title: "✅ Perfil actualizado", description: data.message });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al cambiar contraseña");
  return json;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast({ title: "🔒 Contraseña actualizada", description: "Tu contraseña ha sido cambiada." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

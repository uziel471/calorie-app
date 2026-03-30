"use client";

import { useState, useEffect } from "react";
import {
  User, Scale, Ruler, Calendar, Activity, Target, Lock,
  Eye, EyeOff, Loader2, Save, Flame, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks/use-profile";
import { calculateNutritionGoals } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

const ACTIVITY_LABELS: Record<string, { label: string; desc: string }> = {
  sedentary:         { label: "Sedentario", desc: "Sin ejercicio o muy poco" },
  lightly_active:    { label: "Ligero", desc: "Ejercicio 1-3 días/semana" },
  moderately_active: { label: "Moderado", desc: "Ejercicio 3-5 días/semana" },
  very_active:       { label: "Muy activo", desc: "Ejercicio 6-7 días/semana" },
  extra_active:      { label: "Extra activo", desc: "Trabajo físico intenso + ejercicio" },
};

const GOAL_OPTIONS = [
  { value: "lose_fat", label: "Perder grasa", emoji: "🔥", desc: "-500 kcal/día" },
  { value: "maintain", label: "Mantener peso", emoji: "⚖️", desc: "TDEE exacto" },
  { value: "gain_muscle", label: "Ganar músculo", emoji: "💪", desc: "+300 kcal/día" },
];

const SEX_OPTIONS = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
  { value: "other", label: "Otro" },
];

type Section = "profile" | "goals" | "password";

export default function SettingsPage() {
  const { data, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPwd } = useChangePassword();

  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [profile, setProfile] = useState({
    name: "", age: 0, weight: 0, height: 0, sex: "male",
  });
  const [goals, setGoals] = useState({
    activityLevel: "moderately_active", goal: "maintain",
  });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false });
  const [pwdError, setPwdError] = useState("");

  // Sync fetched user into state
  useEffect(() => {
    if (data?.user) {
      const u = data.user;
      setProfile({ name: u.name, age: u.age, weight: u.weight, height: u.height, sex: u.sex });
      setGoals({ activityLevel: u.activityLevel, goal: u.goal });
    }
  }, [data]);

  const handleProfileSave = () => {
    updateProfile({
      name: profile.name,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      sex: profile.sex as "male" | "female" | "other",
    });
  };

  const handleGoalsSave = () => {
    updateProfile({
      activityLevel: goals.activityLevel as never,
      goal: goals.goal as never,
    });
  };

  const handlePasswordSave = () => {
    setPwdError("");
    if (pwd.newPassword !== pwd.confirm) {
      setPwdError("Las contraseñas no coinciden");
      return;
    }
    if (pwd.newPassword.length < 6) {
      setPwdError("Mínimo 6 caracteres");
      return;
    }
    changePassword(
      { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword },
      { onSuccess: () => setPwd({ currentPassword: "", newPassword: "", confirm: "" }) }
    );
  };

  // Computed nutrition goals from current form values
  const computedGoals = data?.user
    ? calculateNutritionGoals({
        age: profile.age || data.user.age,
        weight: profile.weight || data.user.weight,
        height: profile.height || data.user.height,
        sex: (profile.sex || data.user.sex) as "male" | "female" | "other",
        activityLevel: goals.activityLevel as never,
        goal: goals.goal as never,
      })
    : null;

  const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Datos personales", icon: User },
    { id: "goals", label: "Objetivo y actividad", icon: Target },
    { id: "password", label: "Contraseña", icon: Lock },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            Ajustes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Actualiza tu perfil y preferencias para un cálculo preciso de tus metas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <div className="md:col-span-1">
            <Card className="bg-card border-border/50">
              <CardContent className="p-2">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                      activeSection === id
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Account info */}
            {data?.user && (
              <Card className="bg-card border-border/50 mt-3">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {data.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{data.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{data.user.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Miembro desde{" "}
                    {new Date(data.user.createdAt).toLocaleDateString("es-MX", {
                      month: "long", year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content */}
          <div className="md:col-span-3 space-y-4">
            {/* — PROFILE SECTION — */}
            {activeSection === "profile" && (
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                    <User className="w-5 h-5 text-primary" />
                    Datos personales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label>Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        className="pl-10 bg-secondary/50 border-border/60 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Age / Weight / Height */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5" /> Edad
                      </Label>
                      <Input
                        type="number"
                        value={profile.age || ""}
                        onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))}
                        className="bg-secondary/50 border-border/60 focus:border-primary text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Scale className="w-3.5 h-3.5" /> Peso (kg)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={profile.weight || ""}
                        onChange={(e) => setProfile((p) => ({ ...p, weight: Number(e.target.value) }))}
                        className="bg-secondary/50 border-border/60 focus:border-primary text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Ruler className="w-3.5 h-3.5" /> Altura (cm)
                      </Label>
                      <Input
                        type="number"
                        value={profile.height || ""}
                        onChange={(e) => setProfile((p) => ({ ...p, height: Number(e.target.value) }))}
                        className="bg-secondary/50 border-border/60 focus:border-primary text-center"
                      />
                    </div>
                  </div>

                  {/* Sex */}
                  <div className="space-y-1.5">
                    <Label>Sexo biológico</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SEX_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, sex: s.value }))}
                          className={cn(
                            "h-10 rounded-lg border text-sm font-medium transition-all",
                            profile.sex === s.value
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border/60 bg-secondary/50 text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleProfileSave}
                    disabled={updating}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {updating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Guardar cambios</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* — GOALS SECTION — */}
            {activeSection === "goals" && (
              <>
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                      <Target className="w-5 h-5 text-primary" />
                      Objetivo y nivel de actividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Goal selector */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-primary" /> Tu objetivo
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {GOAL_OPTIONS.map((g) => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setGoals((prev) => ({ ...prev, goal: g.value }))}
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-all",
                              goals.goal === g.value
                                ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20"
                                : "border-border/60 bg-secondary/50 text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            <span className="text-2xl">{g.emoji}</span>
                            <span className="font-medium text-xs text-center leading-tight">{g.label}</span>
                            <span className="text-xs opacity-60">{g.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity level */}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-primary" /> Nivel de actividad
                      </Label>
                      <Select
                        value={goals.activityLevel}
                        onValueChange={(v) => setGoals((p) => ({ ...p, activityLevel: v }))}
                      >
                        <SelectTrigger className="bg-secondary/50 border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTIVITY_LABELS).map(([val, { label, desc }]) => (
                            <SelectItem key={val} value={val}>
                              <span className="font-medium">{label}</span>
                              <span className="text-muted-foreground ml-1 text-xs">— {desc}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGoalsSave}
                      disabled={updating}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      {updating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                      ) : (
                        <><Save className="w-4 h-4" /> Guardar objetivo</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Computed nutrition preview */}
                {computedGoals && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                        <Info className="w-4 h-4 text-primary" />
                        Tus metas nutricionales calculadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { icon: Flame, label: "Calorías/día", value: computedGoals.calories, unit: "kcal", color: "text-primary" },
                          { icon: null, label: "Proteína", value: computedGoals.protein, unit: "g", color: "text-blue-400" },
                          { icon: null, label: "Carbohidratos", value: computedGoals.carbs, unit: "g", color: "text-green-400" },
                          { icon: null, label: "Grasas", value: computedGoals.fat, unit: "g", color: "text-rose-400" },
                        ].map(({ label, value, unit, color }) => (
                          <div key={label} className="bg-card/60 rounded-xl p-3 text-center">
                            <p className={`text-xl font-bold ${color}`} style={{ fontFamily: "Syne, sans-serif" }}>
                              {value}
                              <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                        <Info className="w-3 h-3 shrink-0" />
                        BMR: {computedGoals.bmr} kcal · TDEE: {computedGoals.tdee} kcal/día — calculado con Harris-Benedict
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* — PASSWORD SECTION — */}
            {activeSection === "password" && (
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
                    <Lock className="w-5 h-5 text-primary" />
                    Cambiar contraseña
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Contraseña actual</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPwd.current ? "text" : "password"}
                        value={pwd.currentPassword}
                        onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                        className="pl-10 pr-10 bg-secondary/50 border-border/60 focus:border-primary"
                        placeholder="Tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Nueva contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPwd.new ? "text" : "password"}
                        value={pwd.newPassword}
                        onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                        className="pl-10 pr-10 bg-secondary/50 border-border/60 focus:border-primary"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Confirmar nueva contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={pwd.confirm}
                        onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                        className={cn(
                          "pl-10 bg-secondary/50 border-border/60 focus:border-primary",
                          pwdError && "border-destructive"
                        )}
                        placeholder="Repite la nueva contraseña"
                      />
                    </div>
                    {pwdError && <p className="text-xs text-destructive">{pwdError}</p>}
                  </div>

                  <div className="bg-secondary/40 rounded-xl p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Requisitos:</p>
                    <ul className="space-y-0.5">
                      <li className={cn("flex items-center gap-1.5", pwd.newPassword.length >= 6 && "text-primary")}>
                        <span className={pwd.newPassword.length >= 6 ? "text-primary" : ""}>
                          {pwd.newPassword.length >= 6 ? "✓" : "·"}
                        </span>
                        Mínimo 6 caracteres
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handlePasswordSave}
                    disabled={changingPwd || !pwd.currentPassword || !pwd.newPassword || !pwd.confirm}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {changingPwd ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando...</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Cambiar contraseña</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

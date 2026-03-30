"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, Mail, Lock, User, Flame, ArrowRight, ArrowLeft,
  Loader2, Scale, Ruler, Calendar, Activity, Target, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRegister } from "@/hooks/use-register";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Tu cuenta",   description: "Crea tus credenciales de acceso", emoji: "👤" },
  { title: "Tu perfil",   description: "Cuéntanos sobre ti",               emoji: "📏" },
  { title: "Tu objetivo", description: "Personalizamos tu plan",            emoji: "🎯" },
];

type FormData = Omit<RegisterInput, "confirmPassword"> & { confirmPassword: string };

const defaultForm: FormData = {
  name: "", email: "", password: "", confirmPassword: "",
  age: 0, weight: 0, height: 0,
  sex: "male", activityLevel: "moderately_active", goal: "maintain",
};

const activityLabels: Record<string, string> = {
  sedentary:         "Sedentario — sin ejercicio",
  lightly_active:    "Ligero — 1-3 días/semana",
  moderately_active: "Moderado — 3-5 días/semana",
  very_active:       "Muy activo — 6-7 días/semana",
  extra_active:      "Extra activo — trabajo físico intenso",
};

const goalOptions = [
  { value: "lose_fat",    label: "Perder grasa",   emoji: "🔥" },
  { value: "maintain",    label: "Mantener peso",  emoji: "⚖️" },
  { value: "gain_muscle", label: "Ganar músculo",  emoji: "💪" },
] as const;

export function RegisterForm() {
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState<FormData>(defaultForm);
  const [showPassword, setShowPwd]    = useState(false);
  const [showConfirm, setShowConf]    = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const { mutate: register, isPending } = useRegister();

  const set = (key: keyof FormData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateStep = (s: number): boolean => {
    const fields: (keyof FormData)[][] = [
      ["name", "email", "password", "confirmPassword"],
      ["age", "weight", "height", "sex"],
      ["activityLevel", "goal"],
    ];
    const result = registerSchema.safeParse({ ...defaultForm, ...form });
    const newErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (fields[s].includes(field as keyof FormData)) newErrors[field] = err.message;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((s) => s + 1); };
  const back = () => { setErrors({}); setStep((s) => s - 1); };
  const handleSubmit = () => { if (!validateStep(step)) return; register(form); };

  const err = (field: string) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <div className="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col min-h-dvh md:min-h-0 md:justify-center">

      {/* ── Logo ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2.5 pt-10 pb-6 md:pt-0 md:pb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Flame className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
          CalorieTrack
        </span>
      </div>

      {/* ── Step indicators ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 mb-5">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
              i === step
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 step-active"
                : i < step
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-secondary text-muted-foreground"
            )}>
              {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-6 h-px transition-colors duration-500", i < step ? "bg-primary/50" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* ── Card ───────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40 flex-1 md:flex-none flex flex-col md:block">
        {/* Card header */}
        <div className="mb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Paso {step + 1} de {STEPS.length}
          </p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            {STEPS[step].title}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{STEPS[step].description}</p>
        </div>

        {/* ── STEP 0 — Credenciales ─────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4 flex-1 flex flex-col md:block">
            <div className="space-y-1.5 field-animate">
              <Label className="text-sm">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  autoComplete="name"
                  placeholder="Ana García"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={cn("pl-10 h-12 bg-secondary/50 border-border/60 focus:border-primary", errors.name && "border-destructive")}
                />
              </div>
              {err("name")}
            </div>

            <div className="space-y-1.5 field-animate" style={{ animationDelay: "60ms" }}>
              <Label className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={cn("pl-10 h-12 bg-secondary/50 border-border/60 focus:border-primary", errors.email && "border-destructive")}
                />
              </div>
              {err("email")}
            </div>

            <div className="space-y-1.5 field-animate" style={{ animationDelay: "120ms" }}>
              <Label className="text-sm">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mín. 6 caracteres"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={cn("pl-10 pr-12 h-12 bg-secondary/50 border-border/60 focus:border-primary", errors.password && "border-destructive")}
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {err("password")}
            </div>

            <div className="space-y-1.5 field-animate" style={{ animationDelay: "180ms" }}>
              <Label className="text-sm">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  className={cn("pl-10 pr-12 h-12 bg-secondary/50 border-border/60 focus:border-primary", errors.confirmPassword && "border-destructive")}
                />
                <button type="button" onClick={() => setShowConf((s) => !s)}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {err("confirmPassword")}
            </div>

            <div className="flex-1 md:hidden" />
          </div>
        )}

        {/* ── STEP 1 — Perfil físico ────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5 flex-1 flex flex-col md:block">
            {/* Age / Weight / Height — bigger inputs on mobile */}
            <div className="grid grid-cols-3 gap-3 field-animate">
              {[
                { key: "age",    icon: Calendar, label: "Edad",       placeholder: "25", inputMode: "numeric" as const },
                { key: "weight", icon: Scale,    label: "Peso (kg)",  placeholder: "70", inputMode: "decimal" as const },
                { key: "height", icon: Ruler,    label: "Altura (cm)", placeholder: "170", inputMode: "numeric" as const },
              ].map(({ key, icon: Icon, label, placeholder, inputMode }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs">
                    <Icon className="w-3 h-3" /> {label}
                  </Label>
                  <Input
                    type="number"
                    inputMode={inputMode}
                    placeholder={placeholder}
                    value={form[key as keyof FormData] || ""}
                    onChange={(e) => set(key as keyof FormData, Number(e.target.value))}
                    className={cn(
                      "h-12 bg-secondary/50 border-border/60 focus:border-primary text-center text-base font-medium",
                      errors[key] && "border-destructive"
                    )}
                  />
                  {err(key)}
                </div>
              ))}
            </div>

            {/* Sex — full-width buttons on mobile */}
            <div className="space-y-2 field-animate" style={{ animationDelay: "80ms" }}>
              <Label className="text-sm">Sexo biológico</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "other"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("sex", s)}
                    className={cn(
                      "h-12 rounded-xl border text-sm font-medium transition-all",
                      form.sex === s
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/60 bg-secondary/50 text-muted-foreground"
                    )}
                  >
                    {s === "male" ? "Hombre" : s === "female" ? "Mujer" : "Otro"}
                  </button>
                ))}
              </div>
              {err("sex")}
            </div>

            <div className="flex-1 md:hidden" />
          </div>
        )}

        {/* ── STEP 2 — Objetivo ────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5 flex-1 flex flex-col md:block">
            <div className="space-y-2 field-animate">
              <Label className="flex items-center gap-1.5 text-sm">
                <Activity className="w-4 h-4 text-primary" /> Nivel de actividad
              </Label>
              <Select
                value={form.activityLevel}
                onValueChange={(v) => set("activityLevel", v)}
              >
                <SelectTrigger className="h-12 bg-secondary/50 border-border/60 focus:border-primary text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(activityLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="py-3">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("activityLevel")}
            </div>

            <div className="space-y-2 field-animate" style={{ animationDelay: "80ms" }}>
              <Label className="flex items-center gap-1.5 text-sm">
                <Target className="w-4 h-4 text-primary" /> Tu objetivo principal
              </Label>
              {/* Goal cards — vertical on mobile, grid on larger */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {goalOptions.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("goal", value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border text-sm font-medium transition-all",
                      form.goal === value
                        ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20"
                        : "border-border/60 bg-secondary/50 text-muted-foreground"
                    )}
                  >
                    <span className="text-2xl md:text-3xl">{emoji}</span>
                    <span className="text-xs text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
              {err("goal")}
            </div>

            <div className="flex-1 md:hidden" />
          </div>
        )}

        {/* ── Navigation buttons ───────────────────────────────────── */}
        <div className={cn("flex gap-3 mt-6", step > 0 ? "flex-row" : "flex-col")}>
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={isPending}
              className="flex-1 h-12 border-border/60 hover:bg-secondary"
            >
              <ArrowLeft className="w-4 h-4" /> Atrás
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={next}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                : <>Crear cuenta <ArrowRight className="w-4 h-4" /></>}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
            Iniciar sesión
          </Link>
        </p>
      </div>

      {/* Bottom safe area spacer on mobile */}
      <div className="h-8 md:hidden" />
    </div>
  );
}

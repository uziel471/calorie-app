"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Flame, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-login";
import { loginSchema, LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [form, setForm]             = useState<LoginInput>({ email: "", password: "" });
  const [showPassword, setShowPwd]  = useState(false);
  const [errors, setErrors]         = useState<Partial<LoginInput>>({});
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<LoginInput> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as keyof LoginInput] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    login(parsed.data);
  };

  return (
    /*
      Mobile: full-screen flex column so the card fills the screen naturally.
      Desktop: centered card with max-width.
    */
    <div className="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col min-h-dvh md:min-h-0 md:justify-center">

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2.5 pt-16 pb-8 md:pt-0 md:pb-10">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Flame className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
          CalorieTrack
        </span>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40 flex-1 md:flex-none flex flex-col md:block">
        <div className="mb-7">
          <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
            Bienvenido de nuevo
          </h1>
          <p className="text-muted-foreground text-sm">
            Inicia sesión para continuar tu progreso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col md:block">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={cn(
                  "pl-10 h-12 bg-secondary/50 border-border/60 focus:border-primary",
                  errors.email && "border-destructive"
                )}
                disabled={isPending}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={cn(
                  "pl-10 pr-12 h-12 bg-secondary/50 border-border/60 focus:border-primary",
                  errors.password && "border-destructive"
                )}
                disabled={isPending}
              />
              {/* Toggle — larger tap target on mobile */}
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Spacer pushes button to bottom on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
            ) : (
              <>Iniciar sesión <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </form>

        {/* Divider + link */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">¿Nuevo aquí?</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground pb-safe">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

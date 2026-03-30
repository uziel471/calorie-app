"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoginInput } from "@/lib/validations";
import { toast } from "@/hooks/use-toast";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: "¡Bienvenido!", description: "Sesión iniciada correctamente." });
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: Error) => {
      const msg =
        error.message === "No existe una cuenta con ese email"
          ? "No existe una cuenta con ese email"
          : error.message === "Contraseña incorrecta"
          ? "Contraseña incorrecta"
          : "Error al iniciar sesión";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });
}

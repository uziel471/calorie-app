"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { RegisterInput } from "@/lib/validations";
import { toast } from "@/hooks/use-toast";

async function registerUser(data: RegisterInput) {
  const res = await fetch("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al registrar");
  return json;
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: async (_, variables) => {
      toast({ title: "¡Cuenta creada!", description: "Iniciando sesión automáticamente..." });
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

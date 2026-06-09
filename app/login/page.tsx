"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createElement, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { authApi } from "@/lib/axios/auth";
import { LoginSchema, type LoginInput } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toastShown = useRef(false);

  useEffect(() => {
    const msg = searchParams.get("toast");
    if (msg && !toastShown.current) {
      toastShown.current = true;
      toast.custom(
        createElement(
          "div",
          {
            className:
              "bg-red-600 text-white px-4 py-3 text-sm font-medium rounded-lg",
          },
          msg,
        ),
        { duration: 4000 },
      );
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await authApi.login(data);
      router.push("/");
      router.refresh();
    } catch {
      // toast.error("Credenziali non valide. Riprova.");
    }
  };

  return (
    <>
      <main className="flex min-h-screen items-center justify-center">
        <div className="card bg-base-100 w-full max-w-md shadow-sm">
          <div className="card-body gap-4">
            <h2 className="card-title text-2xl">Accedi</h2>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email</legend>
                <input
                  type="email"
                  placeholder="mario@example.com"
                  className={`input w-full ${errors.email ? "input-error" : ""}`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="fieldset-label text-error">
                    {errors.email.message}
                  </p>
                )}
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Password</legend>
                <input
                  type="password"
                  placeholder="la tua password"
                  className={`input w-full ${errors.password ? "input-error" : ""}`}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="fieldset-label text-error">
                    {errors.password.message}
                  </p>
                )}
              </fieldset>
              <button type="submit" className="btn btn-primary mt-2">
                Accedi
              </button>
            </form>
            <p className="text-sm text-center text-base-content/60">
              Non hai un account?{" "}
              <a href="/register" className="link link-primary">
                Registrati
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

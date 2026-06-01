"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/axios/auth";
import { RegisterSchema, type RegisterInput } from "@/lib/validators/auth";
import { z } from "zod";

const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof RegisterFormSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterForm) => {
    const { confirmPassword, ...payload } = data;
    try {
      await authApi.register(payload);
      toast.success("Registrazione completata!");
      router.push("/login?registered=true");
    } catch {}
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="card bg-base-100 w-full max-w-md shadow-sm">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl">Crea account</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nome</legend>
              <input
                type="text"
                placeholder="Mario"
                className={`input w-full ${errors.firstName ? "input-error" : ""}`}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="fieldset-label text-error">
                  {errors.firstName.message}
                </p>
              )}
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Cognome</legend>
              <input
                type="text"
                placeholder="Rossi"
                className={`input w-full ${errors.lastName ? "input-error" : ""}`}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="fieldset-label text-error">
                  {errors.lastName.message}
                </p>
              )}
            </fieldset>
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
                placeholder="min. 6 caratteri"
                className={`input w-full ${errors.password ? "input-error" : ""}`}
                {...register("password")}
              />
              {errors.password && (
                <p className="fieldset-label text-error">
                  {errors.password.message}
                </p>
              )}
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Conferma password</legend>
              <input
                type="password"
                placeholder="ripeti la password"
                className={`input w-full ${errors.confirmPassword ? "input-error" : ""}`}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="fieldset-label text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </fieldset>
            <button type="submit" className="btn btn-primary mt-2">
              Registrati
            </button>
          </form>
          <p className="text-sm text-center text-base-content/60">
            Hai già un account?{" "}
            <a href="/login" className="link link-primary">
              Accedi
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

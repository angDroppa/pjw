"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="card bg-base-100 w-full max-w-md shadow-sm">
        <div className="card-body gap-4 text-center">
          {success ? (
            <>
              <h2 className="card-title text-2xl justify-center">✅ Email confermata</h2>
              <p className="text-base-content/60 text-sm">
                Il tuo account è stato verificato con successo.
              </p>
              <Link href="/login" className="btn btn-primary mt-2">
                Accedi
              </Link>
            </>
          ) : (
            <>
              <h2 className="card-title text-2xl justify-center">❌ Link non valido</h2>
              <p className="text-base-content/60 text-sm">
                {error === "missing"
                  ? "Nessun token fornito."
                  : "Il link è scaduto o non è valido."}
              </p>
              <Link href="/register" className="btn btn-primary mt-2">
                Registrati di nuovo
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
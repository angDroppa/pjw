"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getBiciclettaById } from "@/lib/axios/bicicletta";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";
import ProductConfigurator from "@/app/components/product/step-wizard/ProductConfigurator";

const tipologiaLabel: Record<string, string> = {
  CITY: "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL: "Gravel",
  ROAD: "Road Bike",
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = Number(params.id);

  const [showConfigurator, setShowConfigurator] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery<BiciclettaResponse>({
    queryKey: ["bicicletta", id],
    queryFn: () => getBiciclettaById(id),
    enabled: !Number.isNaN(id),
  });

  if (isLoading) {
    return (
      <main className="app-shell flex items-center justify-center app-text-muted">
        Caricamento...
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="app-shell flex items-center justify-center app-text-muted">
        Bicicletta non trovata
      </main>
    );
  }

  const prezzoMinGiorno = Math.min(
    ...product.specifics.map((s) => s.prezzoGiornata),
  );

  const prezzoMinMezza = Math.min(
    ...product.specifics.map((s) => s.prezzoMezzaGiornata),
  );

  const taglie = [...new Set(product.specifics.map((s) => s.size))];

  return (
    <main className="h-[90.5vh] app-shell py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="w-full flex flex-row justify-between">
          {/* HEADER */}
          <div className="mb-10">
            <p className="configurator-kicker">
              {tipologiaLabel[product.tipologia] ?? product.tipologia}
            </p>

            <h1 className="app-title text-5xl">{product.nome}</h1>
          </div>

          {/* PREZZI */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-2">Prezzi</h2>

            <p className="app-text-accent text-2xl font-bold">
              da €{prezzoMinGiorno.toFixed(2)} / giorno
            </p>

            <p className="app-text-muted">
              da €{prezzoMinMezza.toFixed(2)} / mezza giornata
            </p>
          </div>
        </div>

        {/* TAGLIE */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Taglie disponibili</h2>

          <div className="flex gap-2 flex-wrap">
            {taglie.map((t) => (
              <span
                key={t}
                className="app-tag"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* TABELLA SPECIFICHE */}
        <div className="mb-10 overflow-hidden app-surface">
          <table className="w-full text-sm">
            <thead className="bg-base-200">
              <tr>
                <th className="p-3 text-left">Taglia</th>
                <th className="p-3 text-left">Altezza</th>
                <th className="p-3 text-left">Giorno</th>
                <th className="p-3 text-left">Mezza giornata</th>
              </tr>
            </thead>

            <tbody>
              {product.specifics.map((s) => (
                <tr key={s.id} className="border-t-2 border-base-300">
                  <td className="p-3">{s.size}</td>

                  <td className="p-3">
                    {s.altezzaMin && s.altezzaMax
                      ? `${s.altezzaMin} - ${s.altezzaMax} cm`
                      : "-"}
                  </td>

                  <td className="p-3">€{s.prezzoGiornata.toFixed(2)}</td>

                  <td className="p-3">€{s.prezzoMezzaGiornata.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowConfigurator(true)}
          className="app-btn-primary px-8 py-4"
        >
          Configura e Prenota
        </button>

        {/* CONFIGURATOR */}
        {showConfigurator && (
          <ProductConfigurator
            product={product}
            onClose={() => setShowConfigurator(false)}
          />
        )}
      </div>
    </main>
  );
}

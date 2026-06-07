"use client";

import { getAllBiciclette } from "@/lib/axios/bicicletta";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal, { ModalHandle } from "./components/modal";
import PrenotazioneForm from "./components/forms/prenotazione.form";
import ProductCard from "./components/product/ProductCard";
import ProductConfigurator from "./components/product/step-wizard/ProductConfigurator";

export default function Home() {
  const [selectedProduct, setSelectedProduct] =
    useState<BiciclettaResponse | null>(null);

  const { data: biciclette = [], isLoading } = useQuery({
    queryKey: ["biciclette"],
    queryFn: getAllBiciclette,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent sm:text-5xl">
            Scegli la tua Bicicletta
          </h1>
          <p className="mt-4 text-xl text-slate-400">
            Seleziona il mezzo perfetto per te e configuralo nella schermata di
            prenotazione.
          </p>
        </div>

        {isLoading ? (
          <div>Caricamento...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {biciclette.map((bici) => (
              <ProductCard
                key={bici.id}
                product={bici}
                onBook={() => setSelectedProduct(bici)}
              />
            ))}
          </div>
        )}

        {selectedProduct && (
          <ProductConfigurator
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </main>
  );
}

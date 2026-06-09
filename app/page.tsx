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
    <main className="app-shell py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="app-container">
        <div className="app-page-header">
          <h1 className="app-title">
            Scegli la tua <span className="app-title-accent">Bicicletta</span>
          </h1>
          <p className="app-subtitle">
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

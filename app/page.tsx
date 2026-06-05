'use client'

import { useState, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import ProductConfigurator from "./components/ProductConfigurator";
import { BiciclettaCatalog } from "@/lib/zodSchemas/bicicletta";
import { bicicletteApi } from "@/lib/axios/bicicletta";

export default function Home() {
  const [data, setData] = useState<BiciclettaCatalog[]>([])
  const [selectedProduct, setSelectedProduct] = useState<BiciclettaCatalog | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bicicletteApi.getAll()
        setData(res)
      } catch (err) {
        console.error('Errore caricamento biciclette', err)
      }
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent sm:text-5xl">
            Scegli la tua Bicicletta
          </h1>
          <p className="mt-4 text-xl text-slate-400">
            Seleziona il mezzo perfetto per te e configuralo nella schermata di prenotazione.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((bici) => (
            <ProductCard
              key={bici.id}
              product={bici}
              onSelect={() => setSelectedProduct(bici)}
            />
          ))}
        </div>

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

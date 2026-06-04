'use client'

import { useState, useEffect } from "react";
import axios from "axios"; // 👈 Usiamo Axios standard per il client
import ProductCard from "./components/ProductCard";
import ProductConfigurator from "./components/ProductConfigurator";
import { Bicicletta } from "@/lib/schemas/bicicletta.schema";
import { locationsApi } from "@/lib/axios/location";
import { AppLocation } from "@/lib/schemas/location.schema";

export default function Home() {
  const [products, setProducts] = useState<Bicicletta[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Bicicletta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 👈 Chiamiamo l'API Route, così Prisma resta al sicuro sul server!
    axios.get<Bicicletta[]>('/api/products')
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => console.error("Errore caricamento prodotti:", err))
      .finally(() => setIsLoading(false));
  }, []);


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

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Caricamento catalogo...</div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={() => setSelectedProduct(product)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Nessuna bicicletta disponibile nel catalogo al momento.
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductConfigurator 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </main>
  );
}
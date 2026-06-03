// app/page.tsx
import { productsApi } from "@/lib/axios/productsServices";
import ProductCard from "./components/ProductCard";

export default async function Home() {
  // Esegue il fetch sul server con le nuove relazioni incluse
  const products = await productsApi.getProducts();
  console.log("Prodotti caricati sul server:", products);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header della pagina */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent sm:text-5xl">
            Scegli la tua Bicicletta
          </h1>
          <p className="mt-4 text-xl text-slate-400">
            Seleziona il mezzo perfetto per te e configuralo nella schermata di prenotazione.
          </p>
        </div>

        {/* Grid delle Card */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Nessuna bicicletta disponibile nel catalogo al momento.
          </div>
        )}

      </div>
    </main>
  );
}
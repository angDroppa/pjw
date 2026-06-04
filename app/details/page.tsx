'use client'
 
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Bicicletta } from "@/lib/schemas/bicicletta.schema";
import ProductConfigurator from "../components/ProductConfigurator";
  
function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
      {label}
    </span>
  );
}
 
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-5 py-4 backdrop-blur-sm">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">{label}</span>
      <span className="text-base font-bold text-slate-100">{value}</span>
    </div>
  );
}
  
export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
 
  const [product, setProduct] = useState<Bicicletta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
 
  useEffect(() => {
    if (!id) return;
    axios
      .get<Bicicletta>(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.error("Errore caricamento prodotto:", err))
      .finally(() => setIsLoading(false));
  }, [id]);
 
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm tracking-wide">Caricamento scheda...</p>
        </div>
      </main>
    );
  }
 
  if (!product) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-5xl mb-4">🚲</p>
          <p className="text-xl font-semibold text-slate-300">Prodotto non trovato</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 rounded-full border border-slate-700 text-sm hover:border-emerald-400 hover:text-emerald-400 transition-colors"
          >
            ← Torna al catalogo
          </button>
        </div>
      </main>
    );
  }
 
  const images: string[] =
    (product as any).immagini ?? (product as any).images ?? [];
  const prezzo: number | undefined =
    (product as any).prezzo ?? (product as any).price;
  const categoria: string | undefined =
    (product as any).categoria ?? (product as any).category;
  const descrizione: string | undefined =
    (product as any).descrizione ?? (product as any).description;
  const disponibile: boolean =
    (product as any).disponibile ?? (product as any).available ?? true;
 
  const skipKeys = new Set([
    "id", "nome", "name", "prezzo", "price", "descrizione", "description",
    "immagini", "images", "categoria", "category", "disponibile", "available",
    "createdAt", "updatedAt",
  ]);
 
  const stats = Object.entries(product as Record<string, unknown>)
    .filter(([k]) => !skipKeys.has(k))
    .slice(0, 6)
    .map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, " $1").toLowerCase(),
      value: String(v),
    }));
 
  const iconMap: Record<string, string> = {
    taglia: "📐", taille: "📐", size: "📐",
    peso: "⚖️", weight: "⚖️",
    velocità: "💨", velocita: "💨", speed: "💨",
    colore: "🎨", color: "🎨",
    telaio: "🔧", frame: "🔧",
    marce: "⚙️", gears: "⚙️",
    ruote: "⭕", wheels: "⭕",
    freni: "🛑", brakes: "🛑",
  };
 
  function getIcon(key: string) {
    const lower = key.toLowerCase();
    return Object.entries(iconMap).find(([k]) => lower.includes(k))?.[1] ?? "📋";
  }
 
  const productName = (product as any).nome ?? (product as any).name ?? "Bicicletta";
 
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>
 
      <div className="max-w-7xl mx-auto relative">
        <button
          onClick={() => router.back()}
          className="group mb-10 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
          Torna al catalogo
        </button>
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-800 border border-slate-700/60">
              {images.length > 0 ? (
                <img
                  src={images[activeImage]}
                  alt={productName}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl select-none">
                  🚲
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                    disponibile
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      disponibile ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  {disponibile ? "Disponibile" : "Non disponibile"}
                </span>
              </div>
            </div>
 
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === i
                        ? "border-emerald-400 scale-105"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <img src={src} alt={`vista ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
 
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
              {categoria && <Badge label={categoria} />}
              <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                {productName}
              </h1>
              {prezzo !== undefined && (
                <p className="mt-4 text-3xl font-bold text-slate-100">
                  €{Number(prezzo).toFixed(2)}
                  <span className="ml-2 text-base font-normal text-slate-500">/ giorno</span>
                </p>
              )}
            </div>
 
            {descrizione && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">
                  Descrizione
                </h2>
                <p className="text-slate-300 leading-relaxed text-base">{descrizione}</p>
              </div>
            )}
 
            {stats.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">
                  Specifiche
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stats.map(({ label, value }) => (
                    <StatCard
                      key={label}
                      icon={getIcon(label)}
                      label={label}
                      value={value}
                    />
                  ))}
                </div>
              </div>
            )}
 
            <div className="border-t border-slate-700/60" />
 
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => disponibile && setShowConfigurator(true)}
                disabled={!disponibile}
                className={`flex-1 py-4 px-8 rounded-2xl text-base font-bold tracking-wide transition-all duration-200 ${
                  disponibile
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                {disponibile ? "Configura e Prenota" : "Non Disponibile"}
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 sm:flex-none py-4 px-8 rounded-2xl border border-slate-700 text-slate-300 text-base font-semibold hover:border-slate-500 hover:text-slate-100 transition-colors"
              >
                Catalogo
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {showConfigurator && (
        <ProductConfigurator
          product={product}
          onClose={() => setShowConfigurator(false)}
        />
      )}
    </main>
  );
}
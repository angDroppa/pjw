'use client'

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { BiciclettaCatalog } from "@/lib/zodSchemas/bicicletta";
import ProductConfigurator from "../components/ProductConfigurator";

const tipologiaLabel: Record<string, string> = {
  CITY: "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL: "Gravel",
  ROAD: "Road Bike",
};

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

function formatValue(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    const labels = v.map((item: any) => item?.nome ?? item?.size ?? item?.tipo ?? null).filter(Boolean);
    return labels.length > 0 ? labels.join(", ") : null;
  }
  if (typeof v === "object") {
    const obj = v as Record<string, any>;
    return obj.nome ?? obj.size ?? obj.tipo ?? obj.name ?? null;
  }
  return null;
}

const iconMap: Record<string, string> = {
  type: "🚲",
  nome: "🚲",
  tipologia: "🏷️",
  size: "📐",
  taglia: "📐",
  prezzo: "💶",
  prezzoGiornata: "💶",
  prezzoMezzaGiornata: "💰",
  alimentazione: "⚡",
  peso: "⚖️",
  velocita: "💨",
  colore: "🎨",
  telaio: "🔧",
  marce: "⚙️",
  altezza: "📏",
};

function getIcon(key: string) {
  const lower = key.toLowerCase().replace(/\s/g, "");
  return Object.entries(iconMap).find(([k]) => lower.includes(k))?.[1] ?? "📋";
}

function ProductDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [product, setProduct] = useState<BiciclettaCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigurator, setShowConfigurator] = useState(false);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    axios
      .get<BiciclettaCatalog>(`/api/products/${id}`)
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
          <button onClick={() => router.back()} className="mt-6 px-6 py-2 rounded-full border border-slate-700 text-sm hover:border-emerald-400 hover:text-emerald-400 transition-colors">
            ← Torna al catalogo
          </button>
        </div>
      </main>
    );
  }

  const hasElettrica = product.specifics.some((s) => s.alimentazione === "ELETTRICA");
  const taglie = [...new Set(product.specifics.map((s) => s.size))];
  const prezzoMin = Math.min(...product.specifics.map((s) => s.prezzoGiornata));

  const specificheRaggruppate = product.specifics.reduce((acc, s) => {
    const key = s.size;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s.alimentazione === "ELETTRICA" ? "Elettrica" : "Muscolare");
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <button
          onClick={() => router.back()}
          className="group mb-10 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
          Torna al catalogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          <div className="flex flex-col gap-3">
            <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/60">
              <div className="w-full h-full flex items-center justify-center text-8xl select-none">
                {hasElettrica ? "⚡" : "🚲"}
              </div>
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Disponibile
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge label={tipologiaLabel[product.tipologia] ?? product.tipologia} />
                <Badge label={hasElettrica ? "Elettrica / Muscolare" : "Muscolare"} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                {product.nome}
              </h1>
            </div>

            {taglie.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Taglie disponibili</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(specificheRaggruppate).map(([size, alimentazioni]) => (
                    <span key={size} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-mono font-semibold flex flex-col items-center gap-1">
                      <span>{size}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{alimentazioni.join(" / ")}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Tariffe</h2>
              <p className="text-3xl font-extrabold text-emerald-400">da €{prezzoMin.toFixed(2)} / giorno</p>
            </div>

            <div className="border-t border-slate-700/60" />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfigurator(true)}
                className="flex-1 py-4 px-8 rounded-2xl text-base font-bold tracking-wide transition-all duration-200 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
              >
                Configura e Prenota
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
        <ProductConfigurator product={product} onClose={() => setShowConfigurator(false)} />
      )}
    </main>
  );
}

export default function ProductDetail() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </main>
    }>
      <ProductDetailInner />
    </Suspense>
  );
}

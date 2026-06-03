'use client'

import { useState } from "react";
import { Bicicletta } from "@/lib/schemas/bicicletta.schema";

interface ConfiguratorProps {
  product: Bicicletta;
  onClose: () => void;
}

export default function ProductConfigurator({ product, onClose }: ConfiguratorProps) {
  const [selectedTaglia, setSelectedTaglia] = useState("");
  const [selectedTipologia, setSelectedTipologia] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAccessori, setSelectedAccessori] = useState<number[]>([]);

  // Mock dei dati globali
  const locationsMock = [
    { id: 1, nome: "Sede Centrale - Piazza Duomo" },
    { id: 2, nome: "Hub Stazione Centrale" },
    { id: 3, nome: "Chiosco Parco Sempione" }
  ];

  const accessoriMock = [
    { id: 1, nome: "Casco Premium", prezzo: "Incluso" },
    { id: 2, nome: "Lucchetto Rinforzato", prezzo: "Incluso" },
    { id: 3, nome: "Seggiolino Bimbo", prezzo: "+5€" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animated fadeIn duration-200">
      
      {/* Sfondo cliccabile per chiudere il popup */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Finestra del Popup */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 z-10 text-left">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Configurazione</span>
            <h3 className="text-xl font-extrabold text-white">{product.modello?.nome}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); alert("Ordine salvato!"); onClose(); }} className="flex flex-col gap-4 text-sm">
          
          {/* Taglie */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">1. Scegli la tua Taglia:</label>
            <select required value={selectedTaglia} onChange={(e) => setSelectedTaglia(e.target.value)} className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 focus:border-emerald-400 outline-none">
              <option value="">Seleziona taglia...</option>
              {product.dimensioni?.map((d) => (
                <option key={d.id} value={d.taglia}>Taglia {d.taglia} ({d.numeroBiciclette} disponibili)</option>
              ))}
            </select>
          </div>

          {/* Tipologia */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">2. Tipologia / Motore:</label>
            <select required value={selectedTipologia} onChange={(e) => setSelectedTipologia(e.target.value)} className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 focus:border-emerald-400 outline-none">
              <option value="">Seleziona modalità...</option>
              {product.tipologie?.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">3. Punto di Ritiro (Pickup):</label>
            <select required value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 focus:border-emerald-400 outline-none">
              <option value="">Seleziona un Hub...</option>
              {locationsMock.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.nome}</option>
              ))}
            </select>
          </div>

          {/* Accessori */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">4. Accessori Extra:</label>
            <div className="grid grid-cols-1 gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              {accessoriMock.map((acc) => (
                <label key={acc.id} className="flex items-center gap-3 text-slate-300 cursor-pointer py-1 hover:text-white">
                  <input 
                    type="checkbox" 
                    checked={selectedAccessori.includes(acc.id)}
                    onChange={() => setSelectedAccessori(prev => prev.includes(acc.id) ? prev.filter(i => i !== acc.id) : [...prev, acc.id])}
                    className="w-4 h-4 accent-emerald-400 rounded"
                  />
                  <span>{acc.nome} <span className="text-xs text-slate-500">({acc.prezzo})</span></span>
                </label>
              ))}
            </div>
          </div>

          {/* Bottone di Invio */}
          <button type="submit" className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold py-3 rounded-lg mt-2 hover:opacity-90 active:scale-[0.99] transition shadow-lg shadow-emerald-500/10">
            Conferma Configurazione e Prenota
          </button>
        </form>

      </div>
    </div>
  );
}
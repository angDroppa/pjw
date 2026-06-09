"use client";

import { useEffect } from "react";
import { useConfiguratorStore } from "@/lib/store/configurator.store";
import type { BiciclettaResponse } from "@/lib/validators/bicicletta";
import { getAccessori } from "@/lib/axios/accessori";
import { getAssicurazioni } from "@/lib/axios/assicurazioni";
import StepBicicletta from "./stepbicicletta";
import StepDate from "./stepdate";
import StepDisponibilita from "./stepdisponibilita";
import StepAccessori from "./stepaccessori";
import StepAssicurazione from "./stepassicurazioni";
import StepRiepilogo from "./stepriepilogo";

const STEPS = ["Bicicletta", "Date", "Location", "Accessori", "Assicurazione", "Riepilogo"];

const tipologiaLabel: Record<string, string> = {
  CITY:     "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL:   "Gravel",
  ROAD:     "Road Bike",
};

interface Props {
  product: BiciclettaResponse;
  onClose: () => void;
}

export default function ProductConfigurator({ product, onClose }: Props) {
  const {
    step, setStep, nextStep, prevStep, reset,
    setAccessori, setLoadingAccessori,
    setAssicurazioni, setLoadingAssicurazioni,
  } = useConfiguratorStore();

  useEffect(() => { reset(); }, [product.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setLoadingAccessori(true);
    getAccessori()
      .then(setAccessori).catch(console.error)
      .finally(() => setLoadingAccessori(false));

    setLoadingAssicurazioni(true);
    getAssicurazioni()
      .then(setAssicurazioni).catch(console.error)
      .finally(() => setLoadingAssicurazioni(false));
  }, []);

  return (
    <div className="configurator-overlay animated fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="configurator-panel">
        <div className="configurator-header">
          <div>
            <span className="configurator-kicker">Configurazione</span>
            <h3 className="text-xl font-extrabold leading-tight mt-1">{product.nome}</h3>
            <p className="text-xs app-text-muted mt-0.5">
              {tipologiaLabel[product.tipologia] ?? product.tipologia}
            </p>
          </div>
          <button onClick={onClose} className="configurator-close">✕</button>
        </div>

        <div className="px-6 pt-5">
          <ul className="steps steps-horizontal w-full text-xs">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`step ${i <= step ? "step-primary" : ""}`}
                style={{ cursor: i < step ? "pointer" : "default" }}
                onClick={() => { if (i < step) setStep(i); }}
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
          {step === 0 && <StepBicicletta onNext={nextStep} />}
          {step === 1 && <StepDate onNext={nextStep} onPrev={prevStep} />}
          {step === 2 && <StepDisponibilita biciclettaId={product.id} onNext={nextStep} onPrev={prevStep} />}
          {step === 3 && <StepAccessori onNext={nextStep} onPrev={prevStep} />}
          {step === 4 && <StepAssicurazione onNext={nextStep} onPrev={prevStep} />}
          {step === 5 && <StepRiepilogo product={product} onPrev={prevStep} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
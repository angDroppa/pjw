import { create } from "zustand";
import { DisponibilitaResponse } from "../validators/biciclettaLocation";
import { AccessorioResponse } from "../validators/accessorio";
import { AssicurazioneResponse } from "../validators/assicurazione";

interface ConfiguratorState {
  step: number;

  dataRitiro:   string;
  oraRitiro:    string;
  dataConsegna: string;
  oraConsegna:  string;

  loadingDisp:           boolean;
  selectedSize:          string;
  selectedAlimentazione: "MUSCOLARE" | "ELETTRICA" | "";
  selectedDisponibilita: DisponibilitaResponse | null;

  accessori:         AccessorioResponse[];
  loadingAccessori:  boolean;
  selectedAccessori: number[];

  assicurazioni:        AssicurazioneResponse[];
  loadingAssicurazioni: boolean;
  selectedCoperturaId:  number | null;

  setStep:   (step: number) => void;
  nextStep:  () => void;
  prevStep:  () => void;
  setDate:   (field: "dataRitiro" | "oraRitiro" | "dataConsegna" | "oraConsegna", value: string) => void;

  setLoadingDisp:           (v: boolean) => void;
  setSelectedSize:          (size: string) => void;
  setSelectedAlimentazione: (alim: "MUSCOLARE" | "ELETTRICA" | "") => void;
  setSelectedDisponibilita: (d: DisponibilitaResponse | null) => void;

  setAccessori:        (data: AccessorioResponse[]) => void;
  setLoadingAccessori: (v: boolean) => void;
  toggleAccessorio:    (id: number) => void;

  setAssicurazioni:        (data: AssicurazioneResponse[]) => void;
  setLoadingAssicurazioni: (v: boolean) => void;
  setSelectedCoperturaId:  (id: number | null) => void;

  reset: () => void;
}

const initialState = {
  step:                  0,
  dataRitiro:            "",
  oraRitiro:             "10:00",
  dataConsegna:          "",
  oraConsegna:           "10:00",
  loadingDisp:           false,
  selectedSize:          "",
  selectedAlimentazione: "" as const,
  selectedDisponibilita: null,
  accessori:             [],
  loadingAccessori:      true,
  selectedAccessori:     [],
  assicurazioni:         [],
  loadingAssicurazioni:  true,
  selectedCoperturaId:   null,
};

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  ...initialState,

  setStep:  (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 5) })), // 6 step, max index 5
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),

  // cambiare le date invalida solo la disponibilità, non taglia/alimentazione
  setDate: (field, value) => set({
    [field]: value,
    selectedDisponibilita: null,
  }),

  setLoadingDisp: (v) => set({ loadingDisp: v }),

  // cambiare taglia invalida solo la disponibilità, alimentazione rimane
  setSelectedSize: (size) => set({
    selectedSize: size,
    selectedDisponibilita: null,
  }),

  // cambiare alimentazione invalida solo la disponibilità
  setSelectedAlimentazione: (alim) => set({
    selectedAlimentazione: alim,
    selectedDisponibilita: null,
  }),

  setSelectedDisponibilita: (d) => set({ selectedDisponibilita: d }),

  setAccessori:        (data) => set({ accessori: data }),
  setLoadingAccessori: (v)    => set({ loadingAccessori: v }),
  toggleAccessorio:    (id)   => set((s) => ({
    selectedAccessori: s.selectedAccessori.includes(id)
      ? s.selectedAccessori.filter((i) => i !== id)
      : [...s.selectedAccessori, id],
  })),

  setAssicurazioni:        (data) => set({ assicurazioni: data }),
  setLoadingAssicurazioni: (v)    => set({ loadingAssicurazioni: v }),
  setSelectedCoperturaId:  (id)   => set({ selectedCoperturaId: id }),

  reset: () => set(initialState),
}));
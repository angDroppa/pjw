"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { prenotazioneApi } from "@/lib/axios/prenotazione";
import {
  PrenotazioneResponse,
  UpdatePrenotazioneCliente,
} from "@/lib/validators/prenotazione";

import toast from "react-hot-toast";
import ModificaPrenotazioneForm from "@/app/components/forms/updatePrenotazione.form";
import Modal, { ModalHandle } from "@/app/components/modal";

type StatoPrenotazione = PrenotazioneResponse["stato"];

const statoLabel: Record<StatoPrenotazione, string> = {
  PENDING: "In attesa",
  PICKED_UP: "In corso",
  RETURNED: "Completata",
  LATE: "In ritardo",
};

const statColor: Record<StatoPrenotazione, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  PICKED_UP: "bg-blue-500/20 text-blue-400",
  RETURNED: "bg-emerald-500/20 text-emerald-400",
  LATE: "bg-red-500/20 text-red-400",
};

const alimentazioneLabel: Record<
  PrenotazioneResponse["alimentazione"],
  string
> = {
  MUSCOLARE: "🚲 Muscolare",
  ELETTRICA: "⚡ Elettrica",
};

function giorniAlRitiro(dataRitiro: string): number {
  return Math.ceil(
    (new Date(dataRitiro).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [prenotazioni, setPrenotazioni] = useState<PrenotazioneResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PrenotazioneResponse | null>(null);
  // const modalRef = useRef<ModalHandle>(null)
  const modalRef = useRef<ModalHandle>(null);

  useEffect(() => {
    prenotazioneApi
      .getPrenotazioni()
      .then(setPrenotazioni)
      .catch(() => toast.error("Errore caricamento prenotazioni"))
      .finally(() => setLoading(false));
  }, []);

  const nomeUtente = prenotazioni[0]?.utente.firstName ?? "";

  const openEdit = (p: PrenotazioneResponse) => {
    setEditing(p);
    modalRef.current?.open();
  };

  const closeEdit = () => {
    setEditing(null);
    modalRef.current?.close();
  };

  const handleSave = async (data: UpdatePrenotazioneCliente) => {
    if (!editing) return;
    try {
      const updated = await prenotazioneApi.updatePrenotazione(
        editing.id,
        data,
      );
      setPrenotazioni((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      closeEdit();
      toast.success("Prenotazione aggiornata!");
    } catch {
      toast.error("Errore durante la modifica");
    }
  };

  const handleCancella = async (id: number) => {
    if (!confirm("Cancellare questa prenotazione?")) return;
    try {
      await prenotazioneApi.cancellaPrenotazione(id);
      setPrenotazioni((prev) => prev.filter((p) => p.id !== id));
      toast.success("Prenotazione cancellata");
    } catch {
      toast.error("Errore durante la cancellazione");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-slate-500">Caricamento...</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Ciao, {nomeUtente}!</h1>
            <p className="text-slate-400 mb-8">Gestisci le tue prenotazioni.</p>

            {prenotazioni.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🚲</p>
                <p className="text-slate-400 mb-4">
                  Nessuna prenotazione trovata.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-lg"
                >
                  Sfoglia il catalogo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {[...prenotazioni]
                  .sort(
                    (a, b) =>
                      new Date(b.dataCreazione).getTime() -
                      new Date(a.dataCreazione).getTime(),
                  )
                  .map((p) => {
                    const giorni = giorniAlRitiro(p.dataRitiro);
                    const puoModificare = p.stato === "PENDING" && giorni >= 2;

                    return (
                      <div
                        key={p.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">
                              Taglia {p.bicicletta.size} —{" "}
                              {alimentazioneLabel[p.alimentazione]}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {p.location.nome}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${statColor[p.stato]}`}
                          >
                            {statoLabel[p.stato]}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                          <div>
                            <span className="text-slate-500">Ritiro:</span>
                            <p>
                              {new Date(p.dataRitiro).toLocaleDateString()}{" "}
                              {p.oraRitiro}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Riconsegna:</span>
                            <p>
                              {new Date(p.dataConsegna).toLocaleDateString()}{" "}
                              {p.oraConsegna}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Assicurazione:
                            </span>
                            <p>{p.copertura.tipo}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Totale:</span>
                            <p className="font-bold text-emerald-400">
                              €{Number(p.totalePagato).toFixed(2)}
                            </p>
                          </div>
                          {p.accessori.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-slate-500">Accessori:</span>
                              <p>{p.accessori.map((a) => a.nome).join(", ")}</p>
                            </div>
                          )}
                        </div>

                        {puoModificare && (
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-sm text-blue-400 hover:text-blue-300 transition"
                            >
                              Modifica
                            </button>
                            <button
                              onClick={() => handleCancella(p.id)}
                              className="text-sm text-red-400 hover:text-red-300 transition"
                            >
                              Cancella
                            </button>
                          </div>
                        )}

                        {!puoModificare &&
                          p.stato === "PENDING" &&
                          giorni < 2 && (
                            <p className="text-xs text-slate-500 mt-3">
                              Modifica e cancellazione non disponibili (meno di
                              2 giorni al ritiro)
                            </p>
                          )}
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        ref={modalRef}
        title={`Modifica prenotazione #${editing?.id ?? ""}`}
      >
        {editing && (
          <ModificaPrenotazioneForm
            key={editing.id}
            prenotazione={editing}
            onSave={handleSave}
            onCancel={closeEdit}
          />
        )}
      </Modal>
    </div>
  );
}

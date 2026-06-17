"use client";

import { useState, useEffect } from "react";
import { backofficeApi } from "@/lib/axios/backoffice";
import {
  PrenotazioneResponse,
  UpdatePrenotazioneSchema,
} from "@/lib/validators/prenotazione";
import {
  Toast,
  Card,
  Btn,
  Field,
  Inp,
  Modal,
  SectionTitle,
} from "../components/ui";

type StatoPrenotazione = PrenotazioneResponse["stato"];

const statoLabel: Record<StatoPrenotazione, string> = {
  PENDING: "In attesa",
  PICKED_UP: "In corso",
  RETURNED: "Completata",
  LATE: "In ritardo",
  DAMAGED: "Danneggiata",
};

const statColor: Record<StatoPrenotazione, string> = {
  PENDING: "#f59e0b",
  PICKED_UP: "#3b82f6",
  RETURNED: "#10b981",
  LATE: "#ef4444",
  DAMAGED: "red",
};

const alimentazioneLabel: Record<
  PrenotazioneResponse["alimentazione"],
  string
> = {
  MUSCOLARE: "Muscolare",
  ELETTRICA: "Elettrica",
};

export default function PrenotazioniPage() {
  const [prenotazioni, setPrenotazioni] = useState<PrenotazioneResponse[]>([]);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  const [detail, setDetail] = useState<PrenotazioneResponse | null>(null);

  const [filtroUtente, setFiltroUtente] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const handleReminders = async () => {
    try {
      const { inviati } = await backofficeApi.sendReminders();
      setToast({
        msg:
          inviati > 0
            ? `${inviati} promemoria inviati`
            : "Nessuna prenotazione da notificare",
        type: "ok",
      });
    } catch {
      setToast({ msg: "Errore invio promemoria", type: "err" });
    }
  };

  useEffect(() => {
    let cancelled = false;
    backofficeApi
      .getPrenotazioni({
        utente: filtroUtente || undefined,
        data: filtroData || undefined,
      })
      .then((data) => {
        if (!cancelled) setPrenotazioni(data);
      })
      .catch(() => {
        if (!cancelled) setToast({ msg: "Errore caricamento", type: "err" });
      });
    return () => {
      cancelled = true;
    };
  }, [filtroUtente, filtroData]);

  const handleStato = async (id: number, stato: StatoPrenotazione) => {
    try {
      await backofficeApi.updateStatoPrenotazione(
        id,
        UpdatePrenotazioneSchema.parse({ stato }),
      );
      setPrenotazioni((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stato } : p)),
      );
      setToast({
        msg: `Stato aggiornato a "${statoLabel[stato]}"`,
        type: "ok",
      });
    } catch {
      setToast({ msg: "Errore aggiornamento", type: "err" });
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionTitle>Prenotazioni</SectionTitle>

        {/* FILTRI */}
        <Card>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <Field label="Utente">
              <Inp
                value={filtroUtente}
                onChange={setFiltroUtente}
                placeholder="Nome o cognome..."
              />
            </Field>
            <Field label="Data ritiro">
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  colorScheme: "dark",
                }}
              />
            </Field>
            <Btn
              variant="ghost"
              onClick={() => {
                setFiltroUtente("");
                setFiltroData("");
              }}
            >
              Reset
            </Btn>
            <Btn onClick={handleReminders}>📧 Invia promemoria</Btn>
          </div>
        </Card>

        {/* LISTA */}
        {prenotazioni.length === 0 ? (
          <Card>
            <p
              style={{
                color: "var(--text-secondary)",
                textAlign: "center",
                padding: 40,
              }}
            >
              Nessuna prenotazione trovata.
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prenotazioni.map((p) => (
              <Card key={p.id}>
                {/* Header card */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "var(--text-primary)",
                      }}
                    >
                      #{p.id} — {p.utente.firstName} {p.utente.lastName}
                    </span>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 99,
                        background: `${statColor[p.stato]}20`,
                        color: statColor[p.stato],
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {statoLabel[p.stato]}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--text-primary)",
                    }}
                  >
                    €{Number(p.totalePagato).toFixed(2)}
                  </span>
                </div>

                {/* Info grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "8px 16px",
                    marginBottom: 14,
                  }}
                >
                  <InfoRow label="Bici" value={p.bicicletta.size} />
                  <InfoRow
                    label="Alimentazione"
                    value={alimentazioneLabel[p.alimentazione]}
                  />
                  <InfoRow label="Location" value={p.location.nome} />
                  <InfoRow
                    label="Ritiro"
                    value={`${new Date(p.dataRitiro).toLocaleDateString()} ${p.oraRitiro}`}
                  />
                  <InfoRow
                    label="Consegna"
                    value={`${new Date(p.dataConsegna).toLocaleDateString()} ${p.oraConsegna}`}
                  />
                </div>

                {/* Azioni */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn small onClick={() => setDetail(p)}>
                    👁 Dettagli
                  </Btn>
                  {p.stato === "PENDING" && (
                    <Btn small onClick={() => handleStato(p.id, "PICKED_UP")}>
                      ✅ Ritirata
                    </Btn>
                  )}
                  {p.stato === "PICKED_UP" && (
                    <Btn small onClick={() => handleStato(p.id, "RETURNED")}>
                      🔄 Consegnata
                    </Btn>
                  )}
                  {p.stato === "PICKED_UP" && (
                    <Btn
                      small
                      variant="warning"
                      onClick={() => handleStato(p.id, "DAMAGED")}
                    >
                      🚨 Danneggiata
                    </Btn>
                  )}
                  {(p.stato === "PICKED_UP" || p.stato === "PENDING") && (
                    <Btn
                      small
                      variant="warning"
                      onClick={() => handleStato(p.id, "LATE")}
                    >
                      ⚠️ In ritardo
                    </Btn>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETTAGLIO */}
      {detail && (
        <Modal
          title={`Prenotazione #${detail.id}`}
          onClose={() => setDetail(null)}
          maxWidth={500}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 13,
            }}
          >
            <InfoRow
              label="Utente"
              value={`${detail.utente.firstName} ${detail.utente.lastName} (${detail.utente.email})`}
            />
            <InfoRow label="Bicicletta" value={detail.bicicletta.size} />
            <InfoRow
              label="Alimentazione"
              value={alimentazioneLabel[detail.alimentazione]}
            />
            <InfoRow
              label="Location"
              value={`${detail.location.nome} — ${detail.location.indirizzo}`}
            />
            <InfoRow
              label="Ritiro"
              value={`${new Date(detail.dataRitiro).toLocaleDateString()} ${detail.oraRitiro}`}
            />
            <InfoRow
              label="Consegna"
              value={`${new Date(detail.dataConsegna).toLocaleDateString()} ${detail.oraConsegna}`}
            />
            <InfoRow label="Assicurazione" value={detail.copertura.tipo} />
            <InfoRow
              label="Accessori"
              value={
                detail.accessori.length
                  ? detail.accessori.map((a) => a.nome).join(", ")
                  : "Nessuno"
              }
            />
            <InfoRow label="Stato" value={statoLabel[detail.stato]} />
            {detail.noteRiconsegna && (
              <InfoRow label="Note riconsegna" value={detail.noteRiconsegna} />
            )}
            {detail.danni && <InfoRow label="Danni" value={detail.danni} />}
            <InfoRow
              label="Totale"
              value={`€${Number(detail.totalePagato).toFixed(2)}`}
            />
          </div>
        </Modal>
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { getRiparazioni, updateRiparazione, segnaRientrataRiparazione } from "@/lib/axios/riparazione";
import { RiparazioneResponse, UpdateRiparazioneSchema } from "@/lib/validators/riparazione";
import {
  Toast,
  Card,
  Btn,
  Field,
  Inp,
  Modal,
  SectionTitle,
} from "../components/ui";

const statoColor = (aperta: boolean) => (aperta ? "#f59e0b" : "#10b981");
const statoLabel = (aperta: boolean) => (aperta ? "Aperta" : "Chiusa");

export default function RiparazioniPage() {
  const [riparazioni, setRiparazioni] = useState<RiparazioneResponse[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [detail, setDetail] = useState<RiparazioneResponse | null>(null);
  const [editTarget, setEditTarget] = useState<RiparazioneResponse | null>(null);

  // Form edit
  const [editMotivo, setEditMotivo] = useState("");
  const [editCosto, setEditCosto] = useState("");
  const [editDataFine, setEditDataFine] = useState("");

  // Filtri
  const [filtroStato, setFiltroStato] = useState<"" | "aperta" | "chiusa">("");

  useEffect(() => {
    getRiparazioni()
      .then(setRiparazioni)
      .catch(() => setToast({ msg: "Errore caricamento", type: "err" }));
  }, []);

  const filtered = riparazioni.filter((r) => {
    if (filtroStato === "aperta") return r.aperta;
    if (filtroStato === "chiusa") return !r.aperta;
    return true;
  });

  const openEdit = (r: RiparazioneResponse) => {
    setEditTarget(r);
    setEditMotivo(r.motivo ?? "");
    setEditCosto(r.costo != null ? String(r.costo) : "");
    setEditDataFine(r.dataFine ? r.dataFine.slice(0, 10) : "");
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      const payload = UpdateRiparazioneSchema.parse({
        motivo: editMotivo || undefined,
        costo: editCosto ? Number(editCosto) : undefined,
        dataFine: editDataFine ? new Date(editDataFine) : undefined,
      });
      const updated = await updateRiparazione(editTarget.id, payload);
      setRiparazioni((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setEditTarget(null);
      setToast({ msg: "Riparazione aggiornata", type: "ok" });
    } catch {
      setToast({ msg: "Errore aggiornamento", type: "err" });
    }
  };

  const handleRientrata = async (id: number) => {
    try {
      const updated = await segnaRientrataRiparazione(id);
      setRiparazioni((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setToast({ msg: "Bici segnata come rientrata", type: "ok" });
    } catch {
      setToast({ msg: "Errore aggiornamento", type: "err" });
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionTitle>Riparazioni</SectionTitle>

        {/* FILTRI */}
        <Card>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <Field label="Stato">
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value as typeof filtroStato)}
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
              >
                <option value="">Tutti</option>
                <option value="aperta">Aperte</option>
                <option value="chiusa">Chiuse</option>
              </select>
            </Field>
            <Btn variant="ghost" onClick={() => setFiltroStato("")}>
              Reset
            </Btn>
          </div>
        </Card>

        {/* LISTA */}
        {filtered.length === 0 ? (
          <Card>
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 40 }}>
              Nessuna riparazione trovata.
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((r) => (
              <Card key={r.id}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "var(--text-primary)",
                      }}
                    >
                      #{r.id} — {r.biciclettaLocation.biciclettaSpecific?.size ?? "Bici"} @{" "}
                      {r.biciclettaLocation.location?.nome ?? "—"}
                    </span>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 99,
                        background: `${statoColor(r.aperta)}20`,
                        color: statoColor(r.aperta),
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {statoLabel(r.aperta)}
                    </span>
                  </div>
                  {r.costo != null && (
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "var(--text-primary)",
                      }}
                    >
                      €{Number(r.costo).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Info grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "8px 16px",
                    marginBottom: 14,
                  }}
                >
                  <InfoRow label="Motivo" value={r.motivo} />
                  <InfoRow
                    label="Inizio"
                    value={new Date(r.dataInizio).toLocaleDateString()}
                  />
                  <InfoRow
                    label="Fine"
                    value={r.dataFine ? new Date(r.dataFine).toLocaleDateString() : "—"}
                  />
                  {r.prenotazioneId && (
                    <InfoRow label="Prenotazione" value={`#${r.prenotazioneId}`} />
                  )}
                </div>

                {/* Azioni */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn small onClick={() => setDetail(r)}>
                    👁 Dettagli
                  </Btn>
                  <Btn small onClick={() => openEdit(r)}>
                    ✏️ Modifica
                  </Btn>
                  {r.aperta && (
                    <Btn small onClick={() => handleRientrata(r.id)}>
                      ✅ Segna rientrata
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
          title={`Riparazione #${detail.id}`}
          onClose={() => setDetail(null)}
          maxWidth={500}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <InfoRow
              label="Bicicletta"
              value={detail.biciclettaLocation.biciclettaSpecific?.size ?? "—"}
            />
            <InfoRow
              label="Location"
              value={
                detail.biciclettaLocation.location
                  ? `${detail.biciclettaLocation.location.nome} — ${detail.biciclettaLocation.location.indirizzo}`
                  : "—"
              }
            />
            <InfoRow label="Motivo" value={detail.motivo} />
            <InfoRow
              label="Costo"
              value={detail.costo != null ? `€${Number(detail.costo).toFixed(2)}` : "Non definito"}
            />
            <InfoRow
              label="Inizio"
              value={new Date(detail.dataInizio).toLocaleDateString()}
            />
            <InfoRow
              label="Fine"
              value={detail.dataFine ? new Date(detail.dataFine).toLocaleDateString() : "—"}
            />
            <InfoRow label="Stato" value={statoLabel(detail.aperta)} />
            {detail.prenotazione && (
              <InfoRow
                label="Prenotazione collegata"
                value={`#${detail.prenotazione.id} — ${detail.prenotazione.utente.firstName} ${detail.prenotazione.utente.lastName}`}
              />
            )}
          </div>
        </Modal>
      )}

      {/* MODAL MODIFICA */}
      {editTarget && (
        <Modal
          title={`Modifica Riparazione #${editTarget.id}`}
          onClose={() => setEditTarget(null)}
          maxWidth={420}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Motivo">
              <Inp value={editMotivo} onChange={setEditMotivo} placeholder="Es. Graffio sul telaio" />
            </Field>
            <Field label="Costo (€)">
              <Inp
                value={editCosto}
                onChange={setEditCosto}
                placeholder="Es. 120.00"
              />
            </Field>
            <Field label="Data fine">
              <input
                type="date"
                value={editDataFine}
                onChange={(e) => setEditDataFine(e.target.value)}
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
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setEditTarget(null)}>
                Annulla
              </Btn>
              <Btn onClick={handleUpdate}>Salva</Btn>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
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
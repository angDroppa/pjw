"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdatePrenotazioneClienteSchema,
  UpdatePrenotazioneCliente,
  PrenotazioneResponse,
} from "@/lib/validators/prenotazione";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";
import { AssicurazioneResponse } from "@/lib/validators/assicurazione";
import { AccessorioResponse } from "@/lib/validators/accessorio";
import { getAllBiciclette } from "@/lib/axios/bicicletta";
import { getAccessori } from "@/lib/axios/accessori";
import { getAssicurazioni } from "@/lib/axios/assicurazioni";

interface Props {
  prenotazione: PrenotazioneResponse;
  onSave: (data: UpdatePrenotazioneCliente) => Promise<void>;
  onCancel: () => void;
}

export default function ModificaPrenotazioneForm({
  prenotazione: p,
  onSave,
  onCancel,
}: Props) {
  const [biciclette, setBiciclette] = useState<BiciclettaResponse[]>([]);
  const [assicurazioni, setAssicurazioni] = useState<AssicurazioneResponse[]>(
    [],
  );
  const [accessori, setAccessori] = useState<AccessorioResponse[]>([]);
  const [loadingDati, setLoadingDati] = useState(true);

  useEffect(() => {
    Promise.all([getAllBiciclette(), getAssicurazioni(), getAccessori()])
      .then(([b, a, ac]) => {
        setBiciclette(b);
        setAssicurazioni(a);
        setAccessori(ac);
      })
      .finally(() => setLoadingDati(false));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePrenotazioneCliente>({
    resolver: zodResolver(UpdatePrenotazioneClienteSchema),
    defaultValues: {
      dataRitiro: p.dataRitiro.slice(0, 10),
      oraRitiro: p.oraRitiro,
      dataConsegna: p.dataConsegna.slice(0, 10),
      oraConsegna: p.oraConsegna,
      alimentazione: p.alimentazione,
      note: p.note ?? "",
      biciclettaId: p.bicicletta.id,
      locationId: p.location.id,
      coperturaId: p.copertura.id,
      accessoriIds: p.accessori.map((a) => a.id),
    },
  });

  if (loadingDati)
    return <p className="text-slate-400 text-sm">Caricamento...</p>;

  // location disponibili per la bici selezionata — per ora mostriamo solo quella attuale
  // (per un configuratore completo servirebbe l'endpoint disponibilita)

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Data ritiro</legend>
          <input
            type="date"
            className={`input w-full ${errors.dataRitiro ? "input-error" : ""}`}
            {...register("dataRitiro")}
            style={{ colorScheme: "dark" }}
          />
          {errors.dataRitiro && (
            <p className="fieldset-label text-error">
              {errors.dataRitiro.message}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Ora ritiro</legend>
          <input
            type="time"
            className={`input w-full ${errors.oraRitiro ? "input-error" : ""}`}
            {...register("oraRitiro")}
          />
          {errors.oraRitiro && (
            <p className="fieldset-label text-error">
              {errors.oraRitiro.message}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Data consegna</legend>
          <input
            type="date"
            className={`input w-full ${errors.dataConsegna ? "input-error" : ""}`}
            {...register("dataConsegna")}
            style={{ colorScheme: "dark" }}
          />
          {errors.dataConsegna && (
            <p className="fieldset-label text-error">
              {errors.dataConsegna.message}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Ora consegna</legend>
          <input
            type="time"
            className={`input w-full ${errors.oraConsegna ? "input-error" : ""}`}
            {...register("oraConsegna")}
          />
          {errors.oraConsegna && (
            <p className="fieldset-label text-error">
              {errors.oraConsegna.message}
            </p>
          )}
        </fieldset>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Alimentazione</legend>
        <select
          className={`select w-full ${errors.alimentazione ? "select-error" : ""}`}
          {...register("alimentazione")}
        >
          <option value="MUSCOLARE">🚲 Muscolare</option>
          <option value="ELETTRICA">⚡ Elettrica</option>
        </select>
        {errors.alimentazione && (
          <p className="fieldset-label text-error">
            {errors.alimentazione.message}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Bicicletta</legend>
        <select
          className={`select w-full ${errors.biciclettaId ? "select-error" : ""}`}
          {...register("biciclettaId", { valueAsNumber: true })}
        >
          {biciclette.flatMap((b) =>
            b.specifics.map((s) => (
              <option key={s.id} value={s.id}>
                {b.nome} — {s.size}
              </option>
            )),
          )}
        </select>
        {errors.biciclettaId && (
          <p className="fieldset-label text-error">
            {errors.biciclettaId.message}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Assicurazione</legend>
        <select
          className={`select w-full ${errors.coperturaId ? "select-error" : ""}`}
          {...register("coperturaId", { valueAsNumber: true })}
        >
          {assicurazioni.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tipo} — €{Number(a.prezzo).toFixed(2)}
            </option>
          ))}
        </select>
        {errors.coperturaId && (
          <p className="fieldset-label text-error">
            {errors.coperturaId.message}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Accessori</legend>
        <Controller
          control={control}
          name="accessoriIds"
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              {accessori.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    value={a.id}
                    checked={field.value?.includes(a.id) ?? false}
                    onChange={(e) => {
                      const ids = field.value ?? [];
                      field.onChange(
                        e.target.checked
                          ? [...ids, a.id]
                          : ids.filter((id) => id !== a.id),
                      );
                    }}
                  />
                  {a.nome} — €{Number(a.prezzo).toFixed(2)}
                </label>
              ))}
            </div>
          )}
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Note</legend>
        <textarea className="textarea w-full" rows={2} {...register("note")} />
      </fieldset>

      <div className="flex gap-3 justify-end mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-white transition px-4 py-2"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-500 text-black font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Salva"
          )}
        </button>
      </div>
    </form>
  );
}

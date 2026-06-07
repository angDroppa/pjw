"use client"

import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { createPrenotazione } from "@/lib/axios/prenotazione"
import { PrenotazioneInputSchema, PrenotazioneInput } from "@/lib/validators/prenotazione"

export default function PrenotazioneForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrenotazioneInput>({
    resolver: zodResolver(PrenotazioneInputSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: PrenotazioneInput) => {
    try {
      await createPrenotazione(data)
      toast.success("Prenotazione creata!")
      reset()
      onSuccess()
    } catch {}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-1">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Data ritiro</legend>
          <input
            type="date"
            className={`input w-full ${errors.dataRitiro ? "input-error" : ""}`}
            {...register("dataRitiro")}
          />
          {errors.dataRitiro && <p className="fieldset-label text-error">{errors.dataRitiro.message}</p>}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Ora ritiro</legend>
          <input
            type="time"
            className={`input w-full ${errors.oraRitiro ? "input-error" : ""}`}
            {...register("oraRitiro")}
          />
          {errors.oraRitiro && <p className="fieldset-label text-error">{errors.oraRitiro.message}</p>}
        </fieldset>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Data consegna</legend>
          <input
            type="date"
            className={`input w-full ${errors.dataConsegna ? "input-error" : ""}`}
            {...register("dataConsegna")}
          />
          {errors.dataConsegna && <p className="fieldset-label text-error">{errors.dataConsegna.message}</p>}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Ora consegna</legend>
          <input
            type="time"
            className={`input w-full ${errors.oraConsegna ? "input-error" : ""}`}
            {...register("oraConsegna")}
          />
          {errors.oraConsegna && <p className="fieldset-label text-error">{errors.oraConsegna.message}</p>}
        </fieldset>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Alimentazione</legend>
        <select
          className={`select w-full ${errors.alimentazione ? "select-error" : ""}`}
          {...register("alimentazione")}
        >
          <option value="">Seleziona</option>
          <option value="MUSCOLARE">Muscolare</option>
          <option value="ELETTRICA">Elettrica</option>
        </select>
        {errors.alimentazione && <p className="fieldset-label text-error">{errors.alimentazione.message}</p>}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Bicicletta ID</legend>
          <input
            type="number"
            className={`input w-full ${errors.biciclettaId ? "input-error" : ""}`}
            {...register("biciclettaId", { valueAsNumber: true })}
          />
          {errors.biciclettaId && <p className="fieldset-label text-error">{errors.biciclettaId.message}</p>}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Location ID</legend>
          <input
            type="number"
            className={`input w-full ${errors.locationId ? "input-error" : ""}`}
            {...register("locationId", { valueAsNumber: true })}
          />
          {errors.locationId && <p className="fieldset-label text-error">{errors.locationId.message}</p>}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Copertura ID</legend>
          <input
            type="number"
            className={`input w-full ${errors.coperturaId ? "input-error" : ""}`}
            {...register("coperturaId", { valueAsNumber: true })}
          />
          {errors.coperturaId && <p className="fieldset-label text-error">{errors.coperturaId.message}</p>}
        </fieldset>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Note</legend>
        <textarea className="textarea w-full" {...register("note")} />
      </fieldset>

      <button type="submit" className="btn btn-primary w-full mt-2" disabled={isSubmitting}>
        {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : "Prenota"}
      </button>

    </form>
  )
}
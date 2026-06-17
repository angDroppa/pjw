import { RiparazioneResponse, RiparazioneResponseSchema, UpdateRiparazione } from "../validators/riparazione";
import api from "./index";
import { z } from "zod";

export async function getRiparazioni(): Promise<RiparazioneResponse[]> {
  const res = await api.get<{ riparazioni: RiparazioneResponse[] }>("/riparazioni");
  return z.array(RiparazioneResponseSchema).parse(res.data.riparazioni);
}

export async function updateRiparazione(id: number, data: UpdateRiparazione): Promise<RiparazioneResponse> {
  const res = await api.patch<RiparazioneResponse>(`/riparazioni/${id}`, data);
  return RiparazioneResponseSchema.parse(res.data);
}

export async function segnaRientrataRiparazione(id: number): Promise<RiparazioneResponse> {
  const res = await api.put<RiparazioneResponse>(`/riparazioni/${id}`);
  return RiparazioneResponseSchema.parse(res.data);
}
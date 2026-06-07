import api from "@/lib/axios";
import { DisponibilitaResponse, DisponibilitaQuery } from "@/lib/validators/biciclettaLocation";

export const getDisponibilita = async (params: DisponibilitaQuery): Promise<DisponibilitaResponse[]> => {
  const res = await api.get<{ disponibilita: DisponibilitaResponse[] }>("/disponibilita", { params });
  return res.data.disponibilita;
};
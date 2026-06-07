import api from "@/lib/axios";
import { AssicurazioneResponse } from "@/lib/validators/assicurazione";

export const getAssicurazioni = async (): Promise<AssicurazioneResponse[]> => {
  const res = await api.get<{ assicurazioni: AssicurazioneResponse[] }>("/assicurazioni");
  return res.data.assicurazioni;
};
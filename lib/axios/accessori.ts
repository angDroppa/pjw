import api from "@/lib/axios";
import { AccessorioResponse } from "@/lib/validators/accessorio";

export const getAccessori = async (): Promise<AccessorioResponse[]> => {
  const res = await api.get<{ accessori: AccessorioResponse[] }>("/accessori");
  return res.data.accessori;
};
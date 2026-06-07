import api from "@/lib/axios";
import { BiciclettaResponse } from "../validators/bicicletta";

export const getAllBiciclette = async (): Promise<BiciclettaResponse[]> => {
  const res = await api.get<{ biciclette: BiciclettaResponse[] }>("/bicicletta");
  return res.data.biciclette;
};

export const getBiciclettaById = async (
  id: number
): Promise<BiciclettaResponse> => {
  const res = await api.get<BiciclettaResponse>(`/bicicletta/${id}`);
  return res.data;
};



// export const createBicicletta = async (data: CreateBicicletta): Promise<BiciclettaResponse> => {
//   const res = await api.post<{ bicicletta: BiciclettaResponse }>("/bicicletta", data);
//   return res.data.bicicletta;
// };

// export const updateBicicletta = async (id: number, data: UpdateBicicletta): Promise<BiciclettaResponse> => {
//   const res = await api.patch<{ bicicletta: BiciclettaResponse }>(`/bicicletta/${id}`, data);
//   return res.data.bicicletta;
// };

// export const deleteBicicletta = async (id: number): Promise<void> => {
//   await api.delete(`/bicicletta/${id}`);
// };
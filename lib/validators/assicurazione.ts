import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const AssicurazioneResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  tipo: z.string().openapi({ example: "Base" }),
  dettagli: z.string().openapi({ example: "Copertura danni base" }),
  prezzo: z.number().openapi({ example: 10.00 }),
}).openapi("AssicurazioneResponse");

export const CreateAssicurazioneSchema = z.object({
  tipo: z.string().min(1).openapi({ example: "Base" }),
  dettagli: z.string().min(1).openapi({ example: "Copertura danni base" }),
  prezzo: z.number().min(0).openapi({ example: 10.00 }),
}).openapi("CreateAssicurazione");

export const UpdateAssicurazioneSchema = z.object({
  tipo: z.string().min(1).optional().openapi({ example: "Premium" }),
  dettagli: z.string().min(1).optional().openapi({ example: "Copertura danni completa" }),
  prezzo: z.number().min(0).optional().openapi({ example: 20.00 }),
}).openapi("UpdateAssicurazione");

export type AssicurazioneResponse = z.infer<typeof AssicurazioneResponseSchema>;
export type CreateAssicurazione = z.infer<typeof CreateAssicurazioneSchema>;
export type UpdateAssicurazione = z.infer<typeof UpdateAssicurazioneSchema>;
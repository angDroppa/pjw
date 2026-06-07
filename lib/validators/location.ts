import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const LocationResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  nome: z.string().openapi({ example: "Sede Centrale" }),
  indirizzo: z.string().openapi({ example: "Via Roma 1, Milano" }),
}).openapi("LocationResponse");

export const CreateLocationSchema = z.object({
  nome: z.string().min(1).openapi({ example: "Sede Centrale" }),
  indirizzo: z.string().min(1).openapi({ example: "Via Roma 1, Milano" }),
}).openapi("CreateLocation");

export const UpdateLocationSchema = z.object({
  nome: z.string().min(1).optional().openapi({ example: "Sede Nord" }),
  indirizzo: z.string().min(1).optional().openapi({ example: "Via Torino 5, Milano" }),
}).openapi("UpdateLocation");

export type LocationResponse = z.infer<typeof LocationResponseSchema>;
export type CreateLocation = z.infer<typeof CreateLocationSchema>;
export type UpdateLocation = z.infer<typeof UpdateLocationSchema>;
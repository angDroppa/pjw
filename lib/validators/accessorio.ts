import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const AccessorioResponseSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  nome: z.string().openapi({ example: "Casco" }),
  prezzo: z.number().openapi({ example: 5.00 }),
}).openapi("AccessorioResponse");

export const CreateAccessorioSchema = z.object({
  nome: z.string().min(1).openapi({ example: "Casco" }),
  prezzo: z.number().min(0).openapi({ example: 5.00 }),
}).openapi("CreateAccessorio");

export const UpdateAccessorioSchema = z.object({
  nome: z.string().min(1).optional().openapi({ example: "Casco Premium" }),
  prezzo: z.number().min(0).optional().openapi({ example: 7.00 }),
}).openapi("UpdateAccessorio");

export type AccessorioResponse = z.infer<typeof AccessorioResponseSchema>;
export type CreateAccessorio = z.infer<typeof CreateAccessorioSchema>;
export type UpdateAccessorio = z.infer<typeof UpdateAccessorioSchema>;
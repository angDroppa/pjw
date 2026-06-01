import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Estende Zod con il metodo .openapi() che permette di aggiungere
// metadati agli schema (esempio, descrizione) per generare la documentazione Swagger.
// Deve essere chiamato una volta sola prima di usare .openapi()
extendZodWithOpenApi(z);

// Schema Zod per il login — fa da validatore e da DTO allo stesso tempo.
// Il validatore controlla che i dati in arrivo siano corretti (email valida, password min 6 char).
// Il DTO definisce la forma dei dati — usato sia lato server per validare il body
// della request che lato client per tipizzare i form.
// .openapi() aggiunge esempi visibili nella documentazione Swagger.

export const CustomerSchema = z.object({
    firstName: z.string().min(1).openapi({ example: "Mario" }),
    lastName: z.string().min(1).openapi({ example: "Rossi" }),
    address: z.string().min(1).openapi({ example: "Via Roma" }),
    number: z.int().openapi({ example: 1 }),
    city: z.string().min(1).openapi({ example: "Roma" }),
    provicne: z.string().min(2).max(2).openapi({ example: "RM" }),
    phoneNumber: z.string().min(10).max(10).openapi({ example: "345 3329434" }),
    email: z.email().openapi({ example: "mario@example.com" }),
    notes: z.string().min(1).openapi({ example: "Only deliver after 7pm" }),

});

export const DeliverySchema = z.object({
    customerId: z.int().openapi({ example: 1 }),
    userId: z.int().openapi({ example: 1 }),
    stateId: z.string().min(1).openapi({ example: "In Ritiro" }),
    pickupDate: z
        .date()
        .min(new Date(), "La data di ritiro non può essere nel passato")
        .openapi({ example: "2026-05-01" }),
    deliveryDate: z
        .date()
        .min(new Date(), "La data di ritiro non può essere nel passato")
        .openapi({ example: "2026-05-01" }),
    deliveryKey: z.string().min(10).openapi({ example: "cefefcas02" }),
});


// z.infer estrae il tipo TypeScript dallo schema Zod —
// invece di definire l'interfaccia a mano, la deriva automaticamente dallo schema.
// LoginInput === { email: string, password: string }
export type CustomerInput = z.infer<typeof CustomerSchema>;
// RegisterInput === { firstName: string, lastName: string, email: string, password: string }
export type DeliveryInput = z.infer<typeof DeliverySchema>;
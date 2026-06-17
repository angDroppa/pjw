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
export const LoginSchema = z.object({
  email: z.email("L'email deve essere valida").trim().openapi({ example: "mario.rossi@gmail.com" }),
  password: z.string()
    .min(8, "La password è obbligatoria")
    .regex(/[A-Z]/, "Deve contenere almeno una lettera maiuscola")
    .regex(/[0-9]/, "Deve contenere almeno un numero")
    .regex(/[^a-zA-Z0-9]/, "Deve contenere almeno un carattere speciale")
    .openapi({ example: "Password123!" }),
});



// Stessa cosa per il register
export const RegisterSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio").openapi({ example: "Mario" }),
  lastName: z.string().trim().min(1, "Il nome è obbligatorio").openapi({ example: "Rossi" }),
  email: z.email("L'email deve essere valida").openapi({ example: "mario@example.com" }),
  password: z.string()
    .min(8, "La password è obbligatoria")
    .regex(/[A-Z]/, "Deve contenere almeno una lettera maiuscola")
    .regex(/[0-9]/, "Deve contenere almeno un numero")
    .regex(/[^a-zA-Z0-9]/, "Deve contenere almeno un carattere speciale")
    .openapi({ example: "Password123!" }),
});

// z.infer estrae il tipo TypeScript dallo schema Zod —
// invece di definire l'interfaccia a mano, la deriva automaticamente dallo schema.
// LoginInput === { email: string, password: string }
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
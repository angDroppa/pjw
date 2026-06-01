import { PrismaClient } from "../app/generated/prisma/client"; 
import { PrismaPg } from "@prisma/adapter-pg"; 

// ok quindi prisma client è un modulo. il modulo con hot reload si ricarica mentre global no. 
// (global è un oggetto di node js che ha permanenza) quindi in dev si dichiara che il prisma client è una proprietà di global.
// in modo tale che prisma client abbia la persistenza tra i ricaricamenti del modulo, 
// evitando di creare più istanze che causerebbero un connection pool troppo alto —
// PostgreSQL gestisce massimo 100 connessioni simultanee di default, e ogni istanza di PrismaClient
// apre il suo pool, accumulandosi ad ogni ricaricamento del modulo in dev.

// in produzione può restare come modulo: HMR non avviene mai, il processo è uno,
// quindi il modulo viene eseguito una sola volta e l'istanza vive per tutta la durata dell'app.
const globalForPrisma = global as unknown as {
  prisma: PrismaClient; 
}; 

// L'adapter non adatta i modelli ai tipi — quello lo fa Prisma leggendo schema.prisma.
// Serve a dire a Prisma come parlare fisicamente con PostgreSQL.
// Di default Prisma usa il suo driver interno, con PrismaPg gli diciamo
// di usare "pg" — il driver nativo Node.js per PostgreSQL.
// Il vantaggio è che pg è più configurabile e supporta meglio
// strumenti come PgBouncer per il connection pooling condiviso tra più app.
// connectionString prende la URL del database dalle env var —
// è l'indirizzo a cui l'adapter si connetterà fisicamente.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL, 
}); 

// Controlla se esiste già un PrismaClient agganciato a global (dev con HMR).
// Se esiste lo riusa — evita di creare un nuovo pool di connessioni.
// Se non esiste (primo avvio o produzione) ne crea uno nuovo con l'adapter pg.
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

// Solo in development: aggancia il PrismaClient a global come proprietà
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Esporta l'istanza per usarla in tutta l'app con:
// import prisma from "@/lib/prisma"
export default prisma;
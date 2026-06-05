/*
  Warnings:

  - The values [DAMAGED,CANCELLED] on the enum `StatoPrenotazione` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `prezzo` on the `Assicurazione` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `modelloId` on the `Bicicletta` table. All the data in the column will be lost.
  - You are about to drop the column `prezzoMezzaGiornata` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `dataOreConsegna` on the `Prenotazione` table. All the data in the column will be lost.
  - You are about to drop the column `dataPickUp` on the `Prenotazione` table. All the data in the column will be lost.
  - You are about to drop the column `noteProblemi` on the `Prenotazione` table. All the data in the column will be lost.
  - You are about to alter the column `totalePagato` on the `Prenotazione` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the `Dimensione` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Modello` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockBicicletta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tipologia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AccessorioToPrenotazione` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BiciclettaToTipologia` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nome` to the `Bicicletta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipologia` to the `Bicicletta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataConsegna` to the `Prenotazione` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oraConsegna` to the `Prenotazione` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oraRitiro` to the `Prenotazione` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipologiaBicicletta" AS ENUM ('CITY', 'MOUNTAIN', 'GRAVEL', 'ROAD');

-- CreateEnum
CREATE TYPE "Alimentazione" AS ENUM ('MUSCOLARE', 'ELETTRICA');

-- AlterEnum
BEGIN;
CREATE TYPE "StatoPrenotazione_new" AS ENUM ('PENDING', 'PICKED_UP', 'RETURNED', 'LATE');
ALTER TABLE "public"."Prenotazione" ALTER COLUMN "stato" DROP DEFAULT;
ALTER TABLE "Prenotazione" ALTER COLUMN "stato" TYPE "StatoPrenotazione_new" USING ("stato"::text::"StatoPrenotazione_new");
ALTER TYPE "StatoPrenotazione" RENAME TO "StatoPrenotazione_old";
ALTER TYPE "StatoPrenotazione_new" RENAME TO "StatoPrenotazione";
DROP TYPE "public"."StatoPrenotazione_old";
ALTER TABLE "Prenotazione" ALTER COLUMN "stato" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Bicicletta" DROP CONSTRAINT "Bicicletta_modelloId_fkey";

-- DropForeignKey
ALTER TABLE "Dimensione" DROP CONSTRAINT "Dimensione_biciclettaId_fkey";

-- DropForeignKey
ALTER TABLE "Prenotazione" DROP CONSTRAINT "Prenotazione_biciclettaId_fkey";

-- DropForeignKey
ALTER TABLE "StockBicicletta" DROP CONSTRAINT "StockBicicletta_biciclettaId_fkey";

-- DropForeignKey
ALTER TABLE "StockBicicletta" DROP CONSTRAINT "StockBicicletta_locationId_fkey";

-- DropForeignKey
ALTER TABLE "_AccessorioToPrenotazione" DROP CONSTRAINT "_AccessorioToPrenotazione_A_fkey";

-- DropForeignKey
ALTER TABLE "_AccessorioToPrenotazione" DROP CONSTRAINT "_AccessorioToPrenotazione_B_fkey";

-- DropForeignKey
ALTER TABLE "_BiciclettaToTipologia" DROP CONSTRAINT "_BiciclettaToTipologia_A_fkey";

-- DropForeignKey
ALTER TABLE "_BiciclettaToTipologia" DROP CONSTRAINT "_BiciclettaToTipologia_B_fkey";

-- AlterTable
ALTER TABLE "Assicurazione" ALTER COLUMN "prezzo" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Bicicletta" DROP COLUMN "modelloId",
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "tipologia" "TipologiaBicicletta" NOT NULL;

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "prezzoMezzaGiornata";

-- AlterTable
ALTER TABLE "Notifica" ADD COLUMN     "letto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'generica';

-- AlterTable
ALTER TABLE "Prenotazione" DROP COLUMN "dataOreConsegna",
DROP COLUMN "dataPickUp",
DROP COLUMN "noteProblemi",
ADD COLUMN     "biciclettaIstanzaId" INTEGER,
ADD COLUMN     "danni" TEXT,
ADD COLUMN     "dataConsegna" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataCreazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "noteRiconsegna" TEXT,
ADD COLUMN     "oraConsegna" TEXT NOT NULL,
ADD COLUMN     "oraRitiro" TEXT NOT NULL,
ALTER COLUMN "dataRitiro" SET DATA TYPE DATE,
ALTER COLUMN "totalePagato" DROP DEFAULT,
ALTER COLUMN "totalePagato" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Dimensione";

-- DropTable
DROP TABLE "Modello";

-- DropTable
DROP TABLE "StockBicicletta";

-- DropTable
DROP TABLE "Tipologia";

-- DropTable
DROP TABLE "_AccessorioToPrenotazione";

-- DropTable
DROP TABLE "_BiciclettaToTipologia";

-- CreateTable
CREATE TABLE "AccessorioPrenotazione" (
    "id" SERIAL NOT NULL,
    "accessorioId" INTEGER NOT NULL,
    "prenotazioneId" INTEGER NOT NULL,

    CONSTRAINT "AccessorioPrenotazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiciclettaLocation" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "biciclettaSpecificId" INTEGER NOT NULL,
    "quantita" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BiciclettaLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiciclettaIstanza" (
    "id" SERIAL NOT NULL,
    "codice" TEXT NOT NULL,
    "specificheBiciclettaId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "occupata" BOOLEAN NOT NULL DEFAULT false,
    "occupataDa" TIMESTAMP(3),
    "occupataA" TIMESTAMP(3),
    "biciclettaLocationId" INTEGER,

    CONSTRAINT "BiciclettaIstanza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificheBicicletta" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "alimentazione" "Alimentazione" NOT NULL,
    "prezzoGiornata" DECIMAL(10,2) NOT NULL,
    "prezzoMezzaGiornata" DECIMAL(10,2) NOT NULL,
    "altezzaMin" INTEGER,
    "altezzaMax" INTEGER,
    "biciclettaId" INTEGER NOT NULL,

    CONSTRAINT "SpecificheBicicletta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BiciclettaLocation_locationId_biciclettaSpecificId_key" ON "BiciclettaLocation"("locationId", "biciclettaSpecificId");

-- CreateIndex
CREATE UNIQUE INDEX "BiciclettaIstanza_codice_key" ON "BiciclettaIstanza"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificheBicicletta_biciclettaId_size_alimentazione_key" ON "SpecificheBicicletta"("biciclettaId", "size", "alimentazione");

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "SpecificheBicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_biciclettaIstanzaId_fkey" FOREIGN KEY ("biciclettaIstanzaId") REFERENCES "BiciclettaIstanza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorioPrenotazione" ADD CONSTRAINT "AccessorioPrenotazione_accessorioId_fkey" FOREIGN KEY ("accessorioId") REFERENCES "Accessorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorioPrenotazione" ADD CONSTRAINT "AccessorioPrenotazione_prenotazioneId_fkey" FOREIGN KEY ("prenotazioneId") REFERENCES "Prenotazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaLocation" ADD CONSTRAINT "BiciclettaLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaLocation" ADD CONSTRAINT "BiciclettaLocation_biciclettaSpecificId_fkey" FOREIGN KEY ("biciclettaSpecificId") REFERENCES "SpecificheBicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaIstanza" ADD CONSTRAINT "BiciclettaIstanza_biciclettaLocationId_fkey" FOREIGN KEY ("biciclettaLocationId") REFERENCES "BiciclettaLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaIstanza" ADD CONSTRAINT "BiciclettaIstanza_specificheBiciclettaId_fkey" FOREIGN KEY ("specificheBiciclettaId") REFERENCES "SpecificheBicicletta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaIstanza" ADD CONSTRAINT "BiciclettaIstanza_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificheBicicletta" ADD CONSTRAINT "SpecificheBicicletta_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "Bicicletta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

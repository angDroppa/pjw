/*
  Warnings:

  - You are about to drop the column `quantitaElettrico` on the `Bicicletta` table. All the data in the column will be lost.
  - You are about to drop the column `quantitaMuscolare` on the `Bicicletta` table. All the data in the column will be lost.
  - You are about to drop the column `numeroBiciclette` on the `Dimensione` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatoPrenotazione" AS ENUM ('PENDING', 'PICKED_UP', 'RETURNED', 'LATE', 'DAMAGED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Accessorio" ADD COLUMN     "prezzo" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Assicurazione" ADD COLUMN     "prezzo" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Bicicletta" DROP COLUMN "quantitaElettrico",
DROP COLUMN "quantitaMuscolare";

-- AlterTable
ALTER TABLE "Dimensione" DROP COLUMN "numeroBiciclette",
ADD COLUMN     "quantitaElettrico" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantitaMuscolare" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "prezzoMezzaGiornata" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Prenotazione" ADD COLUMN     "noteProblemi" TEXT,
ADD COLUMN     "stato" "StatoPrenotazione" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalePagato" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "StockBicicletta" (
    "id" SERIAL NOT NULL,
    "quantita" INTEGER NOT NULL DEFAULT 0,
    "inManutenzione" INTEGER NOT NULL DEFAULT 0,
    "locationId" INTEGER NOT NULL,
    "biciclettaId" INTEGER NOT NULL,

    CONSTRAINT "StockBicicletta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockBicicletta_locationId_biciclettaId_key" ON "StockBicicletta"("locationId", "biciclettaId");

-- AddForeignKey
ALTER TABLE "StockBicicletta" ADD CONSTRAINT "StockBicicletta_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBicicletta" ADD CONSTRAINT "StockBicicletta_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "Bicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

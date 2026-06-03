/*
  Warnings:

  - You are about to drop the column `coperturaId` on the `Bicicletta` table. All the data in the column will be lost.
  - You are about to drop the column `dimensione` on the `Bicicletta` table. All the data in the column will be lost.
  - You are about to drop the column `tipologiaId` on the `Bicicletta` table. All the data in the column will be lost.
  - You are about to drop the `_AccessorioToBicicletta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `quantitaElettrico` to the `Bicicletta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantitaMuscolare` to the `Bicicletta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coperturaId` to the `Prenotazione` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Bicicletta" DROP CONSTRAINT "Bicicletta_coperturaId_fkey";

-- DropForeignKey
ALTER TABLE "Bicicletta" DROP CONSTRAINT "Bicicletta_tipologiaId_fkey";

-- DropForeignKey
ALTER TABLE "_AccessorioToBicicletta" DROP CONSTRAINT "_AccessorioToBicicletta_A_fkey";

-- DropForeignKey
ALTER TABLE "_AccessorioToBicicletta" DROP CONSTRAINT "_AccessorioToBicicletta_B_fkey";

-- AlterTable
ALTER TABLE "Bicicletta" DROP COLUMN "coperturaId",
DROP COLUMN "dimensione",
DROP COLUMN "tipologiaId",
ADD COLUMN     "quantitaElettrico" INTEGER NOT NULL,
ADD COLUMN     "quantitaMuscolare" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Prenotazione" ADD COLUMN     "coperturaId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_AccessorioToBicicletta";

-- CreateTable
CREATE TABLE "Dimensione" (
    "id" SERIAL NOT NULL,
    "biciclettaId" INTEGER NOT NULL,
    "taglia" TEXT NOT NULL,
    "numeroBiciclette" INTEGER NOT NULL,

    CONSTRAINT "Dimensione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BiciclettaToTipologia" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BiciclettaToTipologia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AccessorioToPrenotazione" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccessorioToPrenotazione_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BiciclettaToTipologia_B_index" ON "_BiciclettaToTipologia"("B");

-- CreateIndex
CREATE INDEX "_AccessorioToPrenotazione_B_index" ON "_AccessorioToPrenotazione"("B");

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_coperturaId_fkey" FOREIGN KEY ("coperturaId") REFERENCES "Assicurazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dimensione" ADD CONSTRAINT "Dimensione_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "Bicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BiciclettaToTipologia" ADD CONSTRAINT "_BiciclettaToTipologia_A_fkey" FOREIGN KEY ("A") REFERENCES "Bicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BiciclettaToTipologia" ADD CONSTRAINT "_BiciclettaToTipologia_B_fkey" FOREIGN KEY ("B") REFERENCES "Tipologia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccessorioToPrenotazione" ADD CONSTRAINT "_AccessorioToPrenotazione_A_fkey" FOREIGN KEY ("A") REFERENCES "Accessorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccessorioToPrenotazione" ADD CONSTRAINT "_AccessorioToPrenotazione_B_fkey" FOREIGN KEY ("B") REFERENCES "Prenotazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

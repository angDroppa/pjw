/*
  Warnings:

  - You are about to drop the column `cognome` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cognome",
DROP COLUMN "nome",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "roleName" TEXT NOT NULL;

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "Role" (
    "role" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "Bicicletta" (
    "id" SERIAL NOT NULL,
    "dimensione" TEXT NOT NULL,
    "modelloId" INTEGER NOT NULL,
    "tipologiaId" INTEGER NOT NULL,
    "coperturaId" INTEGER NOT NULL,

    CONSTRAINT "Bicicletta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modello" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Modello_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tipologia" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Tipologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accessorio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Accessorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assicurazione" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "dettagli" TEXT NOT NULL,

    CONSTRAINT "Assicurazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prenotazione" (
    "id" SERIAL NOT NULL,
    "dataRitiro" TIMESTAMP(3) NOT NULL,
    "dataOreConsegna" TIMESTAMP(3) NOT NULL,
    "dataPickUp" TIMESTAMP(3) NOT NULL,
    "utenteId" INTEGER NOT NULL,
    "biciclettaId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "Prenotazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifica" (
    "id" SERIAL NOT NULL,
    "messaggio" TEXT NOT NULL,
    "utenteId" INTEGER NOT NULL,

    CONSTRAINT "Notifica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccessorioToBicicletta" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccessorioToBicicletta_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AccessorioToBicicletta_B_index" ON "_AccessorioToBicicletta"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "Role"("role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bicicletta" ADD CONSTRAINT "Bicicletta_modelloId_fkey" FOREIGN KEY ("modelloId") REFERENCES "Modello"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bicicletta" ADD CONSTRAINT "Bicicletta_tipologiaId_fkey" FOREIGN KEY ("tipologiaId") REFERENCES "Tipologia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bicicletta" ADD CONSTRAINT "Bicicletta_coperturaId_fkey" FOREIGN KEY ("coperturaId") REFERENCES "Assicurazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "Bicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifica" ADD CONSTRAINT "Notifica_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccessorioToBicicletta" ADD CONSTRAINT "_AccessorioToBicicletta_A_fkey" FOREIGN KEY ("A") REFERENCES "Accessorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccessorioToBicicletta" ADD CONSTRAINT "_AccessorioToBicicletta_B_fkey" FOREIGN KEY ("B") REFERENCES "Bicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

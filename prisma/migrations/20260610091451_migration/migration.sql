/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Alimentazione" AS ENUM ('MUSCOLARE', 'ELETTRICA');

-- CreateEnum
CREATE TYPE "StatoPrenotazione" AS ENUM ('PENDING', 'PICKED_UP', 'RETURNED', 'LATE');

-- CreateEnum
CREATE TYPE "TipologiaBicicletta" AS ENUM ('CITY', 'MOUNTAIN', 'GRAVEL', 'ROAD');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "roleName" TEXT NOT NULL,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Post";

-- CreateTable
CREATE TABLE "Role" (
    "role" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifica" (
    "id" SERIAL NOT NULL,
    "messaggio" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'generica',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letto" BOOLEAN NOT NULL DEFAULT false,
    "utenteId" INTEGER NOT NULL,

    CONSTRAINT "Notifica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prenotazione" (
    "id" SERIAL NOT NULL,
    "dataCreazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRitiro" DATE NOT NULL,
    "oraRitiro" TEXT NOT NULL,
    "dataConsegna" TIMESTAMP(3) NOT NULL,
    "oraConsegna" TEXT NOT NULL,
    "stato" "StatoPrenotazione" NOT NULL DEFAULT 'PENDING',
    "alimentazione" "Alimentazione" NOT NULL,
    "note" TEXT,
    "noteRiconsegna" TEXT,
    "danni" TEXT,
    "totalePagato" DECIMAL(10,2) NOT NULL,
    "utenteId" INTEGER NOT NULL,
    "biciclettaId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "coperturaId" INTEGER NOT NULL,

    CONSTRAINT "Prenotazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accessorio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "prezzo" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Accessorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessorioPrenotazione" (
    "id" SERIAL NOT NULL,
    "accessorioId" INTEGER NOT NULL,
    "prenotazioneId" INTEGER NOT NULL,

    CONSTRAINT "AccessorioPrenotazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assicurazione" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "dettagli" TEXT NOT NULL,
    "prezzo" DECIMAL(65,30) NOT NULL DEFAULT 0.0,

    CONSTRAINT "Assicurazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiciclettaLocation" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "biciclettaSpecificId" INTEGER NOT NULL,
    "quantitaMuscolare" INTEGER NOT NULL DEFAULT 0,
    "quantitaElettrica" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BiciclettaLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bicicletta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipologia" "TipologiaBicicletta" NOT NULL,

    CONSTRAINT "Bicicletta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificheBicicletta" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "prezzoGiornata" DECIMAL(10,2) NOT NULL,
    "prezzoMezzaGiornata" DECIMAL(10,2) NOT NULL,
    "altezzaMin" INTEGER,
    "altezzaMax" INTEGER,
    "biciclettaId" INTEGER NOT NULL,

    CONSTRAINT "SpecificheBicicletta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BiciclettaLocation_locationId_biciclettaSpecificId_key" ON "BiciclettaLocation"("locationId", "biciclettaSpecificId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificheBicicletta_biciclettaId_size_key" ON "SpecificheBicicletta"("biciclettaId", "size");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "Role"("role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifica" ADD CONSTRAINT "Notifica_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "SpecificheBicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prenotazione" ADD CONSTRAINT "Prenotazione_coperturaId_fkey" FOREIGN KEY ("coperturaId") REFERENCES "Assicurazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorioPrenotazione" ADD CONSTRAINT "AccessorioPrenotazione_accessorioId_fkey" FOREIGN KEY ("accessorioId") REFERENCES "Accessorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorioPrenotazione" ADD CONSTRAINT "AccessorioPrenotazione_prenotazioneId_fkey" FOREIGN KEY ("prenotazioneId") REFERENCES "Prenotazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaLocation" ADD CONSTRAINT "BiciclettaLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiciclettaLocation" ADD CONSTRAINT "BiciclettaLocation_biciclettaSpecificId_fkey" FOREIGN KEY ("biciclettaSpecificId") REFERENCES "SpecificheBicicletta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificheBicicletta" ADD CONSTRAINT "SpecificheBicicletta_biciclettaId_fkey" FOREIGN KEY ("biciclettaId") REFERENCES "Bicicletta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

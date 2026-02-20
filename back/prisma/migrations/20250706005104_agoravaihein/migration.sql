/*
  Warnings:

  - You are about to drop the `propostas` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Unidades" AS ENUM ('KG', 'PCT', 'REDE', 'DUZIA', 'LT', 'Unid');

-- DropForeignKey
ALTER TABLE "propostas" DROP CONSTRAINT "propostas_alimentoId_fkey";

-- DropForeignKey
ALTER TABLE "propostas" DROP CONSTRAINT "propostas_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Alimento" ADD COLUMN     "tipoUni" "Unidades" NOT NULL DEFAULT 'KG',
ADD COLUMN     "unidadeTipo" "Unidades" NOT NULL DEFAULT 'KG';

-- DropTable
DROP TABLE "propostas";

-- CreateTable
CREATE TABLE "UsuarioNaDispensa" (
    "id" SERIAL NOT NULL,
    "usuarioID" VARCHAR(36) NOT NULL,
    "dispensaID" INTEGER NOT NULL,

    CONSTRAINT "UsuarioNaDispensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UsuarioToDonoDispensa" (
    "A" INTEGER NOT NULL,
    "B" VARCHAR(36) NOT NULL,

    CONSTRAINT "_UsuarioToDonoDispensa_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioNaDispensa_usuarioID_dispensaID_key" ON "UsuarioNaDispensa"("usuarioID", "dispensaID");

-- CreateIndex
CREATE INDEX "_UsuarioToDonoDispensa_B_index" ON "_UsuarioToDonoDispensa"("B");

-- AddForeignKey
ALTER TABLE "UsuarioNaDispensa" ADD CONSTRAINT "UsuarioNaDispensa_usuarioID_fkey" FOREIGN KEY ("usuarioID") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNaDispensa" ADD CONSTRAINT "UsuarioNaDispensa_dispensaID_fkey" FOREIGN KEY ("dispensaID") REFERENCES "Dispensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioToDonoDispensa" ADD CONSTRAINT "_UsuarioToDonoDispensa_A_fkey" FOREIGN KEY ("A") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioToDonoDispensa" ADD CONSTRAINT "_UsuarioToDonoDispensa_B_fkey" FOREIGN KEY ("B") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

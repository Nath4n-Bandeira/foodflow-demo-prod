/*
  Warnings:

  - You are about to drop the `_DispensaToUsuario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dispensaId` to the `Alimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioID` to the `Dispensa` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_DispensaToUsuario" DROP CONSTRAINT "_DispensaToUsuario_A_fkey";

-- DropForeignKey
ALTER TABLE "_DispensaToUsuario" DROP CONSTRAINT "_DispensaToUsuario_B_fkey";

-- AlterTable
ALTER TABLE "Alimento" ADD COLUMN     "dispensaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Dispensa" ADD COLUMN     "usuarioID" VARCHAR(36) NOT NULL;

-- DropTable
DROP TABLE "_DispensaToUsuario";

-- AddForeignKey
ALTER TABLE "Dispensa" ADD CONSTRAINT "Dispensa_usuarioID_fkey" FOREIGN KEY ("usuarioID") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alimento" ADD CONSTRAINT "Alimento_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

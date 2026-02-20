/*
  Warnings:

  - You are about to drop the column `perecivel` on the `Dispensa` table. All the data in the column will be lost.
  - You are about to drop the column `peso` on the `Dispensa` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade` on the `Dispensa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dispensa" DROP COLUMN "perecivel",
DROP COLUMN "peso",
DROP COLUMN "quantidade";

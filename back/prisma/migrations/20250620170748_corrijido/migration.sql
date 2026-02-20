/*
  Warnings:

  - You are about to drop the column `destaque` on the `Alimento` table. All the data in the column will be lost.
  - You are about to drop the column `destaque` on the `Dispensa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Alimento" DROP COLUMN "destaque";

-- AlterTable
ALTER TABLE "Dispensa" DROP COLUMN "destaque";

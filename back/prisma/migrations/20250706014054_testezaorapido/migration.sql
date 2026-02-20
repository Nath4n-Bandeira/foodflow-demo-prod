/*
  Warnings:

  - The primary key for the `UsuarioNaDispensa` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UsuarioNaDispensa" DROP CONSTRAINT "UsuarioNaDispensa_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "UsuarioNaDispensa_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UsuarioNaDispensa_id_seq";

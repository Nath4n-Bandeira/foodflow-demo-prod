-- CreateEnum
CREATE TYPE "Pereciveis" AS ENUM ('NÃO', 'SIM');

-- CreateTable
CREATE TABLE "Dispensa" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "quantidade" SMALLINT NOT NULL,
    "peso" DECIMAL(10,2) NOT NULL,
    "perecivel" "Pereciveis" NOT NULL DEFAULT 'NÃO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Dispensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alimento" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "peso" DECIMAL(10,2) NOT NULL,
    "perecivel" "Pereciveis" NOT NULL DEFAULT 'NÃO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas" (
    "id" SERIAL NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,
    "alimentoId" INTEGER NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "resposta" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DispensaToUsuario" (
    "A" INTEGER NOT NULL,
    "B" VARCHAR(36) NOT NULL,

    CONSTRAINT "_DispensaToUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DispensaToUsuario_B_index" ON "_DispensaToUsuario"("B");

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DispensaToUsuario" ADD CONSTRAINT "_DispensaToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DispensaToUsuario" ADD CONSTRAINT "_DispensaToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

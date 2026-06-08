-- AlterTable
ALTER TABLE "Dispensa" ADD COLUMN     "monitorarTemperatura" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Amizade" (
    "id" TEXT NOT NULL,
    "usuario1Id" VARCHAR(36) NOT NULL,
    "usuario2Id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amizade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlimentoDoPost" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "peso" DECIMAL(10,2),
    "unidade" VARCHAR(20) NOT NULL DEFAULT 'KG',
    "validade" TIMESTAMP(3),
    "marca" VARCHAR(100),
    "ingredientes" TEXT,
    "nutrientes" JSONB,
    "imagemUrl" TEXT,
    "confianca" DECIMAL(3,2) NOT NULL DEFAULT 0.95,
    "dispensaId" INTEGER NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlimentoDoPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensaInvite" (
    "id" TEXT NOT NULL,
    "dispensaId" INTEGER NOT NULL,
    "convidadoPorId" VARCHAR(36) NOT NULL,
    "convidadoId" VARCHAR(36) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispensaInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Amizade_usuario1Id_idx" ON "Amizade"("usuario1Id");

-- CreateIndex
CREATE INDEX "Amizade_usuario2Id_idx" ON "Amizade"("usuario2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Amizade_usuario1Id_usuario2Id_key" ON "Amizade"("usuario1Id", "usuario2Id");

-- CreateIndex
CREATE INDEX "AlimentoDoPost_dispensaId_idx" ON "AlimentoDoPost"("dispensaId");

-- CreateIndex
CREATE INDEX "AlimentoDoPost_usuarioId_idx" ON "AlimentoDoPost"("usuarioId");

-- CreateIndex
CREATE INDEX "AlimentoDoPost_createdAt_idx" ON "AlimentoDoPost"("createdAt");

-- CreateIndex
CREATE INDEX "DispensaInvite_convidadoId_idx" ON "DispensaInvite"("convidadoId");

-- CreateIndex
CREATE INDEX "DispensaInvite_dispensaId_idx" ON "DispensaInvite"("dispensaId");

-- CreateIndex
CREATE INDEX "DispensaInvite_status_idx" ON "DispensaInvite"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispensaInvite_dispensaId_convidadoId_key" ON "DispensaInvite"("dispensaId", "convidadoId");

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_usuario1Id_fkey" FOREIGN KEY ("usuario1Id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_usuario2Id_fkey" FOREIGN KEY ("usuario2Id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlimentoDoPost" ADD CONSTRAINT "AlimentoDoPost_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlimentoDoPost" ADD CONSTRAINT "AlimentoDoPost_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensaInvite" ADD CONSTRAINT "DispensaInvite_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensaInvite" ADD CONSTRAINT "DispensaInvite_convidadoPorId_fkey" FOREIGN KEY ("convidadoPorId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensaInvite" ADD CONSTRAINT "DispensaInvite_convidadoId_fkey" FOREIGN KEY ("convidadoId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "Pereciveis" AS ENUM ('NÃO', 'SIM');

-- CreateEnum
CREATE TYPE "Unidades" AS ENUM ('KG', 'PCT', 'REDE', 'DUZIA', 'LT', 'Unid');

-- CreateTable
CREATE TABLE "Dispensa" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioID" VARCHAR(36) NOT NULL,
    "monitorarTemperatura" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Dispensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alimento" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "peso" DECIMAL(10,2) NOT NULL,
    "perecivel" "Pereciveis" NOT NULL DEFAULT 'NÃO',
    "unidadeTipo" "Unidades" NOT NULL DEFAULT 'KG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dispensaId" INTEGER NOT NULL,

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
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "remetenteId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioNaDispensa" (
    "id" VARCHAR(36) NOT NULL,
    "usuarioID" VARCHAR(36) NOT NULL,
    "dispensaID" INTEGER NOT NULL,

    CONSTRAINT "UsuarioNaDispensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsoAlimento" (
    "id" SERIAL NOT NULL,
    "alimentoId" INTEGER NOT NULL,
    "quantidadeUsada" DECIMAL(10,2) NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,
    "dispensaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsoAlimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amizade" (
    "id" TEXT NOT NULL,
    "usuario1Id" VARCHAR(36) NOT NULL,
    "usuario2Id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amizade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL,
    "solicitanteId" VARCHAR(36) NOT NULL,
    "destinatarioId" VARCHAR(36) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "_UsuarioToDonoDispensa" (
    "A" INTEGER NOT NULL,
    "B" VARCHAR(36) NOT NULL,

    CONSTRAINT "_UsuarioToDonoDispensa_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Mensagem_remetenteId_idx" ON "Mensagem"("remetenteId");

-- CreateIndex
CREATE INDEX "Mensagem_destinatarioId_idx" ON "Mensagem"("destinatarioId");

-- CreateIndex
CREATE INDEX "Mensagem_createdAt_idx" ON "Mensagem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioNaDispensa_usuarioID_dispensaID_key" ON "UsuarioNaDispensa"("usuarioID", "dispensaID");

-- CreateIndex
CREATE INDEX "Amizade_usuario1Id_idx" ON "Amizade"("usuario1Id");

-- CreateIndex
CREATE INDEX "Amizade_usuario2Id_idx" ON "Amizade"("usuario2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Amizade_usuario1Id_usuario2Id_key" ON "Amizade"("usuario1Id", "usuario2Id");

-- CreateIndex
CREATE INDEX "FriendRequest_destinatarioId_idx" ON "FriendRequest"("destinatarioId");

-- CreateIndex
CREATE INDEX "FriendRequest_status_idx" ON "FriendRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_solicitanteId_destinatarioId_key" ON "FriendRequest"("solicitanteId", "destinatarioId");

-- CreateIndex
CREATE INDEX "DispensaInvite_convidadoId_idx" ON "DispensaInvite"("convidadoId");

-- CreateIndex
CREATE INDEX "DispensaInvite_dispensaId_idx" ON "DispensaInvite"("dispensaId");

-- CreateIndex
CREATE INDEX "DispensaInvite_status_idx" ON "DispensaInvite"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispensaInvite_dispensaId_convidadoId_key" ON "DispensaInvite"("dispensaId", "convidadoId");

-- CreateIndex
CREATE INDEX "_UsuarioToDonoDispensa_B_index" ON "_UsuarioToDonoDispensa"("B");

-- AddForeignKey
ALTER TABLE "Dispensa" ADD CONSTRAINT "Dispensa_usuarioID_fkey" FOREIGN KEY ("usuarioID") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alimento" ADD CONSTRAINT "Alimento_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNaDispensa" ADD CONSTRAINT "UsuarioNaDispensa_usuarioID_fkey" FOREIGN KEY ("usuarioID") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioNaDispensa" ADD CONSTRAINT "UsuarioNaDispensa_dispensaID_fkey" FOREIGN KEY ("dispensaID") REFERENCES "Dispensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoAlimento" ADD CONSTRAINT "UsoAlimento_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoAlimento" ADD CONSTRAINT "UsoAlimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoAlimento" ADD CONSTRAINT "UsoAlimento_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_usuario1Id_fkey" FOREIGN KEY ("usuario1Id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_usuario2Id_fkey" FOREIGN KEY ("usuario2Id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensaInvite" ADD CONSTRAINT "DispensaInvite_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensaInvite" ADD CONSTRAINT "DispensaInvite_convidadoPorId_fkey" FOREIGN KEY ("convidadoPorId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensaInvite" ADD CONSTRAINT "DispensaInvite_convidadoId_fkey" FOREIGN KEY ("convidadoId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioToDonoDispensa" ADD CONSTRAINT "_UsuarioToDonoDispensa_A_fkey" FOREIGN KEY ("A") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuarioToDonoDispensa" ADD CONSTRAINT "_UsuarioToDonoDispensa_B_fkey" FOREIGN KEY ("B") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

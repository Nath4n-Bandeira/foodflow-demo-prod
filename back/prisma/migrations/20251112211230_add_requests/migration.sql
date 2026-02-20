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

-- CreateIndex
CREATE INDEX "FriendRequest_destinatarioId_idx" ON "FriendRequest"("destinatarioId");

-- CreateIndex
CREATE INDEX "FriendRequest_status_idx" ON "FriendRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_solicitanteId_destinatarioId_key" ON "FriendRequest"("solicitanteId", "destinatarioId");

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

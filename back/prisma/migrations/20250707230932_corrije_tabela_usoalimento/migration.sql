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

-- AddForeignKey
ALTER TABLE "UsoAlimento" ADD CONSTRAINT "UsoAlimento_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoAlimento" ADD CONSTRAINT "UsoAlimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoAlimento" ADD CONSTRAINT "UsoAlimento_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

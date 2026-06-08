CREATE TABLE "NotaFiscalCompra" (
    "id" SERIAL NOT NULL,
    "chaveAcesso" VARCHAR(80),
    "qrCodeUrl" TEXT,
    "mercadoNome" VARCHAR(160) NOT NULL,
    "mercadoCnpj" VARCHAR(20),
    "dataCompra" TIMESTAMP(3),
    "valorTotal" DECIMAL(10,2),
    "dispensaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaFiscalCompra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotaFiscalItem" (
    "id" SERIAL NOT NULL,
    "notaFiscalId" INTEGER NOT NULL,
    "codigo" VARCHAR(30),
    "nomeOriginal" VARCHAR(220) NOT NULL,
    "nomeNormalizado" VARCHAR(220) NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "unidade" VARCHAR(20) NOT NULL,
    "valorUnitario" DECIMAL(10,2),
    "valorTotal" DECIMAL(10,2),
    "isAlimento" BOOLEAN NOT NULL DEFAULT false,
    "motivoClasse" VARCHAR(180),
    "alimentoCriadoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaFiscalItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotaFiscalCompra_dispensaId_idx" ON "NotaFiscalCompra"("dispensaId");
CREATE INDEX "NotaFiscalCompra_chaveAcesso_idx" ON "NotaFiscalCompra"("chaveAcesso");
CREATE INDEX "NotaFiscalItem_notaFiscalId_idx" ON "NotaFiscalItem"("notaFiscalId");
CREATE INDEX "NotaFiscalItem_nomeNormalizado_idx" ON "NotaFiscalItem"("nomeNormalizado");
CREATE INDEX "NotaFiscalItem_isAlimento_idx" ON "NotaFiscalItem"("isAlimento");

ALTER TABLE "NotaFiscalCompra" ADD CONSTRAINT "NotaFiscalCompra_dispensaId_fkey" FOREIGN KEY ("dispensaId") REFERENCES "Dispensa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotaFiscalItem" ADD CONSTRAINT "NotaFiscalItem_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscalCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

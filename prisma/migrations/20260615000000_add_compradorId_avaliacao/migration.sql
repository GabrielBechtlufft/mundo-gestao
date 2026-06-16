-- AlterTable: add compradorId to Avaliacao for tracking which buyer evaluated
ALTER TABLE "Avaliacao" ADD COLUMN "compradorId" TEXT;

-- CreateIndex: unique constraint (listagemId, compradorId) - NULLs are distinct in PostgreSQL
CREATE UNIQUE INDEX "Avaliacao_listagemId_compradorId_key" ON "Avaliacao"("listagemId", "compradorId");

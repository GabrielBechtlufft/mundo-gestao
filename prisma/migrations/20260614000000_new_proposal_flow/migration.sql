-- AlterTable: add documentoProposta field and update default status
ALTER TABLE "Proposta" ADD COLUMN "documentoProposta" TEXT;
ALTER TABLE "Proposta" ALTER COLUMN "status" SET DEFAULT 'CONTATO_SOLICITADO';

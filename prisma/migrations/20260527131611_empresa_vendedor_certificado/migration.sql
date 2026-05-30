-- CreateTable
CREATE TABLE "FuncionarioVendedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "cargo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FuncionarioVendedor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proposta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitante" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "vendedorConfirmou" BOOLEAN NOT NULL DEFAULT false,
    "compradorConfirmou" BOOLEAN NOT NULL DEFAULT false,
    "documentoCompra" TEXT,
    "userId" TEXT,
    "listagemId" INTEGER,
    "compradorId" TEXT,
    "vendedorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proposta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Proposta_listagemId_fkey" FOREIGN KEY ("listagemId") REFERENCES "Listagem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Proposta_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Proposta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Proposta" ("id", "servico", "solicitante", "status", "userId") SELECT "id", "servico", "solicitante", "status", "userId" FROM "Proposta";
DROP TABLE "Proposta";
ALTER TABLE "new_Proposta" RENAME TO "Proposta";
CREATE TABLE "new_SolicitacaoCadastro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "isosVendidas" TEXT NOT NULL DEFAULT '',
    "validadeCertificado" TEXT,
    "documentoComprovante" TEXT,
    "nomeContato" TEXT,
    "cargoContato" TEXT,
    "mensagem" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivoRejeicao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SolicitacaoCadastro" ("cidade", "createdAt", "email", "id", "mensagem", "motivoRejeicao", "nome", "status", "telefone") SELECT "cidade", "createdAt", "email", "id", "mensagem", "motivoRejeicao", "nome", "status", "telefone" FROM "SolicitacaoCadastro";
DROP TABLE "SolicitacaoCadastro";
ALTER TABLE "new_SolicitacaoCadastro" RENAME TO "SolicitacaoCadastro";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "statusVendedor" TEXT NOT NULL DEFAULT 'APROVADO',
    "trocarSenha" BOOLEAN NOT NULL DEFAULT false,
    "isosVendidas" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "googleId" TEXT,
    "cnpj" TEXT,
    "razaoSocial" TEXT,
    "validadeCertificado" DATETIME
);
INSERT INTO "new_User" ("email", "id", "isosVendidas", "login", "name", "password", "role", "statusVendedor") SELECT "email", "id", "isosVendidas", "login", "name", "password", "role", "statusVendedor" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

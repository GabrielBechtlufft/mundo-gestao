import { readFileSync } from "node:fs";
import vm from "node:vm";
import { resolve, dirname } from "node:path";
import ts from "typescript";
import test from "node:test";
import assert from "node:assert/strict";

function load(path, mocks = {}, globals = {}) {
  const filename = resolve(path);
  const exports = {};
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, console, ...globals, require: (key) => {
    if (key in mocks) return mocks[key];
    if (key.startsWith("./")) return load(resolve(dirname(filename), key + ".ts"), mocks);
    if (key.startsWith("@/app/lib/")) return load(key.replace("@/", "") + ".ts", mocks);
    throw new Error(`Dependência inesperada: ${key}`);
  } });
  return exports;
}

const helpers = load("app/lib/cadastro.ts");
const catalogo = load("app/lib/estados.ts");
const arquivo = "/uploads/12345678-1234-1234-1234-123456789abc.pdf";

test("máscara preserva DDD 55 e aceita telefone internacional e já formatado", () => {
  assert.equal(helpers.formatPhone("55912345678"), "+55 (55) 9 1234-5678");
  assert.equal(helpers.formatPhone("11912345678"), "+55 (11) 9 1234-5678");
  assert.equal(helpers.formatPhone("+55 (55) 9 1234-5678"), "+55 (55) 9 1234-5678");
  assert.equal(helpers.formatPhone("5555912345678"), "+55 (55) 9 1234-5678");
});

test("catálogo contém todos os 27 estados sem duplicatas", () => {
  assert.equal(catalogo.ESTADOS.length, 27);
  assert.equal(new Set(catalogo.ESTADOS.map((s) => s.slice(0, 2))).size, 27);
});

test("cadastro exige correspondência entre normas e certificados válidos", () => {
  const cert = { "ISO 9001": { validade: "2099-12-31", arquivoUrl: arquivo } };
  assert.equal(helpers.validarCertificados(JSON.stringify(cert), ["ISO 9001"]), true);
  assert.equal(helpers.validarCertificados(undefined, ["ISO 9001"]), false);
  assert.equal(helpers.validarCertificados(JSON.stringify(cert), ["ISO 14001"]), false);
  assert.equal(helpers.validarCertificados(JSON.stringify(cert), ["ISO 9001", "ISO 14001"]), false);
  for (const validade of ["2020-01-01", "2099-02-31", "inválida"]) {
    cert["ISO 9001"].validade = validade;
    assert.equal(helpers.validarCertificados(JSON.stringify(cert), ["ISO 9001"]), false);
  }
});

test("logo exige imagem e escopo exige serviço/categoria e estado reais", () => {
  assert.equal(helpers.arquivoValido(arquivo, true), false);
  assert.equal(helpers.arquivoValido(arquivo.replace(".pdf", ".png"), true), true);
  assert.equal(helpers.validarEscopo("SP — São Paulo", ["Consultoria::Consultoria para Nova Certificação"], ["ISO 9001"]), null);
  assert.ok(helpers.validarEscopo("São Paulo", [], ["ISO 9001"]));
  assert.ok(helpers.validarEscopo("SP — São Paulo", ["Consultoria::Nova Certificação"], ["ISO 9001"]));
});

test("suspensão administrativa, remoção, rejeição e pendência não podem ser reativadas pela certificadora", async () => {
  for (const status of ["SUSPENSA_ADMIN", "REMOVIDA", "REJEITADA", "PENDENTE_APROVACAO", "PAUSADA"]) {
    const prisma = { listagem: {
      findFirst: async () => ({ isoTipo: "ISO 9001", estado: "SP — São Paulo", tipoServico: "Consultoria", categoriaServico: "Consultoria para Nova Certificação", User: { statusVendedor: "APROVADO", isosVendidas: "ISO 9001", estadosAtuacao: '["SP — São Paulo"]', servicosCategorias: '["Consultoria::Consultoria para Nova Certificação"]' } }),
      updateMany: async ({ where }) => ({ count: where.status.in.includes(status) ? 1 : 0 }),
    } };
    const actions = load("app/actions/normas.ts", { "@/app/lib/prisma": { prisma }, "./auth": { getSession: async () => ({ id: "vendedor", role: "VENDEDOR", statusVendedor: "APROVADO" }) } });
    assert.equal((await actions.atualizarStatusListagem(1, "ATIVA")).success, status === "PAUSADA");
  }
});

test("conta suspensa ou comprador não pode alterar listagens", async () => {
  for (const session of [{ role: "VENDEDOR", statusVendedor: "SUSPENSO" }, { role: "COMPRADOR", statusVendedor: "APROVADO" }, null]) {
    const actions = load("app/actions/normas.ts", { "@/app/lib/prisma": { prisma: {} }, "./auth": { getSession: async () => session } });
    assert.equal((await actions.atualizarStatusListagem(1, "ATIVA")).success, false);
  }
});

test("match aplica os quatro critérios e exige certificadora aprovada", async () => {
  const calls = [];
  const prisma = { listagem: { findMany: async (args) => { calls.push(args); return []; } } };
  const actions = load("app/actions/servicos.ts", { "@/app/lib/prisma": { prisma }, "./ranking": { atualizarRank: async () => {} } });
  await actions.consultarServicos({ tipoServico: "Consultoria", categoriaServico: "Consultoria para Nova Certificação", normas: ["ISO 9001"], estados: ["SP — São Paulo"] });
  const filter = calls[0].where;
  assert.equal(filter.tipoServico, "Consultoria");
  assert.equal(filter.categoriaServico, "Consultoria para Nova Certificação");
  assert.equal(filter.isoTipo.in[0], "ISO 9001");
  assert.equal(filter.estado.in[0], "SP — São Paulo");
  assert.equal(filter.User.is.statusVendedor, "APROVADO");
});

test("busca incompleta não consulta nem indica fornecedores", async () => {
  const actions = load("app/actions/servicos.ts", { "@/app/lib/prisma": { prisma: {} }, "./ranking": { atualizarRank: async () => {} } });
  assert.equal((await actions.consultarServicos({ normas: ["ISO 9001"], estados: ["SP — São Paulo"] })).success, false);
});

test("cadastro por chamada direta rejeita escopo e anexos ausentes antes de gravar", async () => {
  let creates = 0;
  const actions = load("app/actions/cadastro.ts", {
    "@/app/lib/prisma": { prisma: { user: { findFirst: async () => null }, solicitacaoCadastro: { findFirst: async () => null, create: async () => { creates++; } } } },
    bcryptjs: { hash: async () => "hash" },
    "@/app/lib/email": { enviarEmailSolicitacaoRecebida: async () => {} },
  });
  const base = { nome: "Empresa", email: "empresa@example.com", telefone: "+55 (11) 9 1234-5678", estado: "SP — São Paulo", senha: "Senha1234", isosVendidas: "ISO 9001" };
  assert.equal((await actions.solicitarCadastro(base)).success, false);
  assert.equal((await actions.solicitarCadastro({ ...base, servicosCategorias: '["Consultoria::Consultoria para Nova Certificação"]' })).success, false);
  assert.equal(creates, 0);
});

test("80 certificados na mesma rede não atingem a quota de upload", async () => {
  const upload = load("app/api/upload/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    path: { join: (...parts) => parts.join("/") },
    crypto: { randomUUID: () => "12345678-1234-1234-1234-123456789abc" },
    "fs/promises": { mkdir: async () => {}, writeFile: async () => {} },
  }, { Buffer, File, process: { env: {}, cwd: () => "/test" } });
  for (let i = 0; i < 81; i++) {
    const form = new FormData();
    form.append("file", new File(["%PDF-1.7 teste"], "certificado.pdf", { type: "application/pdf" }));
    const request = { headers: new Headers({ "content-type": "multipart/form-data", "origin": "https://teste.example", "x-forwarded-for": "127.0.0.1" }), nextUrl: { origin: "https://teste.example" }, formData: async () => form };
    assert.equal((await upload.POST(request)).status, 200);
  }
});

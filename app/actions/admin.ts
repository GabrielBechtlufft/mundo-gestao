"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailAprovacaoVendedor, enviarEmailRejeicaoVendedor } from "@/app/lib/email";
import { getSession } from "./auth";
import { certificadosDoCadastro, listagemNoEscopo, validarEscopo } from "@/app/lib/cadastro";

const SENHA_PADRAO = "senha@123";
const MAX_MOTIVO = 500;

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function getSolicitacoes() {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", solicitacoes: [] };

  const solicitacoes = await prisma.solicitacaoCadastro.findMany({
    omit: { senhaHash: true },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, solicitacoes };
}

export async function getFuncionarios(vendedorId: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", funcionarios: [] };

  const funcionarios = await prisma.funcionarioVendedor.findMany({
    where: { userId: vendedorId },
    orderBy: { createdAt: "asc" },
  });
  return { success: true, funcionarios };
}

export async function aprovarVendedor(solicitacaoId: number) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  const sol = await prisma.solicitacaoCadastro.findUnique({ where: { id: solicitacaoId } });
  if (!sol) return { success: false, error: "Solicitação não encontrada" };

  if (sol.status !== "PENDENTE") return { success: false, error: "Esta solicitação já foi analisada." };

  const existente = await prisma.user.findFirst({ where: { OR: [{ email: sol.email }, { login: sol.email }] } });
  if (existente) return { success: false, error: "Já existe uma conta com este e-mail." };

  const senhaHash = sol.senhaHash || await bcrypt.hash(SENHA_PADRAO, 10);

  const validadeCert = sol.validadeCertificado
    ? new Date(sol.validadeCertificado + "T12:00:00")
    : null;

  const novoVendedor = await prisma.user.create({
    data: {
      name: sol.nome,
      login: sol.email,
      email: sol.email,
      password: senhaHash,
      role: "VENDEDOR",
      statusVendedor: "APROVADO",
      trocarSenha: !sol.senhaHash,
      isosVendidas: sol.isosVendidas,
      servicosCategorias: sol.servicosCategorias,
      estadosAtuacao: JSON.stringify([sol.estado].filter(Boolean)),
      logo: sol.logo,
      certificacoesISO: certificadosDoCadastro(sol.certificacoesISO).length ? sol.certificacoesISO : sol.documentoComprovante ? JSON.stringify(sol.isosVendidas.split(",").map((iso) => ({ iso: iso.trim(), validade: sol.validadeCertificado || "", documento: sol.documentoComprovante }))) : null,
      cnpj: sol.cnpj || null,
      razaoSocial: sol.nome,
      validadeCertificado: validadeCert,
    },
  });

  await prisma.solicitacaoCadastro.update({
    where: { id: solicitacaoId },
    data: { status: "APROVADO" },
  });

  await prisma.notificacao.create({
    data: {
      userId: novoVendedor.id,
      mensagem: `Parabéns! O cadastro da empresa ${sol.nome} foi aprovado. Faça login com o e-mail ${sol.email} e a senha definida no cadastro.`,
      tipo: "APROVACAO",
    },
  });

  try {
    await enviarEmailAprovacaoVendedor(sol.email, sol.nome, Boolean(sol.senhaHash));
  } catch (err) {
    console.error("[Email] Erro ao enviar email de aprovação:", err);
  }

  return { success: true };
}

export async function rejeitarVendedor(solicitacaoId: number, motivo: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  if (!motivo || motivo.trim() === "") {
    return { success: false, error: "O motivo da rejeição é obrigatório." };
  }

  if (motivo.trim().length > MAX_MOTIVO) {
    return { success: false, error: `O motivo deve ter no máximo ${MAX_MOTIVO} caracteres.` };
  }

  const sol = await prisma.solicitacaoCadastro.findUnique({ where: { id: solicitacaoId } });
  if (!sol) return { success: false, error: "Solicitação não encontrada." };
  if (sol.status !== "PENDENTE") return { success: false, error: "Esta solicitação já foi analisada." };

  await prisma.solicitacaoCadastro.update({
    where: { id: solicitacaoId },
    data: { status: "REJEITADO", motivoRejeicao: motivo.trim() },
  });

  try {
    await enviarEmailRejeicaoVendedor(sol.email, sol.nome, motivo.trim());
  } catch (err) {
    console.error("[Email] Erro ao enviar email de rejeição:", err);
  }

  return { success: true };
}

export async function getVendedoresAtivos() {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", vendedores: [] };

  const vendedores = await prisma.user.findMany({
    where: { role: "VENDEDOR" },
    select: {
      id: true, name: true, email: true, statusVendedor: true,
      razaoSocial: true, cnpj: true, isosVendidas: true, validadeCertificado: true, logo: true,
      estadosAtuacao: true, servicosCategorias: true, certificacoesISO: true,
      _count: { select: { normas: true } },
    },
    orderBy: { name: "asc" },
  });
  return { success: true, vendedores };
}

export async function getClientes() {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", clientes: [] };
  const clientes = await prisma.user.findMany({
    where: { role: "COMPRADOR" },
    select: { id: true, name: true, email: true, login: true, statusVendedor: true },
    orderBy: { name: "asc" },
  });
  return { success: true, clientes };
}

export async function suspenderCliente(clienteId: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  const cliente = await prisma.user.findFirst({ where: { id: clienteId, role: "COMPRADOR" }, select: { id: true } });
  if (!cliente) return { success: false, error: "Cliente não encontrado." };
  await prisma.user.update({
    where: { id: clienteId },
    data: { statusVendedor: "SUSPENSO", sessionVersion: { increment: 1 } },
  });
  return { success: true };
}

export async function reativarCliente(clienteId: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  const cliente = await prisma.user.findFirst({ where: { id: clienteId, role: "COMPRADOR" }, select: { id: true } });
  if (!cliente) return { success: false, error: "Cliente não encontrado." };
  await prisma.user.update({ where: { id: clienteId }, data: { statusVendedor: "APROVADO" } });
  return { success: true };
}

export async function excluirCliente(clienteId: string) {
  // Exclusão lógica preserva o histórico de propostas e negociações.
  return suspenderCliente(clienteId);
}

export async function excluirVendedor(vendedorId: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  const vendedor = await prisma.user.findFirst({ where: { id: vendedorId, role: "VENDEDOR" }, select: { id: true } });
  if (!vendedor) return { success: false, error: "Certificadora não encontrada." };
  await prisma.listagem.updateMany({ where: { userId: vendedorId }, data: { status: "REMOVIDA" } });
  await prisma.user.update({ where: { id: vendedorId }, data: { statusVendedor: "SUSPENSO", sessionVersion: { increment: 1 } } });
  return { success: true };
}

export async function excluirListagemAdmin(id: number) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  await prisma.listagem.update({ where: { id }, data: { status: "REMOVIDA" } });
  return { success: true };
}

export async function getNormasAdmin() {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", normas: [] };
  const normas = await prisma.listagem.findMany({
    include: { User: { select: { name: true, razaoSocial: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, normas };
}

export async function suspenderListagemAdmin(id: number) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  const result = await prisma.listagem.updateMany({ where: { id, status: { in: ["ATIVA", "PAUSADA"] } }, data: { status: "SUSPENSA_ADMIN" } });
  return result.count ? { success: true } : { success: false, error: "Esta listagem não pode ser suspensa." };
}

export async function reativarListagemAdmin(id: number) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  const listagem = await prisma.listagem.findUnique({ where: { id }, include: { User: { select: { statusVendedor: true, isosVendidas: true, servicosCategorias: true, estadosAtuacao: true } } } });
  if (!listagem || !listagemNoEscopo(listagem)) return { success: false, error: "Confira o escopo e a aprovação da certificadora antes de reativar." };
  const result = await prisma.listagem.updateMany({
    where: { id, status: { in: ["SUSPENSA_ADMIN", "PAUSADA"] }, User: { is: { statusVendedor: "APROVADO" } } },
    data: { status: "ATIVA" },
  });
  return result.count ? { success: true } : { success: false, error: "Reative a certificadora antes da listagem. Listagens removidas ou rejeitadas não podem ser reativadas." };
}

export async function getVendedoresSuspensos() {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", vendedores: [] };

  const vendedores = await prisma.user.findMany({
    where: { role: "VENDEDOR", statusVendedor: "SUSPENSO" },
    select: {
      id: true, name: true, email: true, razaoSocial: true, cnpj: true,
      isosVendidas: true, validadeCertificado: true,
      _count: { select: { normas: true } },
    },
    orderBy: { name: "asc" },
  });
  return { success: true, vendedores };
}

export async function suspenderVendedor(vendedorId: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  await prisma.user.update({ where: { id: vendedorId }, data: { statusVendedor: "SUSPENSO", sessionVersion: { increment: 1 } } });
  await prisma.listagem.updateMany({ where: { userId: vendedorId, status: { in: ["ATIVA", "PAUSADA"] } }, data: { status: "SUSPENSA_ADMIN" } });
  return { success: true };
}

export async function reativarVendedor(vendedorId: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  await prisma.user.update({ where: { id: vendedorId }, data: { statusVendedor: "APROVADO" } });
  return { success: true };
}

export async function getNormasPendentes() {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão", normas: [] };

  const normas = await prisma.listagem.findMany({
    where: { status: "PENDENTE_APROVACAO" },
    include: {
      User: { select: { id: true, name: true, email: true, razaoSocial: true, rankTier: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, normas };
}

export async function aprovarListagem(id: number) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  const listagem = await prisma.listagem.findUnique({ where: { id }, include: { User: { select: { statusVendedor: true, isosVendidas: true, servicosCategorias: true, estadosAtuacao: true } } } });
  if (!listagem) return { success: false, error: "Listagem não encontrada" };
  if (listagem.status !== "PENDENTE_APROVACAO" || listagem.User?.statusVendedor !== "APROVADO") return { success: false, error: "A listagem precisa estar pendente e a certificadora aprovada." };
  if (!listagemNoEscopo(listagem)) return { success: false, error: "A listagem não corresponde ao escopo atual da certificadora." };

  await prisma.listagem.update({ where: { id }, data: { status: "ATIVA" } });

  if (listagem.userId) {
    await prisma.notificacao.create({
      data: {
        userId: listagem.userId,
        mensagem: `Sua listagem "${listagem.titulo}" (${listagem.isoTipo}) foi aprovada e já está visível para compradores.`,
        tipo: "APROVACAO",
      },
    });
  }

  return { success: true };
}

export async function rejeitarListagem(id: number, motivo: string) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  if (!motivo?.trim()) return { success: false, error: "O motivo é obrigatório." };

  if (motivo.trim().length > MAX_MOTIVO) {
    return { success: false, error: `O motivo deve ter no máximo ${MAX_MOTIVO} caracteres.` };
  }

  const listagem = await prisma.listagem.findUnique({ where: { id } });
  if (!listagem) return { success: false, error: "Listagem não encontrada" };

  await prisma.listagem.update({
    where: { id },
    data: { status: "REJEITADA", motivoRejeicao: motivo.trim() },
  });

  if (listagem.userId) {
    await prisma.notificacao.create({
      data: {
        userId: listagem.userId,
        mensagem: `Sua listagem "${listagem.titulo}" (${listagem.isoTipo}) foi rejeitada. Motivo: ${motivo.trim()}`,
        tipo: "REJEICAO",
      },
    });
  }

  return { success: true };
}

export async function cadastrarVendedorDireto(data: { name: string; email: string; login: string }) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { login: data.login }] },
    });

    if (existing) {
      return { success: false, error: "E-mail ou Login já cadastrado." };
    }

    const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        login: data.login,
        password: senhaHash,
        role: "VENDEDOR",
        statusVendedor: "APROVADO",
        trocarSenha: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao cadastrar vendedor." };
  }
}

export async function atualizarEscopoVendedorAdmin(id: string, data: { normas: string[]; servicos: string[]; estados: string[] }) {
  if (!await requireAdmin()) return { success: false, error: "Sem permissão" };
  if (!data.estados.length || data.estados.some((estado) => validarEscopo(estado, data.servicos, data.normas))) return { success: false, error: "Selecione normas, serviços e estados válidos." };
  const vendedor = await prisma.user.findFirst({ where: { id, role: "VENDEDOR" } });
  if (!vendedor) return { success: false, error: "Certificadora não encontrada." };
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data: { isosVendidas: data.normas.join(","), servicosCategorias: JSON.stringify(data.servicos), estadosAtuacao: JSON.stringify(data.estados) } });
    const listagens = await tx.listagem.findMany({ where: { userId: id, status: "ATIVA" } });
    const ids = listagens.filter((item) => !listagemNoEscopo({ ...item, User: user })).map((item) => item.id);
    if (ids.length) await tx.listagem.updateMany({ where: { id: { in: ids } }, data: { status: "SUSPENSA_ADMIN" } });
  });
  return { success: true };
}

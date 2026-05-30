"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailAprovacaoVendedor, enviarEmailRejeicaoVendedor } from "@/app/lib/email";

const SENHA_PADRAO = "senha@123";

export async function getSolicitacoes() {
  const solicitacoes = await prisma.solicitacaoCadastro.findMany({
    orderBy: { createdAt: "desc" },
  });
  return { success: true, solicitacoes };
}

export async function getFuncionarios(vendedorId: string) {
  const funcionarios = await prisma.funcionarioVendedor.findMany({
    where: { userId: vendedorId },
    orderBy: { createdAt: "asc" },
  });
  return { success: true, funcionarios };
}

export async function aprovarVendedor(solicitacaoId: number) {
  const sol = await prisma.solicitacaoCadastro.findUnique({ where: { id: solicitacaoId } });
  if (!sol) return { success: false, error: "Solicitação não encontrada" };

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

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
      trocarSenha: true,
      isosVendidas: sol.isosVendidas,
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
      mensagem: `Parabéns! O cadastro da empresa ${sol.nome} foi aprovado. Faça login com o e-mail ${sol.email} e a senha provisória: ${SENHA_PADRAO}`,
      tipo: "APROVACAO",
    },
  });

  try {
    await enviarEmailAprovacaoVendedor(sol.email, sol.nome);
  } catch (err) {
    console.error("[Email] Erro ao enviar email de aprovação:", err);
  }

  return { success: true };
}

export async function rejeitarVendedor(solicitacaoId: number, motivo: string) {
  if (!motivo || motivo.trim() === "") {
    return { success: false, error: "O motivo da rejeição é obrigatório." };
  }

  const sol = await prisma.solicitacaoCadastro.findUnique({ where: { id: solicitacaoId } });
  if (!sol) return { success: false, error: "Solicitação não encontrada." };

  await prisma.solicitacaoCadastro.update({
    where: { id: solicitacaoId },
    data: { status: "REJEITADO", motivoRejeicao: motivo },
  });

  try {
    await enviarEmailRejeicaoVendedor(sol.email, sol.nome, motivo);
  } catch (err) {
    console.error("[Email] Erro ao enviar email de rejeição:", err);
  }

  return { success: true };
}

export async function getVendedoresAtivos() {
  const vendedores = await prisma.user.findMany({
    where: { role: "VENDEDOR" },
    select: {
      id: true, name: true, email: true, statusVendedor: true,
      razaoSocial: true, cnpj: true, isosVendidas: true, validadeCertificado: true,
      _count: { select: { listagens: true } },
    },
    orderBy: { name: "asc" },
  });
  return { success: true, vendedores };
}

export async function suspenderVendedor(vendedorId: string) {
  await prisma.user.update({ where: { id: vendedorId }, data: { statusVendedor: "SUSPENSO" } });
  await prisma.listagem.updateMany({ where: { userId: vendedorId }, data: { status: "PAUSADA" } });
  return { success: true };
}

export async function reativarVendedor(vendedorId: string) {
  await prisma.user.update({ where: { id: vendedorId }, data: { statusVendedor: "APROVADO" } });
  return { success: true };
}

export async function getListagensPendentes() {
  const listagens = await prisma.listagem.findMany({
    where: { status: "PENDENTE_APROVACAO" },
    include: {
      User: { select: { id: true, name: true, email: true, razaoSocial: true, rankTier: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, listagens };
}

export async function aprovarListagem(id: number) {
  const listagem = await prisma.listagem.findUnique({ where: { id } });
  if (!listagem) return { success: false, error: "Listagem não encontrada" };

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
  if (!motivo?.trim()) return { success: false, error: "O motivo é obrigatório." };

  const listagem = await prisma.listagem.findUnique({ where: { id } });
  if (!listagem) return { success: false, error: "Listagem não encontrada" };

  await prisma.listagem.update({
    where: { id },
    data: { status: "REJEITADA", motivoRejeicao: motivo },
  });

  if (listagem.userId) {
    await prisma.notificacao.create({
      data: {
        userId: listagem.userId,
        mensagem: `Sua listagem "${listagem.titulo}" (${listagem.isoTipo}) foi rejeitada. Motivo: ${motivo}`,
        tipo: "REJEICAO",
      },
    });
  }

  return { success: true };
}

export async function cadastrarVendedorDireto(data: { name: string; email: string; login: string }) {
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

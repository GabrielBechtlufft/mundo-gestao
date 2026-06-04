"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

async function getVendedorId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user || user.role !== "VENDEDOR") return null;
  return user.id;
}

export async function listarFuncionarios() {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado", funcionarios: [] };

  const funcionarios = await prisma.funcionarioVendedor.findMany({
    where: { userId },
    include: { LinkedUser: { select: { id: true, login: true, trocarSenha: true } } },
    orderBy: { createdAt: "asc" },
  });
  return { success: true, funcionarios };
}

export async function adicionarFuncionario(data: {
  nome: string;
  cargo?: string;
  email?: string;
}) {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado" };

  if (!data.nome || data.nome.trim() === "") {
    return { success: false, error: "O nome do funcionário é obrigatório." };
  }

  const funcionario = await prisma.funcionarioVendedor.create({
    data: {
      userId,
      nome: data.nome.trim(),
      cargo: data.cargo?.trim() || null,
      email: data.email?.trim() || null,
      ativo: true,
    },
  });

  return { success: true, funcionario };
}

export async function removerFuncionario(funcionarioId: number) {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado" };

  const funcionario = await prisma.funcionarioVendedor.findUnique({
    where: { id: funcionarioId },
  });

  if (!funcionario || funcionario.userId !== userId) {
    return { success: false, error: "Funcionário não encontrado." };
  }

  // Remove a conta vinculada se existir
  if (funcionario.linkedUserId) {
    await prisma.user.delete({ where: { id: funcionario.linkedUserId } });
  }

  await prisma.funcionarioVendedor.delete({ where: { id: funcionarioId } });
  return { success: true };
}

export async function atualizarFuncionario(
  funcionarioId: number,
  data: { nome?: string; cargo?: string; email?: string; ativo?: boolean }
) {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado" };

  const funcionario = await prisma.funcionarioVendedor.findUnique({
    where: { id: funcionarioId },
  });

  if (!funcionario || funcionario.userId !== userId) {
    return { success: false, error: "Funcionário não encontrado." };
  }

  const updated = await prisma.funcionarioVendedor.update({
    where: { id: funcionarioId },
    data: {
      nome: data.nome?.trim() ?? funcionario.nome,
      cargo: data.cargo !== undefined ? (data.cargo.trim() || null) : funcionario.cargo,
      email: data.email !== undefined ? (data.email.trim() || null) : funcionario.email,
      ativo: data.ativo !== undefined ? data.ativo : funcionario.ativo,
    },
  });

  return { success: true, funcionario: updated };
}

export async function criarContaFuncionario(funcionarioId: number) {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado" };

  const funcionario = await prisma.funcionarioVendedor.findUnique({
    where: { id: funcionarioId },
  });

  if (!funcionario || funcionario.userId !== userId) {
    return { success: false, error: "Funcionário não encontrado." };
  }

  if (funcionario.linkedUserId) {
    return { success: false, error: "Este funcionário já possui uma conta." };
  }

  // Gera login único baseado no nome
  const base = funcionario.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");

  let login = base;
  let tentativa = 0;
  while (await prisma.user.findUnique({ where: { login } })) {
    tentativa++;
    login = `${base}${tentativa}`;
  }

  const senhaHash = await bcrypt.hash("senha@123", 10);

  const user = await prisma.user.create({
    data: {
      name: funcionario.nome,
      login,
      email: funcionario.email || null,
      password: senhaHash,
      role: "FUNCIONARIO",
      statusVendedor: "APROVADO",
      trocarSenha: true,
    },
  });

  await prisma.funcionarioVendedor.update({
    where: { id: funcionarioId },
    data: { linkedUserId: user.id },
  });

  return { success: true, login, senhaTemporaria: "senha@123" };
}

export async function removerContaFuncionario(funcionarioId: number) {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado" };

  const funcionario = await prisma.funcionarioVendedor.findUnique({
    where: { id: funcionarioId },
  });

  if (!funcionario || funcionario.userId !== userId) {
    return { success: false, error: "Funcionário não encontrado." };
  }

  if (!funcionario.linkedUserId) {
    return { success: false, error: "Este funcionário não possui conta." };
  }

  await prisma.user.delete({ where: { id: funcionario.linkedUserId } });
  await prisma.funcionarioVendedor.update({
    where: { id: funcionarioId },
    data: { linkedUserId: null },
  });

  return { success: true };
}

export async function atribuirFuncionarioAChat(propostaId: number, funcionarioId: number | null) {
  const userId = await getVendedorId();
  if (!userId) return { success: false, error: "Não autorizado" };

  // Verifica que a proposta pertence ao vendedor
  const proposta = await prisma.proposta.findUnique({
    where: { id: propostaId },
    select: { vendedorId: true },
  });

  if (!proposta || proposta.vendedorId !== userId) {
    return { success: false, error: "Proposta não encontrada." };
  }

  // Verifica que o funcionário pertence ao vendedor (se não for null)
  if (funcionarioId !== null) {
    const funcionario = await prisma.funcionarioVendedor.findUnique({
      where: { id: funcionarioId },
    });
    if (!funcionario || funcionario.userId !== userId) {
      return { success: false, error: "Funcionário não encontrado." };
    }
  }

  await prisma.proposta.update({
    where: { id: propostaId },
    data: { funcionarioId },
  });

  return { success: true };
}

export async function listarFuncionariosParaAtribuicao() {
  const userId = await getVendedorId();
  if (!userId) return { success: false, funcionarios: [] };

  const funcionarios = await prisma.funcionarioVendedor.findMany({
    where: { userId, ativo: true },
    select: { id: true, nome: true, cargo: true, linkedUserId: true },
    orderBy: { nome: "asc" },
  });

  return { success: true, funcionarios };
}

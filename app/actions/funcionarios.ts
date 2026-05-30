"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

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

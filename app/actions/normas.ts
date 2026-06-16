"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";

export async function getMinhasISOs(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { isosVendidas: true } });
  if (!user?.isosVendidas) return [];
  return user.isosVendidas.split(",").map((s: string) => s.trim()).filter(Boolean);
}

export async function getMinhasNormas() {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const normas = await prisma.listagem.findMany({
    where: { userId: session.id },
    include: { _count: { select: { contatos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, normas };
}

export async function criarListagem(data: {
  isoTipo: string; titulo: string; descricao: string;
  cidade: string; imagem?: string;
  tipoServico?: string; categoriaServico?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };
  if (session.statusVendedor !== "APROVADO") return { success: false, error: "Sua conta não está aprovada." };

  const isosPermitidas = await getMinhasISOs();
  if (isosPermitidas.length > 0 && !isosPermitidas.includes(data.isoTipo)) {
    return { success: false, error: "Você não está autorizado a vender este tipo de ISO." };
  }

  await prisma.listagem.create({ data: { ...data, userId: session.id, status: "PENDENTE_APROVACAO" } });
  return { success: true };
}

export async function atualizarStatusListagem(id: number, status: "ATIVA" | "PAUSADA" | "REMOVIDA") {
  const session = await getSession();
  if (!session) return { success: false };
  await prisma.listagem.updateMany({ where: { id, userId: session.id }, data: { status } });
  return { success: true };
}

export async function excluirListagem(id: number) {
  const session = await getSession();
  if (!session) return { success: false };
  await prisma.listagem.deleteMany({ where: { id, userId: session.id } });
  return { success: true };
}

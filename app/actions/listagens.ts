"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as any;
}

export async function getMinhasISOs(): Promise<string[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isosVendidas: true } });
  if (!user?.isosVendidas) return [];
  return user.isosVendidas.split(",").map((s: string) => s.trim()).filter(Boolean);
}

export async function getMinhasListagens() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const listagens = await prisma.listagem.findMany({
    where: { userId: user.id },
    include: { _count: { select: { contatos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, listagens };
}

export async function criarListagem(data: {
  isoTipo: string; titulo: string; descricao: string;
  cidade: string; imagem?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Não autenticado" };
  if (user.statusVendedor !== "APROVADO") return { success: false, error: "Sua conta não está aprovada." };

  // Validate ISO against user's allowed ISOs
  const isosPermitidas = await getMinhasISOs();
  if (isosPermitidas.length > 0 && !isosPermitidas.includes(data.isoTipo)) {
    return { success: false, error: "Você não está autorizado a vender este tipo de ISO." };
  }

  await prisma.listagem.create({ data: { ...data, userId: user.id, status: "PENDENTE_APROVACAO" } });
  return { success: true };
}

export async function atualizarStatusListagem(id: number, status: "ATIVA" | "PAUSADA" | "REMOVIDA") {
  const user = await getSessionUser();
  if (!user) return { success: false };
  await prisma.listagem.updateMany({ where: { id, userId: user.id }, data: { status } });
  return { success: true };
}

export async function excluirListagem(id: number) {
  const user = await getSessionUser();
  if (!user) return { success: false };
  await prisma.listagem.deleteMany({ where: { id, userId: user.id } });
  return { success: true };
}

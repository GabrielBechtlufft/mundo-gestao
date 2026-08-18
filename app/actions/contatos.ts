"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";

export async function registrarContato(listagemId: number, info?: string) {
  const session = await getSession();
  if (!session) return { success: false };

  try {
    await prisma.contato.create({
      data: { listagemId, info: info || null },
    });
    // Incrementa visualizações
    await prisma.listagem.update({
      where: { id: listagemId },
      data: { visualizacoes: { increment: 1 } },
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar contato:", error);
    return { success: false };
  }
}

"use server";

import { prisma } from "@/app/lib/prisma";

export async function getPropostas(userId?: string) {
  try {
    const propostas = await prisma.proposta.findMany({
      where: userId ? { userId } : undefined,
    });
    
    // Convertendo para o formato do Frontend (Pendentes e Concluídos)
    const pendentes = propostas.filter((p) => p.status === "Pendente");
    const concluidos = propostas.filter((p) => p.status === "Concluído");
    
    return { success: true, pendentes, concluidos };
  } catch (error) {
    console.error("Erro ao buscar propostas", error);
    return { success: false, error: "Falha ao buscar as propostas do banco" };
  }
}

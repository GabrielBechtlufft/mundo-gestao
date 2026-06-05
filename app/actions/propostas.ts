"use server";

import { prisma } from "@/app/lib/prisma";

export async function getPropostas() {
  try {
    const { prisma } = await import("@/app/lib/prisma");
    const { getSession } = await import("./auth");

    const session = await getSession();
    if (!session) return { success: false, error: "Não autenticado", pendentes: [], concluidos: [] };

    const where =
      session.role === "ADMIN"
        ? {}
        : { OR: [{ userId: session.id }, { compradorId: session.id }, { vendedorId: session.id }] };

    const propostas = await prisma.proposta.findMany({ where });

    const pendentes = propostas.filter((p) => p.status === "Pendente");
    const concluidos = propostas.filter((p) => p.status === "Concluído");

    return { success: true, pendentes, concluidos };
  } catch (error) {
    console.error("Erro ao buscar propostas", error);
    return { success: false, error: "Falha ao buscar as propostas do banco", pendentes: [], concluidos: [] };
  }
}

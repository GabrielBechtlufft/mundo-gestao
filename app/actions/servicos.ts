"use server";

import { prisma } from "@/app/lib/prisma";
import { atualizarRank } from "./ranking";

export async function consultarServicos(params: {
  tipoServico?: string;
  categoriaServico?: string;
  normas?: string[];
  cidades?: string[];
}) {
  const { tipoServico, categoriaServico, normas: normasFiltro, cidades } = params;

  const whereClause: Record<string, unknown> = { status: "ATIVA" };
  if (tipoServico)              whereClause.tipoServico      = tipoServico;
  if (categoriaServico)         whereClause.categoriaServico = categoriaServico;
  if (normasFiltro?.length)     whereClause.isoTipo          = { in: normasFiltro };
  if (cidades?.length)          whereClause.cidade           = { in: cidades };

  try {
    const ids = await prisma.listagem.findMany({
      where: whereClause,
      select: { userId: true },
    });

    const vendedorIds = [...new Set(ids.map((l) => l.userId).filter(Boolean))] as string[];
    await Promise.all(vendedorIds.map((id) => atualizarRank(id)));

    const resultado = await prisma.listagem.findMany({
      where: whereClause,
      include: {
        User: { select: { name: true, rankScore: true, rankTier: true } },
      },
      orderBy: [
        { User: { rankScore: "desc" } },
        { createdAt: "desc" },
      ],
    });

    return { success: true, servicos: resultado };
  } catch (error) {
    console.error("Erro ao consultar serviços:", error);
    return { success: false, error: "Falha ao buscar serviços" };
  }
}

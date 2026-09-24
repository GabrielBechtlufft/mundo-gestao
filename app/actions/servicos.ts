"use server";

import { prisma } from "@/app/lib/prisma";
import { atualizarRank } from "./ranking";

export async function consultarServicos(params: {
  tipoServico?: string;
  categoriaServico?: string;
  normas?: string[];
  estados?: string[];
}) {
  const { tipoServico, categoriaServico, normas, estados } = params;
  const where: Record<string, unknown> = { status: "ATIVA" };
  if (tipoServico) where.tipoServico = tipoServico;
  if (categoriaServico) where.categoriaServico = categoriaServico;
  if (normas?.length) where.isoTipo = { in: normas };
  if (estados?.length) where.estado = { in: estados };

  try {
    const matches = await prisma.listagem.findMany({ where, select: { userId: true } });
    const vendedorIds = [...new Set(matches.flatMap((item) => item.userId ? [item.userId] : []))];
    await Promise.all(vendedorIds.map(atualizarRank));
    const servicos = await prisma.listagem.findMany({
      where,
      include: { User: { select: { name: true, logo: true, rankScore: true, rankTier: true } } },
      orderBy: [{ User: { rankScore: "desc" } }, { createdAt: "desc" }],
    });
    return { success: true, servicos };
  } catch (error) {
    console.error("Erro ao consultar serviços:", error);
    return { success: false, error: "Falha ao buscar serviços" };
  }
}

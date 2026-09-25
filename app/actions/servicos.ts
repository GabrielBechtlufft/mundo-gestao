"use server";

import { prisma } from "@/app/lib/prisma";
import { atualizarRank } from "./ranking";
import { validarEscopo } from "@/app/lib/cadastro";
import type { Prisma } from "@prisma/client";

export async function consultarServicos(params: {
  tipoServico?: string;
  categoriaServico?: string;
  normas?: string[];
  estados?: string[];
}) {
  const { tipoServico, categoriaServico, normas, estados } = params;
  if (!tipoServico || !categoriaServico || !normas?.length || !estados?.length ||
    estados.some((estado) => validarEscopo(estado, [`${tipoServico}::${categoriaServico}`], normas))) {
    return { success: false, error: "Selecione serviço, categoria, norma e estado válidos." };
  }
  const where: Prisma.ListagemWhereInput = { status: "ATIVA", User: { is: { role: "VENDEDOR", statusVendedor: "APROVADO" } } };
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

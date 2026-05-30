"use server";

import { prisma } from "@/app/lib/prisma";
import { atualizarRank } from "./ranking";

export async function consultarServicos(tituloCuringa: string, cidade: string) {
  try {
    // Busca os vendedores únicos das listagens encontradas e recalcula o rank deles
    const listagens = await prisma.listagem.findMany({
      where: {
        status: "ATIVA",
        isoTipo: { contains: tituloCuringa },
        cidade:  { contains: cidade },
      },
      select: { userId: true },
    });

    const vendedorIds = [...new Set(listagens.map((l) => l.userId).filter(Boolean))] as string[];
    await Promise.all(vendedorIds.map((id) => atualizarRank(id)));

    // Busca novamente com o rank atualizado
    const resultado = await prisma.listagem.findMany({
      where: {
        status: "ATIVA",
        isoTipo: { contains: tituloCuringa },
        cidade:  { contains: cidade },
      },
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

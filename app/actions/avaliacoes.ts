"use server";

import { prisma } from "@/app/lib/prisma";
import { atualizarRank } from "./ranking";

export async function getAvaliacoes(listagemId: number) {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { listagemId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, avaliacoes };
  } catch (error) {
    console.error("Erro ao buscar avaliações", error);
    return { success: false, error: "Falha ao buscar avaliações" };
  }
}

export async function criarAvaliacao(
  listagemId: number,
  nomeAvaliador: string,
  nota: number,
  comentario: string
) {
  try {
    if (!nomeAvaliador.trim() || !comentario.trim()) {
      return { success: false, error: "Preencha todos os campos." };
    }
    if (nota < 1 || nota > 5) {
      return { success: false, error: "Nota deve ser entre 1 e 5." };
    }
    const avaliacao = await prisma.avaliacao.create({
      data: { listagemId, nomeAvaliador: nomeAvaliador.trim(), nota, comentario: comentario.trim() },
    });

    // Atualizar rank do vendedor desta listagem
    const listagem = await prisma.listagem.findUnique({
      where: { id: listagemId },
      select: { userId: true },
    });
    if (listagem?.userId) {
      await atualizarRank(listagem.userId);
    }

    return { success: true, avaliacao };
  } catch (error) {
    console.error("Erro ao criar avaliação", error);
    return { success: false, error: "Falha ao salvar avaliação" };
  }
}

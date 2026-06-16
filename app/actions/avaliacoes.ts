"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
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

export async function criarAvaliacao(listagemId: number, nota: number, comentario: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Você precisa estar logado para avaliar." };
    if (session.role !== "COMPRADOR") return { success: false, error: "Apenas compradores podem avaliar." };

    if (!comentario.trim()) return { success: false, error: "Escreva um comentário." };
    if (nota < 1 || nota > 5) return { success: false, error: "Nota deve ser entre 1 e 5." };

    const propostaFechada = await prisma.proposta.findFirst({
      where: { listagemId, compradorId: session.id, status: "PROPOSTA_FECHADA" },
    });
    if (!propostaFechada) {
      return { success: false, error: "Você só pode avaliar após a conclusão de uma negociação." };
    }

    const jaAvaliou = await prisma.avaliacao.findFirst({
      where: { listagemId, compradorId: session.id },
    });
    if (jaAvaliou) return { success: false, error: "Você já avaliou este serviço." };

    const avaliacao = await prisma.avaliacao.create({
      data: {
        listagemId,
        compradorId: session.id,
        nomeAvaliador: session.name ?? "Comprador",
        nota,
        comentario: comentario.trim(),
      },
    });

    const listagem = await prisma.listagem.findUnique({ where: { id: listagemId }, select: { userId: true } });
    if (listagem?.userId) await atualizarRank(listagem.userId);

    return { success: true, avaliacao };
  } catch (error) {
    console.error("Erro ao criar avaliação", error);
    return { success: false, error: "Falha ao salvar avaliação" };
  }
}

"use server";

import { prisma } from "@/app/lib/prisma";

export type RankTier = "BRONZE" | "PRATA" | "OURO" | "PLATINA";

const TIER_THRESHOLDS: Record<RankTier, number> = {
  BRONZE: 0,
  PRATA: 50,
  OURO: 150,
  PLATINA: 350,
};

const TIER_LABELS: Record<RankTier, string> = {
  BRONZE: "Bronze",
  PRATA: "Prata",
  OURO: "Ouro",
  PLATINA: "Platina",
};

const TIER_COLORS: Record<RankTier, { bg: string; text: string; border: string }> = {
  BRONZE: { bg: "#FDF1E8", text: "#92400E", border: "#CD7F32" },
  PRATA: { bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E" },
  OURO: { bg: "#FFFBEB", text: "#92400E", border: "#FFD700" },
  PLATINA: { bg: "#F5F3FF", text: "#6001D3", border: "#A855F7" },
};

function tierFromScore(score: number): RankTier {
  if (score >= TIER_THRESHOLDS.PLATINA) return "PLATINA";
  if (score >= TIER_THRESHOLDS.OURO) return "OURO";
  if (score >= TIER_THRESHOLDS.PRATA) return "PRATA";
  return "BRONZE";
}

export async function atualizarRank(vendedorId: string) {
  try {
    const vendedor = await prisma.user.findUnique({
      where: { id: vendedorId },
      include: {
        normas: {
          where: { status: { not: "REMOVIDA" } },
          include: { avaliacoes: true },
        },
        propostasVendedor: {
          where: { status: "PROPOSTA_FECHADA" },
        },
      },
    });

    if (!vendedor || vendedor.role !== "VENDEDOR") return;

    // +30 pts por proposta concluída
    const ptsConclusoes = vendedor.propostasVendedor.length * 30;

    // Pontos por avaliações: 5★=+20, 4★=+10, 3★=0, 2★=-5, 1★=-10
    const notaParaPontos = (nota: number) => {
      if (nota === 5) return 20;
      if (nota === 4) return 10;
      if (nota === 3) return 0;
      if (nota === 2) return -5;
      return -10;
    };
    const ptsAvaliacoes = vendedor.normas
      .flatMap((l) => l.avaliacoes)
      .reduce((acc, a) => acc + notaParaPontos(a.nota), 0);

    // +10 pts por primeira resposta rápida (< 24h)
    const propostasComResposta = await prisma.proposta.findMany({
      where: {
        vendedorId,
        primeiraRespostaVendedorAt: { not: null },
      },
      select: { createdAt: true, primeiraRespostaVendedorAt: true },
    });
    const ptsResposta = propostasComResposta.reduce((acc, p) => {
      if (!p.primeiraRespostaVendedorAt) return acc;
      const diffH = (p.primeiraRespostaVendedorAt.getTime() - p.createdAt.getTime()) / 3600000;
      return acc + (diffH <= 24 ? 10 : 0);
    }, 0);

    const score = Math.max(0, ptsConclusoes + ptsAvaliacoes + ptsResposta);
    const tier = tierFromScore(score);

    await prisma.user.update({
      where: { id: vendedorId },
      data: { rankScore: score, rankTier: tier },
    });
  } catch (error) {
    console.error("Erro ao atualizar rank:", error);
  }
}

export async function getRankInfo(tier: string) {
  const t = (tier as RankTier) in TIER_LABELS ? (tier as RankTier) : "BRONZE";
  return {
    label: TIER_LABELS[t],
    colors: TIER_COLORS[t],
    tier: t,
  };
}


"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import { atualizarRank } from "./ranking";

export async function getAdminMetrics() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;

  const [totalPropostas, concluidas, pendentes, canceladas, totalVendedores, totalListagens, solicitacoesPendentes] = await Promise.all([
    prisma.proposta.count(),
    prisma.proposta.count({ where: { status: "CONCLUIDA" } }),
    prisma.proposta.count({ where: { status: "PENDENTE" } }),
    prisma.proposta.count({ where: { status: "CANCELADA" } }),
    prisma.user.count({ where: { role: "VENDEDOR" } }),
    prisma.listagem.count({ where: { status: "ATIVA" } }),
    prisma.solicitacaoCadastro.count({ where: { status: "PENDENTE" } }),
  ]);

  const totalVendas = concluidas;

  // Proposals this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const propostasMes = await prisma.proposta.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  return {
    totalVendas,
    totalPropostas,
    concluidas,
    pendentes,
    canceladas,
    totalVendedores,
    totalListagens,
    solicitacoesPendentes,
    propostasMes,
  };
}

export async function getVendedorMetrics() {
  const session = await getSession();
  if (!session) return null;

  // Mantém o rank sempre atualizado ao carregar o dashboard
  if (session.role === "VENDEDOR") await atualizarRank(session.id);

  const [totalPropostas, concluidas, pendentes, listagens] = await Promise.all([
    prisma.proposta.count({ where: { vendedorId: session.id } }),
    prisma.proposta.count({ where: { vendedorId: session.id, status: "CONCLUIDA" } }),
    prisma.proposta.count({ where: { vendedorId: session.id, status: "PENDENTE" } }),
    prisma.listagem.findMany({
      where: { userId: session.id },
      select: { visualizacoes: true, status: true, isoTipo: true },
    }),
  ]);

  const totalVisualizacoes = listagens.reduce((acc, l) => acc + l.visualizacoes, 0);
  const listagensAtivas = listagens.filter(l => l.status === "ATIVA").length;
  const totalVendas = concluidas;

  // ISO distribution
  const isoCount: Record<string, number> = {};
  listagens.forEach(l => {
    isoCount[l.isoTipo] = (isoCount[l.isoTipo] || 0) + 1;
  });

  return {
    totalPropostas,
    concluidas,
    pendentes,
    totalVisualizacoes,
    listagensAtivas,
    totalVendas,
    isoCount,
  };
}

export async function getAdminChartData() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;

  // Proposals by ISO type
  const propostas = await prisma.proposta.findMany({
    include: { Listagem: { select: { isoTipo: true } } },
  });

  const porISO: Record<string, number> = {};
  propostas.forEach(p => {
    const iso = p.Listagem?.isoTipo || "Outros";
    porISO[iso] = (porISO[iso] || 0) + 1;
  });

  // Proposals by month (last 6 months)
  const now = new Date();
  const porMes: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await prisma.proposta.count({
      where: {
        createdAt: { gte: month, lt: nextMonth },
      },
    });
    const monthName = month.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    porMes.push({ label: monthName, value: count });
  }

  // Status distribution
  const statusCount = {
    pendentes: await prisma.proposta.count({ where: { status: "PENDENTE" } }),
    vendedorConfirmou: await prisma.proposta.count({ where: { status: "VENDEDOR_CONFIRMOU" } }),
    compradorConfirmou: await prisma.proposta.count({ where: { status: "COMPRADOR_CONFIRMOU" } }),
    concluidas: await prisma.proposta.count({ where: { status: "CONCLUIDA" } }),
    canceladas: await prisma.proposta.count({ where: { status: "CANCELADA" } }),
  };

  return { porISO, porMes, statusCount };
}

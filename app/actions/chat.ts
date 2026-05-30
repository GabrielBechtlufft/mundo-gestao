"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import { atualizarRank } from "./ranking";

export async function getMensagens(propostaId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const proposta = await prisma.proposta.findUnique({
    where: { id: propostaId },
    select: {
      compradorId: true,
      vendedorId: true,
      servico: true,
      status: true,
      Comprador: { select: { name: true } },
      Vendedor: { select: { name: true, rankTier: true } },
    },
  });

  if (!proposta) return { success: false, error: "Proposta não encontrada" };

  const isParticipant =
    proposta.compradorId === session.id || proposta.vendedorId === session.id;
  if (!isParticipant && session.role !== "ADMIN")
    return { success: false, error: "Sem permissão" };

  const mensagens = await prisma.mensagem.findMany({
    where: { propostaId },
    include: {
      Remetente: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    success: true,
    mensagens,
    proposta: {
      servico: proposta.servico,
      status: proposta.status,
      compradorNome: proposta.Comprador?.name ?? "Comprador",
      vendedorNome: proposta.Vendedor?.name ?? "Vendedor",
      vendedorRankTier: proposta.Vendedor?.rankTier ?? "BRONZE",
    },
    sessionId: session.id,
    sessionRole: session.role,
  };
}

export async function enviarMensagem(propostaId: number, texto: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };
  if (!texto.trim()) return { success: false, error: "Mensagem vazia" };

  const proposta = await prisma.proposta.findUnique({
    where: { id: propostaId },
    select: {
      compradorId: true,
      vendedorId: true,
      status: true,
      primeiraRespostaVendedorAt: true,
      createdAt: true,
    },
  });

  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.status === "CANCELADA")
    return { success: false, error: "Proposta cancelada" };

  const isParticipant =
    proposta.compradorId === session.id || proposta.vendedorId === session.id;
  if (!isParticipant) return { success: false, error: "Sem permissão" };

  const mensagem = await prisma.mensagem.create({
    data: {
      propostaId,
      remetenteId: session.id,
      texto: texto.trim(),
    },
    include: { Remetente: { select: { id: true, name: true, role: true } } },
  });

  // Registrar primeira resposta do vendedor para cálculo de rank
  const isVendedor = proposta.vendedorId === session.id;
  if (isVendedor && !proposta.primeiraRespostaVendedorAt) {
    await prisma.proposta.update({
      where: { id: propostaId },
      data: { primeiraRespostaVendedorAt: new Date() },
    });
    if (proposta.vendedorId) {
      await atualizarRank(proposta.vendedorId);
    }
  }

  // Notificar o outro participante
  const destinatarioId =
    session.id === proposta.compradorId
      ? proposta.vendedorId
      : proposta.compradorId;

  if (destinatarioId) {
    await prisma.notificacao.create({
      data: {
        userId: destinatarioId,
        mensagem: `Nova mensagem de ${session.name} na proposta.`,
        tipo: "INFO",
      },
    });
  }

  return { success: true, mensagem };
}

export async function marcarMensagensLidas(propostaId: number) {
  const session = await getSession();
  if (!session) return { success: false };

  await prisma.mensagem.updateMany({
    where: {
      propostaId,
      remetenteId: { not: session.id },
      lida: false,
    },
    data: { lida: true },
  });

  return { success: true };
}

export async function getMinhasConversas() {
  const session = await getSession();
  if (!session) return { success: false, conversas: [] };

  const propostas = await prisma.proposta.findMany({
    where: {
      OR: [{ compradorId: session.id }, { vendedorId: session.id }],
      status: { not: "CANCELADA" },
    },
    include: {
      Listagem: { select: { titulo: true, isoTipo: true } },
      Comprador: { select: { name: true, image: true } },
      Vendedor: { select: { name: true, image: true, rankTier: true } },
      mensagens: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { Remetente: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversas = await Promise.all(
    propostas.map(async (p) => {
      const naoLidas = await prisma.mensagem.count({
        where: { propostaId: p.id, remetenteId: { not: session.id }, lida: false },
      });
      return {
        id: p.id,
        titulo: p.Listagem?.titulo || p.servico,
        isoTipo: p.Listagem?.isoTipo || "",
        compradorNome: p.Comprador?.name || p.solicitante,
        compradorImagem: p.Comprador?.image || null,
        vendedorNome: p.Vendedor?.name || "—",
        vendedorImagem: p.Vendedor?.image || null,
        vendedorRankTier: p.Vendedor?.rankTier || "BRONZE",
        status: p.status,
        ultimaMensagem: p.mensagens[0]
          ? { texto: p.mensagens[0].texto, remetente: p.mensagens[0].Remetente.name, createdAt: p.mensagens[0].createdAt }
          : null,
        naoLidas,
        updatedAt: p.updatedAt,
      };
    })
  );

  return { success: true, conversas, sessionId: session.id, sessionRole: session.role };
}

export async function contarMensagensNaoLidas(propostaId: number) {
  const session = await getSession();
  if (!session) return 0;

  const count = await prisma.mensagem.count({
    where: {
      propostaId,
      remetenteId: { not: session.id },
      lida: false,
    },
  });

  return count;
}

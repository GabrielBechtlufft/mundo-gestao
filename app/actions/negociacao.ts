"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import { atualizarRank } from "./ranking";

export async function criarProposta(listagemId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const listagem = await prisma.listagem.findUnique({
    where: { id: listagemId },
    include: { User: true },
  });

  if (!listagem) return { success: false, error: "Listagem não encontrada" };
  if (!listagem.userId) return { success: false, error: "Listagem sem vendedor associado" };

  // Check if there's already an active proposal from this buyer for this listing
  const existente = await prisma.proposta.findFirst({
    where: {
      listagemId,
      compradorId: session.id,
      status: { notIn: ["CANCELADA", "CONCLUIDA"] },
    },
  });

  if (existente) return { success: false, error: "Você já tem uma proposta ativa para esta listagem." };

  const proposta = await prisma.proposta.create({
    data: {
      solicitante: session.name || "Comprador",
      servico: `${listagem.isoTipo} - ${listagem.titulo}`,
      status: "PENDENTE",
      listagemId,
      compradorId: session.id,
      vendedorId: listagem.userId,
      userId: listagem.userId,
    },
  });

  // Notify seller
  await prisma.notificacao.create({
    data: {
      userId: listagem.userId,
      mensagem: `Nova proposta recebida de ${session.name} para "${listagem.titulo}"`,
      tipo: "INFO",
    },
  });

  return { success: true, proposta };
}

export async function confirmarVendedor(propostaId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.vendedorId !== session.id) return { success: false, error: "Sem permissão" };
  if (proposta.status === "CONCLUIDA" || proposta.status === "CANCELADA") {
    return { success: false, error: "Proposta já finalizada" };
  }

  const novoStatus = proposta.compradorConfirmou ? "CONCLUIDA" : "VENDEDOR_CONFIRMOU";

  await prisma.proposta.update({
    where: { id: propostaId },
    data: {
      vendedorConfirmou: true,
      status: novoStatus,
      updatedAt: new Date(),
    },
  });

  if (novoStatus === "CONCLUIDA" && proposta.vendedorId) {
    await atualizarRank(proposta.vendedorId);
  }

  // Notify buyer
  if (proposta.compradorId) {
    await prisma.notificacao.create({
      data: {
        userId: proposta.compradorId,
        mensagem: `O vendedor confirmou a conclusão da proposta "${proposta.servico}". ${!proposta.compradorConfirmou ? "Agora é sua vez de confirmar e enviar o comprovante." : "Negociação concluída!"}`,
        tipo: "INFO",
      },
    });
  }

  return { success: true };
}

export async function confirmarComprador(propostaId: number, documentoCompra: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  if (!documentoCompra || documentoCompra.trim() === "") {
    return { success: false, error: "É obrigatório enviar o comprovante da compra." };
  }

  if (!documentoCompra.startsWith("/uploads/")) {
    return { success: false, error: "Comprovante inválido." };
  }

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.compradorId !== session.id) return { success: false, error: "Sem permissão" };
  if (proposta.status === "CONCLUIDA" || proposta.status === "CANCELADA") {
    return { success: false, error: "Proposta já finalizada" };
  }

  const novoStatus = proposta.vendedorConfirmou ? "CONCLUIDA" : "COMPRADOR_CONFIRMOU";

  await prisma.proposta.update({
    where: { id: propostaId },
    data: {
      compradorConfirmou: true,
      documentoCompra,
      status: novoStatus,
      updatedAt: new Date(),
    },
  });

  if (novoStatus === "CONCLUIDA" && proposta.vendedorId) {
    await atualizarRank(proposta.vendedorId);
  }

  // Notify seller
  if (proposta.vendedorId) {
    await prisma.notificacao.create({
      data: {
        userId: proposta.vendedorId,
        mensagem: `O comprador confirmou a conclusão da proposta "${proposta.servico}" e enviou o comprovante. ${!proposta.vendedorConfirmou ? "Agora é sua vez de confirmar." : "Negociação concluída!"}`,
        tipo: "INFO",
      },
    });
  }

  return { success: true };
}

export async function cancelarProposta(propostaId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };

  // Only buyer, seller, or admin can cancel
  const isParticipant = proposta.compradorId === session.id || proposta.vendedorId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isParticipant && !isAdmin) return { success: false, error: "Sem permissão" };

  if (proposta.status === "CONCLUIDA") {
    return { success: false, error: "Proposta já concluída, não pode ser cancelada." };
  }

  await prisma.proposta.update({
    where: { id: propostaId },
    data: { status: "CANCELADA", updatedAt: new Date() },
  });

  return { success: true };
}

export async function getPropostasVendedor() {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const propostas = await prisma.proposta.findMany({
    where: { vendedorId: session.id },
    include: {
      Listagem: { select: { isoTipo: true, titulo: true } },
      Comprador: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, propostas };
}

export async function getPropostasComprador() {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const propostas = await prisma.proposta.findMany({
    where: { compradorId: session.id },
    include: {
      Listagem: { select: { isoTipo: true, titulo: true } },
      Vendedor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, propostas };
}

export async function solicitarOrcamento(listagemId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "NAO_AUTENTICADO" };
  if (session.role !== "COMPRADOR") return { success: false, error: "APENAS_COMPRADOR" };

  // Reusa proposta existente (inclusive concluída, para manter histórico do chat)
  const existente = await prisma.proposta.findFirst({
    where: {
      listagemId,
      compradorId: session.id,
      status: { notIn: ["CANCELADA"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existente) return { success: true, propostaId: existente.id };

  const listagem = await prisma.listagem.findUnique({
    where: { id: listagemId },
    include: { User: true },
  });
  if (!listagem) return { success: false, error: "Listagem não encontrada" };
  if (!listagem.userId) return { success: false, error: "Listagem sem vendedor associado" };

  const proposta = await prisma.proposta.create({
    data: {
      solicitante: session.name || "Comprador",
      servico: `${listagem.isoTipo} - ${listagem.titulo}`,
      status: "PENDENTE",
      listagemId,
      compradorId: session.id,
      vendedorId: listagem.userId,
      userId: listagem.userId,
    },
  });

  await prisma.notificacao.create({
    data: {
      userId: listagem.userId,
      mensagem: `${session.name} solicitou um orçamento para "${listagem.titulo}"`,
      tipo: "INFO",
    },
  });

  return { success: true, propostaId: proposta.id };
}

export async function getTodasPropostas() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Sem permissão" };

  const propostas = await prisma.proposta.findMany({
    include: {
      Listagem: { select: { isoTipo: true, titulo: true } },
      Comprador: { select: { name: true, email: true, image: true } },
      Vendedor: { select: { name: true, email: true, image: true, razaoSocial: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, propostas };
}

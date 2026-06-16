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

  const existente = await prisma.proposta.findFirst({
    where: {
      listagemId,
      compradorId: session.id,
      status: { notIn: ["CANCELADA", "PROPOSTA_FECHADA"] },
    },
  });

  if (existente) return { success: false, error: "Você já tem uma proposta ativa para esta listagem." };

  const proposta = await prisma.proposta.create({
    data: {
      solicitante: session.name || "Comprador",
      servico: `${listagem.isoTipo} - ${listagem.titulo}`,
      status: "CONTATO_SOLICITADO",
      listagemId,
      compradorId: session.id,
      vendedorId: listagem.userId,
      userId: listagem.userId,
    },
  });

  await prisma.notificacao.create({
    data: {
      userId: listagem.userId,
      mensagem: `Nova solicitação de contato de ${session.name} para "${listagem.titulo}"`,
      tipo: "INFO",
    },
  });

  return { success: true, proposta };
}

export async function enviarPropostaVendedor(propostaId: number, documentoProposta: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  if (!documentoProposta || !documentoProposta.startsWith("/uploads/")) {
    return { success: false, error: "É obrigatório anexar um arquivo de proposta." };
  }

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.vendedorId !== session.id) return { success: false, error: "Sem permissão" };
  if (["PROPOSTA_FECHADA", "CANCELADA"].includes(proposta.status)) {
    return { success: false, error: "Proposta já finalizada" };
  }

  await prisma.proposta.update({
    where: { id: propostaId },
    data: { documentoProposta, status: "PROPOSTA_ENVIADA", updatedAt: new Date() },
  });

  if (proposta.compradorId) {
    await prisma.notificacao.create({
      data: {
        userId: proposta.compradorId,
        mensagem: `A certificadora enviou uma proposta para "${proposta.servico}". Acesse o chat para ver os detalhes.`,
        tipo: "INFO",
      },
    });
  }

  return { success: true };
}

export async function fecharProposta(propostaId: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Sem permissão" };

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.status === "PROPOSTA_FECHADA") return { success: false, error: "Proposta já fechada" };
  if (proposta.status === "CANCELADA") return { success: false, error: "Proposta cancelada" };

  await prisma.proposta.update({
    where: { id: propostaId },
    data: { status: "PROPOSTA_FECHADA", updatedAt: new Date() },
  });

  if (proposta.vendedorId) await atualizarRank(proposta.vendedorId);

  return { success: true };
}

export async function aceitarProposta(propostaId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.compradorId !== session.id) return { success: false, error: "Sem permissão" };
  if (proposta.status !== "PROPOSTA_ENVIADA") return { success: false, error: "Status inválido para aceite" };

  await prisma.proposta.update({
    where: { id: propostaId },
    data: { status: "EM_NEGOCIACAO", motivoRecusa: null, updatedAt: new Date() },
  });

  if (proposta.vendedorId) {
    await prisma.notificacao.create({
      data: {
        userId: proposta.vendedorId,
        mensagem: `O comprador aceitou sua proposta para "${proposta.servico}". A negociação está em andamento!`,
        tipo: "INFO",
      },
    });
  }

  return { success: true };
}

export async function recusarProposta(propostaId: number, motivo: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  if (!motivo || !motivo.trim()) return { success: false, error: "Informe o motivo da recusa." };

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.compradorId !== session.id) return { success: false, error: "Sem permissão" };
  if (proposta.status !== "PROPOSTA_ENVIADA") return { success: false, error: "Status inválido para recusa" };

  await prisma.proposta.update({
    where: { id: propostaId },
    data: { status: "PROPOSTA_RECUSADA", motivoRecusa: motivo.trim(), updatedAt: new Date() },
  });

  if (proposta.vendedorId) {
    await prisma.notificacao.create({
      data: {
        userId: proposta.vendedorId,
        mensagem: `O comprador recusou a proposta para "${proposta.servico}". Acesse os detalhes para ver o motivo e enviar uma nova proposta.`,
        tipo: "REJEICAO",
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

  const isParticipant = proposta.compradorId === session.id || proposta.vendedorId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isParticipant && !isAdmin) return { success: false, error: "Sem permissão" };

  if (proposta.status === "PROPOSTA_FECHADA") {
    return { success: false, error: "Proposta já fechada, não pode ser cancelada." };
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
      _count: {
        select: {
          mensagens: { where: { lida: false, remetenteId: { not: session.id } } },
        },
      },
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
      _count: {
        select: {
          mensagens: { where: { lida: false, remetenteId: { not: session.id } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, propostas };
}

export async function solicitarOrcamento(listagemId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "NAO_AUTENTICADO" };
  if (session.role !== "COMPRADOR") return { success: false, error: "APENAS_COMPRADOR" };

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
      status: "CONTATO_SOLICITADO",
      listagemId,
      compradorId: session.id,
      vendedorId: listagem.userId,
      userId: listagem.userId,
    },
  });

  await prisma.notificacao.create({
    data: {
      userId: listagem.userId,
      mensagem: `${session.name} solicitou contato para "${listagem.titulo}"`,
      tipo: "INFO",
    },
  });

  return { success: true, propostaId: proposta.id };
}

export async function confirmarNegociacao(propostaId: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) return { success: false, error: "Proposta não encontrada" };
  if (proposta.status === "PROPOSTA_FECHADA") return { success: false, error: "Negociação já concluída" };
  if (proposta.status === "CANCELADA") return { success: false, error: "Proposta cancelada" };

  const isVendedor = proposta.vendedorId === session.id;
  const isComprador = proposta.compradorId === session.id;
  if (!isVendedor && !isComprador) return { success: false, error: "Sem permissão" };

  if (isVendedor && proposta.vendedorConfirmou) return { success: false, error: "Você já confirmou a negociação" };
  if (isComprador && proposta.compradorConfirmou) return { success: false, error: "Você já confirmou a negociação" };

  const updated = await prisma.proposta.update({
    where: { id: propostaId },
    data: {
      ...(isVendedor ? { vendedorConfirmou: true } : {}),
      ...(isComprador ? { compradorConfirmou: true } : {}),
      updatedAt: new Date(),
    },
  });

  const ambosConcluiram = updated.vendedorConfirmou && updated.compradorConfirmou;

  if (ambosConcluiram) {
    await prisma.proposta.update({
      where: { id: propostaId },
      data: { status: "PROPOSTA_FECHADA", updatedAt: new Date() },
    });
    if (proposta.vendedorId) await atualizarRank(proposta.vendedorId);

    if (proposta.compradorId) {
      await prisma.notificacao.create({
        data: {
          userId: proposta.compradorId,
          mensagem: `Negociação concluída para "${proposta.servico}". Você já pode avaliar a certificadora!`,
          tipo: "INFO",
        },
      });
    }
    return { success: true, fechada: true };
  }

  // Move status to EM_NEGOCIACAO regardless of current status (one party confirmed)
  if (!["EM_NEGOCIACAO", "PROPOSTA_FECHADA", "CANCELADA"].includes(proposta.status)) {
    await prisma.proposta.update({
      where: { id: propostaId },
      data: { status: "EM_NEGOCIACAO", updatedAt: new Date() },
    });
  }

  const destinatarioId = isVendedor ? proposta.compradorId : proposta.vendedorId;
  if (destinatarioId) {
    const quem = isVendedor ? "A certificadora" : "O comprador";
    await prisma.notificacao.create({
      data: {
        userId: destinatarioId,
        mensagem: `${quem} confirmou o encerramento da negociação para "${proposta.servico}". Confirme para concluir.`,
        tipo: "INFO",
      },
    });
  }

  return { success: true, fechada: false };
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

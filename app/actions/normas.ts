"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import { stringList, validarEscopo, listagemNoEscopo } from "@/app/lib/cadastro";

export async function getMeuEscopo() {
  const session = await getSession();
  if (!session || session.role !== "VENDEDOR") return { normas: [], servicos: [], estados: [] };
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { isosVendidas: true, servicosCategorias: true, estadosAtuacao: true } });
  return { normas: user?.isosVendidas.split(",").map((iso) => iso.trim()).filter(Boolean) || [], servicos: stringList(user?.servicosCategorias), estados: stringList(user?.estadosAtuacao) };
}

export async function getMinhasISOs(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { isosVendidas: true } });
  if (!user?.isosVendidas) return [];
  return user.isosVendidas.split(",").map((s: string) => s.trim()).filter(Boolean);
}

export async function getMinhasNormas() {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const normas = await prisma.listagem.findMany({
    where: { userId: session.id },
    include: { _count: { select: { contatos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, normas };
}

export async function criarListagem(data: {
  isoTipo: string; titulo: string; descricao: string;
  estado: string; imagem?: string;
  tipoServico?: string; categoriaServico?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };
  if (session.role !== "VENDEDOR") return { success: false, error: "Apenas certificadoras podem criar listagens." };
  if (session.statusVendedor !== "APROVADO") return { success: false, error: "Sua conta não está aprovada." };

  const isosPermitidas = await getMinhasISOs();
  if (!isosPermitidas.includes(data.isoTipo)) {
    return { success: false, error: "Você não está autorizado a vender este tipo de ISO." };
  }

  const vendedor = await prisma.user.findUnique({ where: { id: session.id }, select: { servicosCategorias: true, estadosAtuacao: true } });
  const escopos = stringList(vendedor?.servicosCategorias);
  const estados = stringList(vendedor?.estadosAtuacao);
  const escopo = `${data.tipoServico}::${data.categoriaServico}`;
  const erro = validarEscopo(data.estado, [escopo], [data.isoTipo]);
  if (erro || !data.titulo.trim() || !data.descricao.trim()) return { success: false, error: erro || "Preencha título e descrição." };
  if (!escopos.includes(escopo)) return { success: false, error: "Este serviço/categoria não faz parte do escopo aprovado." };
  if (!estados.includes(data.estado)) return { success: false, error: "Este estado não faz parte da sua área de atuação aprovada." };

  await prisma.listagem.create({ data: { ...data, cidade: "", userId: session.id, status: "PENDENTE_APROVACAO" } });
  return { success: true };
}

export async function atualizarStatusListagem(id: number, status: "ATIVA" | "PAUSADA" | "REMOVIDA") {
  const session = await getSession();
  if (!session || session.role !== "VENDEDOR" || session.statusVendedor !== "APROVADO") return { success: false, error: "Sem permissão." };
  if (!["ATIVA", "PAUSADA", "REMOVIDA"].includes(status)) return { success: false, error: "Status inválido." };
  if (status === "ATIVA") {
    const listagem = await prisma.listagem.findFirst({ where: { id, userId: session.id }, include: { User: { select: { isosVendidas: true, servicosCategorias: true, estadosAtuacao: true, statusVendedor: true } } } });
    if (!listagem || !listagemNoEscopo(listagem)) return { success: false, error: "A listagem não corresponde ao escopo atual da certificadora." };
  }
  const anteriores = status === "ATIVA" ? ["PAUSADA"] : status === "PAUSADA" ? ["ATIVA"] : ["ATIVA", "PAUSADA", "REJEITADA", "PENDENTE_APROVACAO"];
  const result = await prisma.listagem.updateMany({ where: { id, userId: session.id, status: { in: anteriores } }, data: { status } });
  return result.count ? { success: true } : { success: false, error: "Esta listagem está bloqueada ou não permite essa alteração. Entre em contato com o administrador." };
}

export async function excluirListagem(id: number) {
  return atualizarStatusListagem(id, "REMOVIDA");
}

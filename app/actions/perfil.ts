"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import { atualizarRank } from "./ranking";
import { arquivoValido, escoposValidos } from "@/app/lib/cadastro";
import { ESTADOS } from "@/app/lib/estados";

async function getSessionUser() {
  return await getSession();
}

// ─── CERTIFICADORA ─────────────────────────────────────────────

export async function getPerfilVendedor() {
  const s = await getSessionUser();
  if (!s || s.role !== "VENDEDOR") return { success: false, error: "Não autorizado", perfil: null };

  // Recalcula o rank para garantir que o perfil e as normas mostrem o mesmo valor
  await atualizarRank(s.id);

  const perfil = await prisma.user.findUnique({
    where: { id: s.id },
    select: {
      id: true, name: true, email: true, login: true, image: true,
      razaoSocial: true, cnpj: true,
      validadeCertificado: true, isosVendidas: true,
      logo: true, servicosCategorias: true, estadosAtuacao: true, certificacoesISO: true,
      rankTier: true, rankScore: true, statusVendedor: true,
    },
  });

  return { success: true, perfil };
}

export async function atualizarPerfilVendedor(data: {
  name: string;
  razaoSocial?: string;
  cnpj?: string;
  email?: string;
  image?: string;
  logo?: string;
  servicosCategorias?: string[];
  estadosAtuacao?: string[];
}) {
  const s = await getSessionUser();
  if (!s || s.role !== "VENDEDOR") return { success: false, error: "Não autorizado" };
  if (s.statusVendedor !== "APROVADO") return { success: false, error: "Sua conta não está aprovada." };
  if (data.logo && !arquivoValido(data.logo, true)) return { success: false, error: "Logo inválido." };
  if (data.servicosCategorias && !escoposValidos(data.servicosCategorias)) return { success: false, error: "Selecione serviços e categorias válidos." };
  if (data.estadosAtuacao && (!data.estadosAtuacao.length || data.estadosAtuacao.some((estado) => !ESTADOS.includes(estado)))) return { success: false, error: "Selecione estados válidos." };

  if (!data.name.trim()) return { success: false, error: "O nome não pode ser vazio." };

  if (data.email?.trim()) {
    const existente = await prisma.user.findFirst({
      where: { email: data.email.trim(), NOT: { id: s.id } },
    });
    if (existente) return { success: false, error: "Este e-mail já está em uso por outra conta." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
    where: { id: s.id },
    data: {
      name: data.name.trim(),
      razaoSocial: data.razaoSocial?.trim() || null,
      cnpj: data.cnpj?.trim() || null,
      email: data.email?.trim() || null,
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.logo !== undefined ? { logo: data.logo || null } : {}),
      ...(data.servicosCategorias ? { servicosCategorias: JSON.stringify(data.servicosCategorias) } : {}),
      ...(data.estadosAtuacao ? { estadosAtuacao: JSON.stringify(data.estadosAtuacao) } : {}),
    },
    });
    const listagens = await tx.listagem.findMany({ where: { userId: s.id, status: "ATIVA" } });
    const foraDoEscopo = listagens.filter((item) =>
      (data.servicosCategorias && !data.servicosCategorias.includes(`${item.tipoServico}::${item.categoriaServico}`)) ||
      (data.estadosAtuacao && !data.estadosAtuacao.includes(item.estado))
    ).map((item) => item.id);
    if (foraDoEscopo.length) await tx.listagem.updateMany({ where: { id: { in: foraDoEscopo } }, data: { status: "SUSPENSA_ADMIN" } });
  });

  return { success: true };
}

// ─── COMPRADOR ──────────────────────────────────────────────────

export async function getPerfilComprador() {
  const s = await getSessionUser();
  if (!s || s.role !== "COMPRADOR") return { success: false, error: "Não autorizado", perfil: null };

  const perfil = await prisma.user.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, email: true, login: true, image: true },
  });

  return { success: true, perfil };
}

export async function atualizarPerfilComprador(data: {
  name: string;
  email?: string;
  image?: string;
}) {
  const s = await getSessionUser();
  if (!s || s.role !== "COMPRADOR") return { success: false, error: "Não autorizado" };

  if (!data.name.trim()) return { success: false, error: "O nome não pode ser vazio." };

  if (data.email?.trim()) {
    const existente = await prisma.user.findFirst({
      where: { email: data.email.trim(), NOT: { id: s.id } },
    });
    if (existente) return { success: false, error: "Este e-mail já está em uso por outra conta." };
  }

  await prisma.user.update({
    where: { id: s.id },
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      ...(data.image !== undefined ? { image: data.image || null } : {}),
    },
  });

  return { success: true };
}

// ─── ADMIN ──────────────────────────────────────────────────────

export async function getPerfilAdmin() {
  const s = await getSessionUser();
  if (!s || s.role !== "ADMIN") return { success: false, error: "Não autorizado", perfil: null };

  const perfil = await prisma.user.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, email: true, login: true, image: true },
  });

  return { success: true, perfil };
}

export async function atualizarPerfilAdmin(data: {
  name: string;
  email?: string;
  image?: string;
}) {
  const s = await getSessionUser();
  if (!s || s.role !== "ADMIN") return { success: false, error: "Não autorizado" };

  if (!data.name.trim()) return { success: false, error: "O nome não pode ser vazio." };

  if (data.email?.trim()) {
    const existente = await prisma.user.findFirst({
      where: { email: data.email.trim(), NOT: { id: s.id } },
    });
    if (existente) return { success: false, error: "Este e-mail já está em uso." };
  }

  await prisma.user.update({
    where: { id: s.id },
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      ...(data.image !== undefined ? { image: data.image || null } : {}),
    },
  });

  return { success: true };
}

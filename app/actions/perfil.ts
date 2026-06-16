"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import { atualizarRank } from "./ranking";

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
}) {
  const s = await getSessionUser();
  if (!s || s.role !== "VENDEDOR") return { success: false, error: "Não autorizado" };

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
      razaoSocial: data.razaoSocial?.trim() || null,
      cnpj: data.cnpj?.trim() || null,
      email: data.email?.trim() || null,
      ...(data.image !== undefined ? { image: data.image || null } : {}),
    },
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
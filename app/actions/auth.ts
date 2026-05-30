"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role,
    login: (session.user as any).login,
    statusVendedor: (session.user as any).statusVendedor,
    image: session.user.image,
  };
}

export async function getVendedorCertificado() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { validadeCertificado: true, razaoSocial: true, cnpj: true },
  });

  if (!user?.validadeCertificado) return { validade: null, diasRestantes: null };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(user.validadeCertificado);
  validade.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    validade: user.validadeCertificado.toISOString(),
    diasRestantes,
    razaoSocial: user.razaoSocial,
    cnpj: user.cnpj,
  };
}

export async function logoutAction() {
  // NextAuth handles sign out client-side via signOut()
  // This server action just redirects - actual sign-out is done client-side
  redirect("/login");
}

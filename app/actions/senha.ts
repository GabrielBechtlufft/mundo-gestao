"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export async function trocarSenha(novaSenha: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Não autenticado." };

  const userId = (session.user as any).id as string;
  if (!userId) return { success: false, error: "Sessão inválida." };

  if (!novaSenha || novaSenha.length < 6) {
    return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: senhaHash, trocarSenha: false },
  });

  return { success: true };
}

"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import bcrypt from "bcryptjs";

export async function trocarSenha(novaSenha: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  if (!novaSenha || novaSenha.length < 6) {
    return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { id: session.id },
    data: { password: senhaHash, trocarSenha: false, sessionVersion: { increment: 1 } },
  });

  return { success: true };
}

"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailRedefinicaoSenha } from "@/app/lib/email";

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

export async function trocarSenhaAutenticado(senhaAtual: string, novaSenha: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  if (!novaSenha || novaSenha.length < 6) {
    return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { success: false, error: "Usuário não encontrado." };

  const senhaCorreta = await bcrypt.compare(senhaAtual, user.password);
  if (!senhaCorreta) return { success: false, error: "Senha atual incorreta." };

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.user.update({
    where: { id: session.id },
    data: { password: senhaHash, sessionVersion: { increment: 1 } },
  });

  return { success: true };
}

export async function solicitarRedefinicaoSenha(loginOuEmail: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { login: loginOuEmail },
        { email: loginOuEmail },
      ],
    },
  });

  // Retorna sucesso mesmo se não encontrar (evita enumeração de usuários)
  if (!user || !user.email) return { success: true };

  // Invalidar tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usado: false },
    data: { usado: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  await enviarEmailRedefinicaoSenha(user.email, user.name, token);

  return { success: true };
}

export async function redefinirSenhaComToken(token: string, novaSenha: string) {
  if (!novaSenha || novaSenha.length < 6) {
    return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
  }

  const registro = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { User: true },
  });

  if (!registro || registro.usado || registro.expiresAt < new Date()) {
    return { success: false, error: "Link inválido ou expirado. Solicite um novo." };
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: { password: senhaHash, trocarSenha: false, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usado: true },
    }),
  ]);

  return { success: true };
}

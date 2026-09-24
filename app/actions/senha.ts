"use server";

import { prisma } from "@/app/lib/prisma";
import { getSession } from "./auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailRedefinicaoSenha } from "@/app/lib/email";

const MIN_SENHA = 8;
const MAX_SENHA = 128;

function senhaValida(senha: string) {
  return senha.length >= MIN_SENHA && senha.length <= MAX_SENHA && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

function erroSenha() {
  return `A senha deve ter entre ${MIN_SENHA} e ${MAX_SENHA} caracteres e incluir letras e números.`;
}

export async function trocarSenha(novaSenha: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado." };

  if (!senhaValida(novaSenha)) {
    return { success: false, error: erroSenha() };
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

  if (!senhaValida(novaSenha)) {
    return { success: false, error: erroSenha() };
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
  if (!loginOuEmail || loginOuEmail.length > 254) return { success: true };
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

  const tokenRecente = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usado: false,
      createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) },
    },
    select: { id: true },
  });
  // Limita e-mails de recuperação sem expor se a conta existe.
  if (tokenRecente) return { success: true };

  // Invalidar tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usado: false },
    data: { usado: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: tokenHash, expiresAt },
  });

  await enviarEmailRedefinicaoSenha(user.email, user.name, token);

  return { success: true };
}

export async function redefinirSenhaComToken(token: string, novaSenha: string) {
  if (!senhaValida(novaSenha)) {
    return { success: false, error: erroSenha() };
  }

  if (!/^[a-f0-9]{64}$/i.test(token)) return { success: false, error: "Link inválido ou expirado. Solicite um novo." };
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const registro = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
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
      where: { token: tokenHash },
      data: { usado: true },
    }),
  ]);

  return { success: true };
}

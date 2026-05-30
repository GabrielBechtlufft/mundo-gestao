"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailSolicitacaoRecebida } from "@/app/lib/email";

export async function solicitarCadastro(data: {
  nome: string;
  cnpj?: string;
  email: string;
  telefone: string;
  cidade: string;
  nomeContato?: string;
  cargoContato?: string;
  mensagem?: string;
  isosVendidas: string;
  validadeCertificado?: string;
  documentoComprovante?: string;
}) {
  try {
    if (!data.nome || !data.email || !data.telefone || !data.cidade) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    if (!data.isosVendidas || data.isosVendidas.trim() === "") {
      return { success: false, error: "Selecione pelo menos uma ISO." };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) {
      return { success: false, error: "Este e-mail já está cadastrado na plataforma." };
    }

    const existingRequest = await prisma.solicitacaoCadastro.findFirst({
      where: { email: data.email, status: "PENDENTE" },
    });
    if (existingRequest) {
      return { success: false, error: "Já existe uma solicitação pendente para este e-mail." };
    }

    await prisma.solicitacaoCadastro.create({
      data: {
        nome: data.nome,
        cnpj: data.cnpj || null,
        email: data.email,
        telefone: data.telefone,
        cidade: data.cidade,
        nomeContato: data.nomeContato || null,
        cargoContato: data.cargoContato || null,
        mensagem: data.mensagem || null,
        isosVendidas: data.isosVendidas,
        validadeCertificado: data.validadeCertificado || null,
        documentoComprovante: data.documentoComprovante || null,
      },
    });

    try {
      await enviarEmailSolicitacaoRecebida(data.email, data.nome);
    } catch (err) {
      console.error("[Email] Erro ao enviar email de recebimento:", err);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar solicitação:", error);
    return { success: false, error: "Não foi possível enviar a solicitação." };
  }
}

export async function cadastrarComprador(data: {
  nome: string;
  email: string;
  senha: string;
}) {
  try {
    if (!data.nome || !data.email || !data.senha) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    if (data.senha.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { login: data.email }] },
    });
    if (existingUser) {
      return { success: false, error: "Este e-mail já está cadastrado na plataforma." };
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    await prisma.user.create({
      data: {
        name: data.nome,
        login: data.email,
        email: data.email,
        password: senhaHash,
        role: "COMPRADOR",
        statusVendedor: "APROVADO",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao cadastrar comprador:", error);
    return { success: false, error: "Não foi possível criar a conta." };
  }
}

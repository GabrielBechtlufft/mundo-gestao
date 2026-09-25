"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailSolicitacaoRecebida } from "@/app/lib/email";

import { SENHA_FORTE, arquivoValido, stringList, validarEscopo, validarCertificados, certificadosDoCadastro } from "@/app/lib/cadastro";

export async function solicitarCadastro(data: {
  nome: string;
  cnpj?: string;
  email: string;
  telefone: string;
  estado: string;
  senha: string;
  logo?: string;
  servicosCategorias?: string;
  nomeContato?: string;
  cargoContato?: string;
  mensagem?: string;
  isosVendidas: string;
  validadeCertificado?: string;
  documentoComprovante?: string;
  certificacoesISO?: string;
}) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    if (!data.nome || !data.email || !data.telefone || !data.estado || !data.senha) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Formato de e-mail inválido." };
    }

    if (!data.isosVendidas || data.isosVendidas.trim() === "") {
      return { success: false, error: "Selecione pelo menos uma ISO." };
    }

    if (!SENHA_FORTE.test(data.senha)) {
      return { success: false, error: "A senha deve ter entre 8 e 128 caracteres e incluir letras e números." };
    }

    if (data.logo && !arquivoValido(data.logo, true)) {
      return { success: false, error: "Logo inválido." };
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { login: data.email }] },
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

    const normas = [...new Set(data.isosVendidas.split(",").map((iso) => iso.trim()).filter(Boolean))];
    const escopos = stringList(data.servicosCategorias);
    const erroEscopo = validarEscopo(data.estado, escopos, normas);
    if (erroEscopo) return { success: false, error: erroEscopo };
    if (!validarCertificados(data.certificacoesISO, normas)) {
      return { success: false, error: "Anexe um certificado válido, com data não vencida, para cada norma selecionada." };
    }
    const certificados = certificadosDoCadastro(data.certificacoesISO);
    const validadeCertificadoFinal = certificados.map((cert) => cert.validade).sort()[0];

    if (data.documentoComprovante && !arquivoValido(data.documentoComprovante)) {
      return { success: false, error: "Documento inválido." };
    }

    await prisma.solicitacaoCadastro.create({
      data: {
        nome: data.nome,
        cnpj: data.cnpj || null,
        email: data.email,
        telefone: data.telefone,
        cidade: "",
        estado: data.estado,
        senhaHash: await bcrypt.hash(data.senha, 10),
        logo: data.logo || null,
        servicosCategorias: JSON.stringify(escopos),
        nomeContato: data.nomeContato || null,
        cargoContato: data.cargoContato || null,
        mensagem: data.mensagem || null,
        isosVendidas: normas.join(","),
        validadeCertificado: validadeCertificadoFinal,
        documentoComprovante: data.documentoComprovante || null,
        certificacoesISO: JSON.stringify(certificados),
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    if (!data.nome || !data.email || !data.senha) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Formato de e-mail inválido." };
    }

    if (!SENHA_FORTE.test(data.senha)) {
      return { success: false, error: "A senha deve ter entre 8 e 128 caracteres e incluir letras e números." };
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

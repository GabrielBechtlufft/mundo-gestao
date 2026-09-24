"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailSolicitacaoRecebida } from "@/app/lib/email";

const SENHA_FORTE = /^(?=.{8,128}$)(?=.*[A-Za-z])(?=.*\d).*$/;
const LOCAL_UPLOAD = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpe?g|webp)$/i;
const BLOB_UPLOAD = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/[a-z0-9-]+\.(pdf|png|jpe?g|webp)$/i;

function arquivoValido(url: unknown) {
  return typeof url === "string" && (LOCAL_UPLOAD.test(url) || BLOB_UPLOAD.test(url));
}

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

    if (data.logo && !arquivoValido(data.logo)) {
      return { success: false, error: "Logo inválido." };
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

    // Se enviou certificações por ISO, extrai a menor validade como validadeCertificado global
    let validadeCertificadoFinal = data.validadeCertificado || null;
    if (data.certificacoesISO) {
      try {
        const certs = JSON.parse(data.certificacoesISO) as Record<string, { validade?: string; arquivoUrl?: string; documento?: string }> | { validade?: string; arquivoUrl?: string; documento?: string }[];
        const itens = Array.isArray(certs) ? certs : Object.values(certs);
        if (!itens.length || itens.some((cert) => !cert.validade || !arquivoValido(cert.arquivoUrl || cert.documento))) {
          return { success: false, error: "Certificados inválidos." };
        }
        const validades = itens.flatMap(c => c.validade ? [c.validade] : []).sort();
        if (validades.length > 0) validadeCertificadoFinal = validades[0];
      } catch { return { success: false, error: "Dados dos certificados inválidos." }; }
    }

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
        servicosCategorias: data.servicosCategorias || "",
        nomeContato: data.nomeContato || null,
        cargoContato: data.cargoContato || null,
        mensagem: data.mensagem || null,
        isosVendidas: data.isosVendidas,
        validadeCertificado: validadeCertificadoFinal,
        documentoComprovante: data.documentoComprovante || null,
        certificacoesISO: data.certificacoesISO || null,
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Criando usuários base
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      login: 'admin',
      email: 'admin@mundogestao.com',
      password: '123',
      role: 'ADMIN',
      statusVendedor: 'APROVADO',
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { login: 'vendedor' },
    update: {},
    create: {
      name: 'Maria (Vendedora)',
      login: 'vendedor',
      email: 'maria@consultoria.com',
      password: '123',
      role: 'VENDEDOR',
      statusVendedor: 'APROVADO',
    },
  });

  const comprador = await prisma.user.upsert({
    where: { login: 'comprador' },
    update: {},
    create: {
      name: 'João (Comprador)',
      login: 'comprador',
      email: 'joao@empresa.com',
      password: '123',
      role: 'COMPRADOR',
      statusVendedor: 'APROVADO',
    },
  });

  console.log({ admin, vendedor, comprador });

  // Criando listagens associadas à vendedora
  const listagensDados = [
    {
      isoTipo: 'ISO 9001',
      titulo: 'Consultoria ISO 9001 — Qualidade',
      descricao: 'Implantação e manutenção do sistema de gestão de qualidade. Auditoria interna, treinamento de equipes e suporte completo até a certificação.',
      cidade: 'São Paulo',
      preco: 2000,
      precoOriginal: 2500,
      descontoOff: 20,
      destaque: 'MAIS CONTRATADO',
      contato: '(11) 98765-4321',
      status: 'ATIVA',
    },
    {
      isoTipo: 'ISO 9001',
      titulo: 'Auditoria ISO 9001 — Consultoria Premium',
      descricao: 'Revisão completa dos processos internos com foco na conformidade ISO 9001. Relatório detalhado e plano de ação incluído.',
      cidade: 'São Paulo',
      preco: 3200,
      precoOriginal: 3800,
      descontoOff: 16,
      destaque: 'TOP AVALIAÇÃO',
      contato: '(11) 91234-5678',
      status: 'ATIVA',
    },
    {
      isoTipo: 'ISO 14001',
      titulo: 'Gestão Ambiental ISO 14001',
      descricao: 'Consultoria especializada em licenciamento ambiental e implantação do sistema ISO 14001.',
      cidade: 'Rio de Janeiro',
      preco: 4500,
      precoOriginal: 5000,
      descontoOff: 10,
      destaque: null,
      contato: '(21) 99876-5432',
      status: 'ATIVA',
    },
    {
      isoTipo: 'ISO 27001',
      titulo: 'Segurança da Informação ISO 27001',
      descricao: 'Implementação completa do SGSI conforme ISO 27001. Análise de riscos, políticas de segurança e preparação para certificação.',
      cidade: 'São Paulo',
      preco: 5500,
      precoOriginal: 6500,
      descontoOff: 15,
      destaque: 'NOVO',
      contato: '(11) 97654-3210',
      status: 'ATIVA',
    },
  ];

  const listagens = [];
  for (const l of listagensDados) {
    const created = await prisma.listagem.create({
      data: { ...l, userId: vendedor.id },
    });
    listagens.push(created);
  }

  // Criando propostas de exemplo (bilateral)
  await prisma.proposta.create({
    data: {
      solicitante: comprador.name,
      servico: 'ISO 9001 - Consultoria ISO 9001 — Qualidade',
      status: 'CONCLUIDA',
      vendedorConfirmou: true,
      compradorConfirmou: true,
      listagemId: listagens[0].id,
      compradorId: comprador.id,
      vendedorId: vendedor.id,
      userId: vendedor.id,
    },
  });

  await prisma.proposta.create({
    data: {
      solicitante: comprador.name,
      servico: 'ISO 14001 - Gestão Ambiental ISO 14001',
      status: 'VENDEDOR_CONFIRMOU',
      vendedorConfirmou: true,
      compradorConfirmou: false,
      listagemId: listagens[2].id,
      compradorId: comprador.id,
      vendedorId: vendedor.id,
      userId: vendedor.id,
    },
  });

  await prisma.proposta.create({
    data: {
      solicitante: comprador.name,
      servico: 'ISO 27001 - Segurança da Informação ISO 27001',
      status: 'PENDENTE',
      listagemId: listagens[3].id,
      compradorId: comprador.id,
      vendedorId: vendedor.id,
      userId: vendedor.id,
    },
  });

  // Solicitações de cadastro pendentes com ISOs e documentos
  await prisma.solicitacaoCadastro.create({
    data: {
      nome: 'Carlos Ferreira',
      email: 'carlos@consultora.com',
      telefone: '(11) 98000-0001',
      cidade: 'Campinas',
      mensagem: 'Tenho 10 anos de experiência em consultoria ISO.',
      isosVendidas: 'ISO 9001,ISO 14001',
      status: 'PENDENTE',
    },
  });
  await prisma.solicitacaoCadastro.create({
    data: {
      nome: 'Ana Silva',
      email: 'ana@iso.com.br',
      telefone: '(21) 97000-0002',
      cidade: 'Rio de Janeiro',
      mensagem: 'Especialista certificada em ISO 27001 e ISO 45001.',
      isosVendidas: 'ISO 27001,ISO 45001',
      status: 'PENDENTE',
    },
  });

  // Notificações
  await prisma.notificacao.create({
    data: {
      userId: vendedor.id,
      mensagem: 'Bem-vinda ao Mundo Gestão! Sua conta foi aprovada.',
      tipo: 'APROVACAO',
    },
  });

  console.log('Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

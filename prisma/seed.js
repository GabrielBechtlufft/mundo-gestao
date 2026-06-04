const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Criando usuários base — um de cada perfil
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
      isosVendidas: 'ISO 9001,ISO 14001,ISO 27001',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Maria Consultoria Ltda',
      rankTier: 'PRATA',
      rankScore: 42,
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

  // Usuário com role FUNCIONARIO vinculado ao vendedor
  const funcionarioUser = await prisma.user.upsert({
    where: { login: 'funcionario' },
    update: {},
    create: {
      name: 'Lucas (Funcionário)',
      login: 'funcionario',
      email: 'lucas@consultoria.com',
      password: '123',
      role: 'FUNCIONARIO',
      statusVendedor: 'APROVADO',
    },
  });

  // Registro FuncionarioVendedor ligando funcionário ao vendedor
  const funcionario = await prisma.funcionarioVendedor.upsert({
    where: { linkedUserId: funcionarioUser.id },
    update: {},
    create: {
      userId: vendedor.id,
      linkedUserId: funcionarioUser.id,
      nome: 'Lucas (Funcionário)',
      email: 'lucas@consultoria.com',
      cargo: 'Consultor',
      ativo: true,
    },
  });

  console.log({ admin, vendedor, comprador, funcionarioUser, funcionario });

  // Listagens associadas à vendedora
  const listagensDados = [
    {
      isoTipo: 'ISO 9001',
      titulo: 'Consultoria ISO 9001 — Qualidade',
      descricao: 'Implantação e manutenção do sistema de gestão de qualidade. Auditoria interna, treinamento de equipes e suporte completo até a certificação.',
      cidade: 'São Paulo',
      destaque: 'MAIS CONTRATADO',
      status: 'ATIVA',
    },
    {
      isoTipo: 'ISO 9001',
      titulo: 'Auditoria ISO 9001 — Consultoria Premium',
      descricao: 'Revisão completa dos processos internos com foco na conformidade ISO 9001. Relatório detalhado e plano de ação incluído.',
      cidade: 'São Paulo',
      destaque: 'TOP AVALIAÇÃO',
      status: 'ATIVA',
    },
    {
      isoTipo: 'ISO 14001',
      titulo: 'Gestão Ambiental ISO 14001',
      descricao: 'Consultoria especializada em licenciamento ambiental e implantação do sistema ISO 14001.',
      cidade: 'Rio de Janeiro',
      destaque: null,
      status: 'ATIVA',
    },
    {
      isoTipo: 'ISO 27001',
      titulo: 'Segurança da Informação ISO 27001',
      descricao: 'Implementação completa do SGSI conforme ISO 27001. Análise de riscos, políticas de segurança e preparação para certificação.',
      cidade: 'São Paulo',
      destaque: 'NOVO',
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

  // Avaliações de exemplo
  await prisma.avaliacao.create({
    data: {
      listagemId: listagens[0].id,
      nomeAvaliador: 'Empresa ABC',
      nota: 5,
      comentario: 'Excelente consultoria, muito profissional e eficiente.',
    },
  });
  await prisma.avaliacao.create({
    data: {
      listagemId: listagens[0].id,
      nomeAvaliador: 'Indústria XYZ',
      nota: 4,
      comentario: 'Ótimo serviço, prazo cumprido com qualidade.',
    },
  });

  // Propostas de exemplo
  const proposta1 = await prisma.proposta.create({
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
      funcionarioId: funcionario.id,
    },
  });

  const proposta2 = await prisma.proposta.create({
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

  // Mensagens na proposta concluída
  await prisma.mensagem.create({
    data: {
      propostaId: proposta1.id,
      remetenteId: comprador.id,
      texto: 'Olá, gostaria de contratar a consultoria ISO 9001.',
      lida: true,
    },
  });
  await prisma.mensagem.create({
    data: {
      propostaId: proposta1.id,
      remetenteId: vendedor.id,
      texto: 'Claro! Podemos começar na próxima semana. Vou enviar o contrato.',
      lida: true,
    },
  });

  // Mensagem não lida na proposta pendente
  await prisma.mensagem.create({
    data: {
      propostaId: proposta2.id,
      remetenteId: comprador.id,
      texto: 'Quando podemos começar?',
      lida: false,
    },
  });

  // Solicitações de cadastro pendentes
  await prisma.solicitacaoCadastro.create({
    data: {
      nome: 'Carlos Ferreira Consultoria',
      cnpj: '98.765.432/0001-10',
      email: 'carlos@consultora.com',
      telefone: '(11) 98000-0001',
      cidade: 'Campinas',
      mensagem: 'Tenho 10 anos de experiência em consultoria ISO.',
      isosVendidas: 'ISO 9001,ISO 14001',
      nomeContato: 'Carlos Ferreira',
      cargoContato: 'Diretor',
      status: 'PENDENTE',
    },
  });
  await prisma.solicitacaoCadastro.create({
    data: {
      nome: 'Ana Silva Assessoria',
      cnpj: '11.222.333/0001-44',
      email: 'ana@iso.com.br',
      telefone: '(21) 97000-0002',
      cidade: 'Rio de Janeiro',
      mensagem: 'Especialista certificada em ISO 27001 e ISO 45001.',
      isosVendidas: 'ISO 27001,ISO 45001',
      nomeContato: 'Ana Silva',
      cargoContato: 'Consultora Sênior',
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
  await prisma.notificacao.create({
    data: {
      userId: comprador.id,
      mensagem: 'Sua proposta para ISO 9001 foi concluída com sucesso.',
      tipo: 'INFO',
    },
  });
  await prisma.notificacao.create({
    data: {
      userId: funcionarioUser.id,
      mensagem: 'Você foi adicionado como funcionário de Maria Consultoria Ltda.',
      tipo: 'INFO',
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

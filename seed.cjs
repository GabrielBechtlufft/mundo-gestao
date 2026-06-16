const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function calcularRank(vendedorId) {
  const vendedor = await prisma.user.findUnique({
    where: { id: vendedorId },
    include: {
      normas: { include: { avaliacoes: true } },
      propostasVendedor: { where: { status: 'CONCLUIDA' } },
    },
  });
  if (!vendedor) return;

  const ptsConclusoes = vendedor.propostasVendedor.length * 30;

  const notaParaPontos = (nota) => {
    if (nota === 5) return 20;
    if (nota === 4) return 10;
    if (nota === 3) return 0;
    if (nota === 2) return -5;
    return -10;
  };
  const ptsAvaliacoes = vendedor.normas
    .flatMap((l) => l.avaliacoes)
    .reduce((acc, a) => acc + notaParaPontos(a.nota), 0);

  const propostasComResposta = await prisma.proposta.findMany({
    where: { vendedorId, primeiraRespostaVendedorAt: { not: null } },
    select: { createdAt: true, primeiraRespostaVendedorAt: true },
  });
  const ptsResposta = propostasComResposta.reduce((acc, p) => {
    if (!p.primeiraRespostaVendedorAt) return acc;
    const diffH = (new Date(p.primeiraRespostaVendedorAt).getTime() - new Date(p.createdAt).getTime()) / 3600000;
    return acc + (diffH <= 24 ? 10 : 0);
  }, 0);

  const score = Math.max(0, ptsConclusoes + ptsAvaliacoes + ptsResposta);
  let tier = 'BRONZE';
  if (score >= 350) tier = 'PLATINA';
  else if (score >= 150) tier = 'OURO';
  else if (score >= 50) tier = 'PRATA';

  await prisma.user.update({ where: { id: vendedorId }, data: { rankScore: score, rankTier: tier } });
  console.log(`  → Rank ${vendedorId.slice(0,8)}: ${score} pts → ${tier}`);
}

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ── Usuários ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: { name: 'Admin', login: 'admin', email: 'admin@mundogestao.com', password: 'admin', role: 'ADMIN' },
  });

  const comprador = await prisma.user.upsert({
    where: { login: 'comprador' },
    update: {},
    create: { name: 'João Comprador', login: 'comprador', email: 'comprador@email.com', password: 'comprador', role: 'COMPRADOR' },
  });

  const vendor = await prisma.user.upsert({
    where: { login: 'vendedor1' },
    update: { isosVendidas: 'ISO 9001,ISO 14001,ISO 45001,ISO 27001,ISO 37001,ISO 50001' },
    create: {
      name: 'Consultoria Alpha',
      login: 'vendedor1',
      email: 'vendedor1@email.com',
      password: 'vendedor',
      role: 'VENDEDOR',
      isosVendidas: 'ISO 9001,ISO 14001,ISO 45001,ISO 27001,ISO 37001,ISO 50001',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Consultoria Alpha Ltda',
    },
  });

  // Usuário FUNCIONARIO vinculado ao vendedor
  const funcionarioUser = await prisma.user.upsert({
    where: { login: 'funcionario1' },
    update: {},
    create: {
      name: 'Lucas Funcionário',
      login: 'funcionario1',
      email: 'funcionario1@email.com',
      password: 'funcionario',
      role: 'FUNCIONARIO',
      statusVendedor: 'APROVADO',
    },
  });

  await prisma.funcionarioVendedor.upsert({
    where: { linkedUserId: funcionarioUser.id },
    update: {},
    create: {
      userId: vendor.id,
      linkedUserId: funcionarioUser.id,
      nome: 'Lucas Funcionário',
      email: 'funcionario1@email.com',
      cargo: 'Consultor',
      ativo: true,
    },
  });

  console.log('✅ Usuários criados/atualizados');

  // ── Normas ─────────────────────────────────────────────────────────────
  const normas = [
    {
      isoTipo: 'ISO 9001',
      titulo: 'Consultoria Completa ISO 9001 – Gestão da Qualidade',
      descricao: 'Implementação e certificação ISO 9001:2015. Inclui diagnóstico inicial, treinamento da equipe, elaboração completa da documentação (manual de qualidade, procedimentos, formulários) e suporte até a obtenção do certificado. Acompanhamento pré-auditoria e auditoria final incluídos.',
      cidade: 'São Paulo',
      destaque: 'MAIS CONTRATADO',
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 14001',
      titulo: 'Implementação ISO 14001 – Gestão Ambiental',
      descricao: 'Estruture o sistema de gestão ambiental da sua organização com foco em sustentabilidade e conformidade legal. Realizamos o levantamento dos aspectos e impactos ambientais, criação de procedimentos, treinamentos e suporte completo até a certificação.',
      cidade: 'Rio de Janeiro',
      destaque: null,
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 45001',
      titulo: 'Auditoria ISO 45001 – Saúde e Segurança Ocupacional',
      descricao: 'Auditoria completa do sistema de gestão de saúde e segurança ocupacional. Identificamos não-conformidades, elaboramos plano de ação corretivo e acompanhamos a implementação das melhorias necessárias para certificação.',
      cidade: 'Belo Horizonte',
      destaque: 'MAIS CONTRATADO',
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 27001',
      titulo: 'Certificação ISO 27001 – Segurança da Informação',
      descricao: 'Proteja os ativos de informação da sua empresa com a ISO 27001. Nossa equipe especializada conduz a implementação do SGSI (Sistema de Gestão da Segurança da Informação), análise de riscos e adequação aos controles do Anexo A.',
      cidade: 'São Paulo',
      destaque: 'MAIS CONTRATADO',
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 37001',
      titulo: 'ISO 37001 – Sistema de Gestão Antissuborno',
      descricao: 'Demonstre o compromisso da sua empresa com a ética e a integridade. Implementamos o sistema de gestão antissuborno conforme ISO 37001, incluindo análise de riscos de suborno, políticas, controles e treinamentos para todos os níveis.',
      cidade: 'Curitiba',
      destaque: null,
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 50001',
      titulo: 'ISO 50001 – Gestão de Energia para Indústrias',
      descricao: 'Reduza consumo energético e custos operacionais com a ISO 50001. Realizamos diagnóstico energético, definição de metas e indicadores de desempenho energético (IDE), implementação do sistema e suporte até a certificação.',
      cidade: 'Porto Alegre',
      destaque: null,
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 9001',
      titulo: 'Manutenção de Certificado ISO 9001 – Renovação Anual',
      descricao: 'Serviço de manutenção do sistema de gestão da qualidade para empresas já certificadas. Inclui auditoria interna anual, análise crítica pela direção, atualização de documentos e suporte na auditoria de manutenção do organismo certificador.',
      cidade: 'São Paulo',
      destaque: 'MAIS CONTRATADO',
      status: 'ATIVA',
      userId: vendor.id,
    },
    {
      isoTipo: 'ISO 14001',
      titulo: 'Diagnóstico Ambiental ISO 14001 – Primeira Etapa',
      descricao: 'Diagnóstico inicial para empresas que desejam iniciar a jornada de certificação ambiental. Avaliamos a situação atual, mapeamos os aspectos e impactos ambientais e entregamos um plano de implementação detalhado.',
      cidade: 'Campinas',
      destaque: null,
      status: 'ATIVA',
      userId: vendor.id,
    },
  ];

  for (const listagem of normas) {
    const existing = await prisma.listagem.findFirst({
      where: { titulo: listagem.titulo, userId: vendor.id },
    });
    if (!existing) {
      await prisma.listagem.create({ data: listagem });
    }
  }

  const todasNormas = await prisma.listagem.findMany({ where: { userId: vendor.id } });
  console.log(`✅ ${todasNormas.length} normas garantidas`);

  // ── Avaliações ────────────────────────────────────────────────────────────
  const avalExistentes = await prisma.avaliacao.count();
  if (avalExistentes === 0) {
    const avaliacoes = [
      { listagemId: todasNormas[0]?.id, nomeAvaliador: 'Carlos Mendes', nota: 5, comentario: 'Excelente consultoria! A equipe da Alpha foi muito profissional e nos ajudou a obter a certificação ISO 9001 em tempo recorde. Super recomendo!' },
      { listagemId: todasNormas[0]?.id, nomeAvaliador: 'Maria Santos', nota: 5, comentario: 'Serviço impecável do início ao fim. A documentação entregue foi completa e a preparação para auditoria foi decisiva. 5 estrelas merecidas.' },
      { listagemId: todasNormas[0]?.id, nomeAvaliador: 'Roberto Alves', nota: 4, comentario: 'Ótimo atendimento e suporte técnico de qualidade. Aprovamos na primeira auditoria. Prazo um pouco longo, mas o resultado compensou.' },
      { listagemId: todasNormas[1]?.id, nomeAvaliador: 'Ana Lima', nota: 5, comentario: 'A Consultoria Alpha transformou nossa visão sobre gestão ambiental. Processo claro, equipe dedicada e resultado excelente.' },
      { listagemId: todasNormas[1]?.id, nomeAvaliador: 'Paulo Costa', nota: 4, comentario: 'Bom trabalho na implementação da ISO 14001. Equipe conhece bem a norma e o processo foi bem conduzido.' },
      { listagemId: todasNormas[2]?.id, nomeAvaliador: 'Fernanda Rocha', nota: 5, comentario: 'Auditoria detalhada e muito bem conduzida. Encontraram pontos de melhoria que nunca tínhamos percebido. Fundamental para nossa certificação.' },
      { listagemId: todasNormas[3]?.id, nomeAvaliador: 'Lucas Ferreira', nota: 5, comentario: 'ISO 27001 implementada com excelência. A análise de riscos foi muito criteriosa e os controles bem definidos. Nossa empresa está muito mais segura.' },
      { listagemId: todasNormas[3]?.id, nomeAvaliador: 'Juliana Melo', nota: 4, comentario: 'Serviço muito profissional. A equipe tem domínio completo da norma. Aprovamos em primeira auditoria!' },
      { listagemId: todasNormas[6]?.id, nomeAvaliador: 'Diego Pinto', nota: 5, comentario: 'Renovação feita com tranquilidade. A equipe cuida de tudo e a auditoria de manutenção passou sem nenhuma não-conformidade.' },
    ].filter((a) => a.listagemId);

    await prisma.avaliacao.createMany({ data: avaliacoes });
    console.log(`✅ ${avaliacoes.length} avaliações criadas`);
  } else {
    console.log(`ℹ️  Avaliações já existem (${avalExistentes}), pulando`);
  }

  // ── Propostas e mensagens ─────────────────────────────────────────────────
  const propostasExistentes = await prisma.proposta.count();
  if (propostasExistentes === 0 && todasNormas.length >= 3) {
    const agora = new Date();
    const ha2h = new Date(agora.getTime() - 2 * 3600000);
    const ha1d = new Date(agora.getTime() - 24 * 3600000);
    const ha3d = new Date(agora.getTime() - 72 * 3600000);
    const ha5d = new Date(agora.getTime() - 120 * 3600000);

    // Proposta 1 – PENDENTE com chat ativo
    const p1 = await prisma.proposta.create({
      data: {
        solicitante: comprador.name,
        servico: `${todasNormas[0].isoTipo} - ${todasNormas[0].titulo}`,
        status: 'PENDENTE',
        listagemId: todasNormas[0].id,
        compradorId: comprador.id,
        vendedorId: vendor.id,
        userId: vendor.id,
        primeiraRespostaVendedorAt: ha2h,
        createdAt: ha3d,
        updatedAt: ha3d,
      },
    });
    await prisma.mensagem.createMany({
      data: [
        { propostaId: p1.id, remetenteId: comprador.id, texto: 'Olá! Vi o serviço de ISO 9001 de vocês e tenho interesse. Poderia me dar mais detalhes sobre o prazo de implementação?', lida: true, createdAt: ha3d },
        { propostaId: p1.id, remetenteId: vendor.id, texto: 'Olá, João! Ficamos muito felizes com seu interesse. O prazo médio de implementação da ISO 9001 é de 4 a 8 meses, dependendo do porte e maturidade da empresa. Quantos colaboradores tem a sua organização?', lida: true, createdAt: ha2h },
        { propostaId: p1.id, remetenteId: comprador.id, texto: 'Temos cerca de 45 colaboradores. Somos uma empresa de médio porte no setor de manufatura.', lida: true, createdAt: new Date(agora.getTime() - 1800000) },
        { propostaId: p1.id, remetenteId: vendor.id, texto: 'Perfeito! Para uma empresa do seu porte, trabalhamos em media com 5 meses. Podemos agendar uma reunião diagnóstico gratuita para dimensionar melhor o projeto?', lida: false, createdAt: new Date(agora.getTime() - 900000) },
      ],
    });

    // Proposta 2 – CONCLUIDA
    const p2 = await prisma.proposta.create({
      data: {
        solicitante: comprador.name,
        servico: `${todasNormas[1].isoTipo} - ${todasNormas[1].titulo}`,
        status: 'CONCLUIDA',
        vendedorConfirmou: true,
        compradorConfirmou: true,
        documentoCompra: 'https://example.com/comprovante.pdf',
        listagemId: todasNormas[1].id,
        compradorId: comprador.id,
        vendedorId: vendor.id,
        userId: vendor.id,
        primeiraRespostaVendedorAt: new Date(ha5d.getTime() + 3600000),
        createdAt: ha5d,
        updatedAt: ha1d,
      },
    });
    await prisma.mensagem.createMany({
      data: [
        { propostaId: p2.id, remetenteId: comprador.id, texto: 'Gostaria de solicitar orçamento para implementação ISO 14001.', lida: true, createdAt: ha5d },
        { propostaId: p2.id, remetenteId: vendor.id, texto: 'Olá João! Claro, vamos agendar uma visita técnica. Qual a sua disponibilidade?', lida: true, createdAt: new Date(ha5d.getTime() + 3600000) },
        { propostaId: p2.id, remetenteId: comprador.id, texto: 'Podemos fazer na próxima semana, terça ou quarta.', lida: true, createdAt: new Date(ha5d.getTime() + 7200000) },
        { propostaId: p2.id, remetenteId: vendor.id, texto: 'Ótimo! Confirmo terça-feira às 14h. Obrigado pela confiança!', lida: true, createdAt: new Date(ha5d.getTime() + 10800000) },
        { propostaId: p2.id, remetenteId: comprador.id, texto: 'Serviço excelente! Muito satisfeito com o resultado. Obrigado à toda equipe.', lida: true, createdAt: ha1d },
      ],
    });

    // Proposta 3 – PENDENTE (aguardando resposta do vendedor)
    const p3 = await prisma.proposta.create({
      data: {
        solicitante: comprador.name,
        servico: `${todasNormas[3].isoTipo} - ${todasNormas[3].titulo}`,
        status: 'PENDENTE',
        listagemId: todasNormas[3].id,
        compradorId: comprador.id,
        vendedorId: vendor.id,
        userId: vendor.id,
        createdAt: ha1d,
        updatedAt: ha1d,
      },
    });
    await prisma.mensagem.createMany({
      data: [
        { propostaId: p3.id, remetenteId: comprador.id, texto: 'Boa tarde! Estamos buscando implementar a ISO 27001 para atender requisitos de um cliente corporativo. Vocês têm experiência em empresas de tecnologia?', lida: false, createdAt: ha1d },
      ],
    });

    console.log('✅ 3 propostas e mensagens criadas');
  } else {
    console.log(`ℹ️  Propostas já existem (${propostasExistentes}), pulando`);
  }

  // ── Calcular ranks ────────────────────────────────────────────────────────
  console.log('\n📊 Calculando rankings...');
  await calcularRank(vendor.id);

  console.log('\n✅ Seed concluído com sucesso!');
  console.log('\n📋 Contas para teste:');
  console.log('  Admin       → login: admin        | senha: admin');
  console.log('  Vendedor    → login: vendedor1    | senha: vendedor');
  console.log('  Comprador   → login: comprador    | senha: comprador');
  console.log('  Funcionário → login: funcionario1 | senha: funcionario');

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

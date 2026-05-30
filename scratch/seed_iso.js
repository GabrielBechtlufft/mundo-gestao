import { PrismaClient } from '../src/generated/prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de listagens...");

  // Busca o primeiro usuário vendedor aprovado para associar às listagens
  const user = await prisma.user.findFirst({
    where: { role: "VENDEDOR", statusVendedor: "APROVADO" }
  });

  if (!user) {
    console.log("Nenhum vendedor aprovado encontrado. As listagens ficarão sem dono (userId = null) ou você pode rodar dnv dps de criar um vendedor.");
  }

  const userId = user ? user.id : null;

  const listagens = [
    {
      isoTipo: "ISO 9001",
      titulo: "Consultoria e Implementação ISO 9001:2015",
      descricao: "Serviço completo de consultoria para a implementação da norma ISO 9001:2015 de Gestão da Qualidade, englobando diagnóstico, mapeamento de processos e auditoria interna.",
      cidade: "São Paulo",
      preco: 12000,
      precoOriginal: 15000,
      descontoOff: 20,
      destaque: "MAIS BUSCADO",
      contato: "(11) 98765-4321",
      imagem: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop",
      userId,
      status: "ATIVA",
    },
    {
      isoTipo: "ISO 14001",
      titulo: "Adequação Ambiental ISO 14001",
      descricao: "Apoio especializado na obtenção da certificação ISO 14001. Análise de ciclo de vida, gestão de resíduos e conformidade com a legislação ambiental vigente.",
      cidade: "Curitiba",
      preco: 9500,
      precoOriginal: 10000,
      descontoOff: 5,
      destaque: "ECOLÓGICO",
      contato: "contato@ecoambiental.com.br",
      imagem: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop",
      userId,
      status: "ATIVA",
    },
    {
      isoTipo: "ISO 27001",
      titulo: "Segurança da Informação - ISO 27001",
      descricao: "Projeto de adequação para a certificação ISO 27001, implementando o SGSI (Sistema de Gestão da Segurança da Informação). Análise de vulnerabilidades, classificação de dados e mitigação de riscos.",
      cidade: "São Paulo",
      preco: 18000,
      precoOriginal: 22500,
      descontoOff: 20,
      contato: "(11) 91234-5678",
      imagem: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop",
      userId,
      status: "ATIVA",
    },
    {
      isoTipo: "ISO 45001",
      titulo: "Saúde e Segurança Ocupacional (ISO 45001)",
      descricao: "Assessoria para certificação ISO 45001. Foco na redução de acidentes, melhora no bem-estar dos colaboradores e compliance com normas regulamentadoras (NRs).",
      cidade: "Belo Horizonte",
      preco: 14000,
      precoOriginal: 14000,
      descontoOff: 0,
      contato: "seguranca@worksafe.com",
      imagem: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?q=80&w=600&auto=format&fit=crop",
      userId,
      status: "ATIVA",
    }
  ];

  for (const listagem of listagens) {
    const created = await prisma.listagem.create({
      data: listagem
    });
    console.log(`Listagem criada: ${created.titulo} (ID: ${created.id})`);
  }

  console.log("Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

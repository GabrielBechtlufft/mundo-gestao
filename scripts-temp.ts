import { prisma } from "./app/lib/prisma";
async function main() {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDEDOR" },
    select: { id: true, name: true, email: true, statusVendedor: true, validadeCertificado: true, trocarSenha: true },
  });
  console.log("Vendedores:", JSON.stringify(vendors, null, 2));

  const pending = await prisma.solicitacaoCadastro.findMany({
    select: { id: true, nome: true, email: true, status: true, validadeCertificado: true },
  });
  console.log("Solicitacoes:", JSON.stringify(pending, null, 2));
}
main().finally(() => prisma.$disconnect());

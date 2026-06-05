import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@mundogestao.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin@123";

  const existe = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existe) {
    console.log(`Admin já existe (${existe.email}), pulando criação.`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      login: adminEmail,
      email: adminEmail,
      password: hash,
      role: "ADMIN",
      statusVendedor: "APROVADO",
      trocarSenha: true,
    },
  });

  console.log(`Admin criado com sucesso!`);
  console.log(`  E-mail: ${admin.email}`);
  console.log(`  Senha:  ${adminPassword}`);
  console.log(`  ⚠  Troca de senha obrigatória no primeiro acesso.`);
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

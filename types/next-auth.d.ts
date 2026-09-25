import type { DefaultSession } from "next-auth";

type AccessFields = {
  role: string;
  login: string;
  statusVendedor: string;
  trocarSenha: boolean;
  sessionVersion: number;
  primeiroAcesso: boolean;
  funcionarioVendedorId: number | null;
  vendedorPaiId: string | null;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & AccessFields & { id: string };
  }
  interface User extends Partial<AccessFields> { id: string }
}

declare module "next-auth/jwt" {
  interface JWT extends Partial<AccessFields> { id?: string }
}

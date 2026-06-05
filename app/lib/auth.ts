import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { login: credentials.login },
          });
        } catch (err) {
          console.error('[auth] DB error:', err);
          return null;
        }

        if (!user) return null;

        // Check password: support both bcrypt hashed and legacy plain "123"
        let passwordValid = false;
        if (user.password.startsWith("$2")) {
          passwordValid = await bcrypt.compare(credentials.password, user.password);
        } else {
          // Legacy plain-text password (for development seed data)
          passwordValid = credentials.password === user.password;
        }

        if (!passwordValid) return null;

        // Para funcionários, buscar o ID do registro FuncionarioVendedor
        let funcionarioVendedorId: number | null = null;
        let vendedorPaiId: string | null = null;
        if (user.role === "FUNCIONARIO") {
          const perfil = await prisma.funcionarioVendedor.findUnique({
            where: { linkedUserId: user.id },
            select: { id: true, userId: true },
          });
          if (perfil) {
            funcionarioVendedorId = perfil.id;
            vendedorPaiId = perfil.userId;
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          login: user.login,
          statusVendedor: user.statusVendedor,
          trocarSenha: user.trocarSenha,
          image: user.image,
          sessionVersion: user.sessionVersion,
          primeiroAcesso: user.primeiroAcesso,
          funcionarioVendedorId,
          vendedorPaiId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        // Check if user exists with this email or googleId
        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { googleId: account.providerAccountId },
            ],
          },
        });

        if (!dbUser) {
          // Auto-create as COMPRADOR (buyers can sign up freely via Google)
          dbUser = await prisma.user.create({
            data: {
              name: user.name || "Usuário",
              login: email,
              email,
              password: "", // No password for Google users
              role: "COMPRADOR",
              statusVendedor: "APROVADO",
              googleId: account.providerAccountId,
              image: user.image || null,
            },
          });
        } else if (!dbUser.googleId) {
          // Link Google account to existing user
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              googleId: account.providerAccountId,
              image: user.image || dbUser.image,
            },
          });
        }

        // Attach db info to user object for JWT
        (user as any).id = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).login = dbUser.login;
        (user as any).statusVendedor = dbUser.statusVendedor;
        (user as any).sessionVersion = dbUser.sessionVersion;
        (user as any).primeiroAcesso = dbUser.primeiroAcesso;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.login = (user as any).login;
        token.statusVendedor = (user as any).statusVendedor;
        token.trocarSenha = (user as any).trocarSenha;
        token.picture = (user as any).image ?? null;
        token.sessionVersion = (user as any).sessionVersion ?? 0;
        token.primeiroAcesso = (user as any).primeiroAcesso ?? true;
        token.funcionarioVendedorId = (user as any).funcionarioVendedorId ?? null;
        token.vendedorPaiId = (user as any).vendedorPaiId ?? null;
      }
      if (trigger === "update") {
        if (session?.image !== undefined) token.picture = session.image;
        if (session?.primeiroAcesso === false && token.primeiroAcesso !== false) {
          await prisma.user.update({
            where: { id: token.id as string },
            data: { primeiroAcesso: false },
          });
          token.primeiroAcesso = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).login = token.login;
        (session.user as any).statusVendedor = token.statusVendedor;
        (session.user as any).trocarSenha = token.trocarSenha;
        (session.user as any).sessionVersion = token.sessionVersion ?? 0;
        (session.user as any).primeiroAcesso = token.primeiroAcesso ?? true;
        (session.user as any).funcionarioVendedorId = token.funcionarioVendedorId ?? null;
        (session.user as any).vendedorPaiId = token.vendedorPaiId ?? null;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 1 week
  },
  secret: process.env.NEXTAUTH_SECRET,
};

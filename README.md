# Mundo Gestão

Marketplace de consultoria ISO que conecta empresas certificadoras a compradores. Certificadoras publicam seus serviços, recebem propostas e negociam contratos via chat integrado — tudo em uma única plataforma.

## Tecnologias

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Prisma 7** + PostgreSQL (Neon)
- **NextAuth 4** — Credentials e Google OAuth
- **TailwindCSS 4** · GSAP

## Funcionalidades

- Autenticação com fluxo de aprovação manual para certificadoras
- Busca de certificadoras por ISO, estado e cidade (wizard com chips clicáveis)
- Sistema de propostas com status e confirmação bilateral
- Chat em tempo real por proposta
- Gestão de equipe: criação de contas para funcionários com atribuição de chats individuais
- Sistema de ranking de reputação (Bronze → Platina) baseado em avaliações e tempo de resposta
- Painel administrativo para aprovação de cadastros e moderação de normas
- Upload de arquivos e foto de perfil

## Rodando localmente

```bash
npm install
npx prisma migrate dev
npm run dev
```

Crie um `.env` com as seguintes variáveis:

```env
DATABASE_URL="postgresql://..."        # URL com pooling (Neon)
DIRECT_URL="postgresql://..."          # URL direta sem -pooler (para migrações)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta"
GOOGLE_CLIENT_ID="..."                 # Opcional
GOOGLE_CLIENT_SECRET="..."             # Opcional
SMTP_HOST="smtp.gmail.com"             # Opcional
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
```

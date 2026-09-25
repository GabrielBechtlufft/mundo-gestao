# Publicação das correções de cadastro e match

## Banco

Aplicar as migrações no ambiente de destino com `npm run db:deploy` antes de publicar a aplicação. O build gera o Prisma Client, mas não aplica migrações.

A migração `20260924190000_corrigir_escopos_legados`:

- Converte estados, siglas e cidades do catálogo anterior para o formato utilizado na busca.
- Recupera logos, escopos e certificados das solicitações aprovadas, sem sobrescrever dados já preenchidos.
- Recupera serviços e estados de listagens anteriormente publicadas quando o cadastro não tinha esses campos.
- Converte pausas antigas em suspensão administrativa: o modelo antigo não permite distinguir quem pausou a listagem. O Admin pode revisar e reativar individualmente em **Normas**.

Revisar registros desconhecidos após a migração (consulta somente de leitura):

```sql
SELECT id, titulo, cidade, estado FROM "Listagem"
WHERE estado = '' OR estado !~ '^[A-Z]{2} — ';
```

Nenhuma migração é aplicada automaticamente pelos testes. Validar primeiro em uma cópia do banco. Documentos legados continuam dependentes da disponibilidade das URLs originais; a migração não recupera arquivos apagados.

## Upload na Vercel

Configurar `BLOB_READ_WRITE_TOKEN` para um armazenamento Vercel Blob público nos ambientes utilizados. A aplicação informa indisponibilidade de armazenamento quando executada na Vercel sem essa configuração; não tenta gravar certificados no disco local nesse caso.

Arquivos enviados pelo endpoint têm limite de **4 MB**. O limite por IP é de 600 uploads em dez minutos por instância, permitindo um cadastro com 80 certificados. Esse controle em memória não é uma quota global entre instâncias; para eventos maiores, acompanhar erros 429 e dimensionar uma quota compartilhada conforme o tráfego.

## Verificação após publicar

1. Cadastrar uma certificadora com DDD 55, estado, serviço/categoria, logo e certificado por norma.
2. Conferir os anexos e escopos no Admin, aprovar e reabrir os detalhes.
3. Entrar com o e-mail e a senha escolhida; novas contas não exigem troca imediata.
4. Criar e aprovar uma listagem. Conferir o match exato e testar uma categoria diferente, que não deve encontrá-la.
5. Suspender a listagem pelo Admin: a certificadora não pode reativá-la. Suspender a empresa: login e resultados devem ficar bloqueados.
6. Reativar a empresa e, separadamente, revisar as listagens no Admin.

## Catálogo

Cadastro e busca compartilham `app/lib/estados.ts`, com 52 normas conhecidas. A ampliação para aproximadamente 80 depende da lista definitiva do responsável pelo produto; nenhuma norma foi inventada.

## Validação local

`npm test`, `npx tsc --noEmit --incremental false`, `npm run lint` e `npm run build`.

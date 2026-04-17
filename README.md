# Web FCARP

Aplicacao Next.js com:

- pagina publica em `/` e `/consulta`
- area protegida em `/admin/dashboard`
- login com Supabase Auth
- upload de arquivos pequenos no Supabase Storage
- deploy continuo via GitHub + Vercel

## Fluxo de trabalho

1. Desenvolva localmente no VS Code.
2. Versione tudo no GitHub.
3. Conecte o repositório na Vercel.
4. Conecte o projeto ao Supabase e configure as variáveis de ambiente.
5. A cada `git push`, a Vercel faz novo deploy.

## Rotas

- `/`: landing page publica
- `/consulta`: consulta publica da proxima semana letiva
- `/admin/login`: login com email e senha do Supabase
- `/admin/dashboard`: rota protegida com CRUD de cursos e upload de arquivos

## Variáveis de ambiente

Crie um arquivo `.env.local` com base em `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=private-files
```

## Setup do Supabase

1. Crie um projeto no Supabase.
2. Execute o SQL de [supabase/snippets/bootstrap.sql](supabase/snippets/bootstrap.sql).
3. Crie pelo menos um usuário no Supabase Auth.
4. Opcionalmente cadastre professores e alocações para alimentar a consulta pública com dados reais.

O SQL cria:

- tabelas `courses`, `professors`, `allocations` e `file_uploads`
- bucket privado `private-files`
- políticas RLS para leitura pública da consulta e escrita autenticada no admin
- políticas de Storage que isolam os arquivos por pasta de usuário

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variáveis da Vercel.
4. Faça deploy.

## Observação de segurança

O projeto usa `src/proxy.ts` para redirecionamento inicial da rota protegida, mas a validação real também acontece no servidor em `/admin/dashboard`. Isso evita depender do proxy como única camada de autorização.

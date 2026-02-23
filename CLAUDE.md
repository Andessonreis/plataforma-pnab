# CLAUDE.md — Portal PNAB Irecê

Guia de referência para Claude Code ao trabalhar neste repositório.

---

## Visão Geral

**Portal PNAB Irecê** — Plataforma oficial da Política Nacional Aldir Blanc de Fomento à Cultura para o município de Irecê/BA, gerida pela Secretaria de Arte e Cultura.

Funcionalidades centrais: publicação de editais, inscrição online de proponentes, backoffice da secretaria (habilitação, avaliação, resultados, recursos) e transparência pública.

**Status:** Estrutura inicial criada — MVP em desenvolvimento.

---

## Comandos

> Use `make <comando>`. Veja todos com `make help`.

### Desenvolvimento

| Makefile | npm | Descrição |
|----------|-----|-----------|
| `make dev` | — | **Inicia Postgres + Redis + Next.js (recomendado)** |
| `make dev-local` | `npm run dev` | Apenas Next.js (infra já rodando) |
| `make dev-docker` | — | Tudo via Docker (app + worker + infra) |
| `make dev-worker` | `npm run worker` | Worker BullMQ separado (email/pdf) |
| `make build` | `npm run build` | Build de produção |
| `make install` | `npm install` | Instala dependências |
| `make setup` | — | Setup inicial completo (install + infra + banco) |

### Docker

| Makefile | Descrição |
|----------|-----------|
| `make docker-up` | Inicia Postgres + Redis em background |
| `make docker-down` | Para todos os containers |
| `make docker-logs` | Logs de todos os containers |
| `make docker-ps` | Status dos containers |
| `make docker-clean` | Remove containers, volumes e imagens |

### Banco de Dados

| Makefile | npm | Descrição |
|----------|-----|-----------|
| `make db-generate` | `npm run db:generate` | Gera Prisma Client |
| `make db-push` | `npm run db:push` | Push do schema (início/dev) |
| `make db-migrate` | `npm run db:migrate` | Cria e executa migration |
| `make db-studio` | `npm run db:studio` | Abre Prisma Studio (GUI) |
| `make db-reset` | — | Reset completo do banco |

### Qualidade

| Makefile | Descrição |
|----------|-----------|
| `make lint` | ESLint |
| `make typecheck` | `tsc --noEmit` |
| `make check` | lint + typecheck |

---

## Arquitetura

### Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19 + TypeScript 5 (strict) |
| Estilização | Tailwind CSS v3 |
| ORM | Prisma 6 + PostgreSQL 16 |
| Cache / Filas | Redis 7 + BullMQ (email, PDF) |
| Storage | Supabase Storage (3 buckets) |
| E-mail | Nodemailer (SMTP) |
| Auth | NextAuth v5 — Credentials (CPF/CNPJ) |
| Validação | Zod |
| Infra | Docker Compose (app + worker + postgres + redis) |

### Mapa de Arquivos

```
portal-pnab-irece/
├── prisma/
│   └── schema.prisma          # Schema completo (10 modelos)
├── src/
│   ├── app/
│   │   ├── (public)/          # Páginas públicas (/, /editais, /noticias, etc.)
│   │   ├── (auth)/            # /login, /cadastro (sem header público)
│   │   ├── proponente/        # Área protegida — role PROPONENTE
│   │   ├── admin/             # Backoffice — roles internos
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts
│   ├── lib/
│   │   ├── auth/index.ts      # NextAuth config
│   │   ├── db/index.ts        # Prisma singleton
│   │   ├── redis/index.ts     # Redis client (BullMQ-safe)
│   │   ├── storage/index.ts   # Supabase: upload, delete, signedUrl
│   │   ├── mail/index.ts      # Nodemailer + templates
│   │   └── queue/             # BullMQ queues + workers
│   ├── types/
│   │   └── next-auth.d.ts     # Extensão de Session (id, role)
│   ├── middleware.ts           # Proteção de rotas por role
│   └── worker.ts              # Entry point do worker BullMQ
├── Makefile
├── Dockerfile                 # Multi-stage (deps → builder → runner)
├── docker-compose.yml
└── .env.example
```

---

## Rotas (App Router)

| Rota | Arquivo | Acesso |
|------|---------|--------|
| `/` | `(public)/page.tsx` | Público |
| `/editais` | `(public)/editais/page.tsx` | Público |
| `/editais/[slug]` | `(public)/editais/[slug]/page.tsx` | Público |
| `/projetos-apoiados` | `(public)/projetos-apoiados/page.tsx` | Público |
| `/noticias` | `(public)/noticias/page.tsx` | Público |
| `/faq` | `(public)/faq/page.tsx` | Público |
| `/contato` | `(public)/contato/page.tsx` | Público |
| `/login` | `(auth)/login/page.tsx` | Público |
| `/cadastro` | `(auth)/cadastro/page.tsx` | Público |
| `/proponente` | `proponente/page.tsx` | PROPONENTE |
| `/proponente/inscricoes` | `proponente/inscricoes/page.tsx` | PROPONENTE |
| `/admin` | `admin/page.tsx` | ADMIN, ATENDIMENTO, HABILITADOR, AVALIADOR |
| `/admin/editais` | `admin/editais/page.tsx` | ADMIN |
| `/admin/inscricoes` | `admin/inscricoes/page.tsx` | Roles internos |

---

## RBAC — Roles e Permissões

| Role | Acesso |
|------|--------|
| `PROPONENTE` | CRUD das próprias propostas; submissão; recursos |
| `ATENDIMENTO` | Ver e responder tickets; sem acesso a avaliações |
| `HABILITADOR` | Marcar habilitado/inabilitado; registrar motivos |
| `AVALIADOR` | Ver propostas atribuídas; lançar notas e pareceres |
| `ADMIN` | Tudo — editais, usuários, publicações, resultados |

O middleware (`src/middleware.ts`) protege `/proponente` e `/admin` automaticamente. Os layouts de cada área revalidam o role no servidor.

---

## Buckets Supabase Storage

| Bucket | Visibilidade | Conteúdo |
|--------|-------------|----------|
| `editais` | Público | PDFs, anexos, modelos dos editais |
| `propostas` | Privado (signed URL) | Anexos enviados pelos proponentes |
| `manuais` | Público | Manuais e materiais institucionais |

---

## Padrões de Código

### Estilo — A definir

### Server vs Client Components

```
PADRÃO: Server Components
"use client" APENAS quando houver: estado (useState), efeitos (useEffect),
handlers de evento direto no navegador, ou APIs exclusivas do browser.
```

### API Routes — Estrutura Obrigatória

Todo handler deve:
1. Gerar `requestId = randomUUID()`
2. Validar inputs com **Zod**
3. Retornar header `X-Request-Id`
4. Definir `Cache-Control` (ver tabela abaixo)
5. Logar `{ requestId, method, path, status, durationMs }` — **nunca logar tokens, senhas ou PII**

```typescript
// Exemplo completo — src/app/api/editais/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const querySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  status:   z.string().optional(),
})

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
    const { page, pageSize, status } = params

    const where = status ? { status } : {}
    const [data, total] = await Promise.all([
      prisma.edital.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.edital.count({ where }),
    ])

    const res = NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    console.log({ requestId, method: 'GET', path: '/api/editais', status: 200, durationMs: Date.now() - start })
    return res

  } catch (err) {
    const res = NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Parâmetros inválidos', requestId },
      { status: 400 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
```

### Cache Strategy

| Tipo de endpoint | Cache-Control |
|------------------|---------------|
| GET público (editais, transparência) | `public, s-maxage=60, stale-while-revalidate=300` |
| GET dependente de usuário | `no-store` |
| POST / PUT / DELETE | `no-store` |

**Paginação é obrigatória em toda listagem.** `pageSize` máximo: 50.

---

## Acessibilidade (WCAG AA — Obrigatório)

Este é um portal público de política cultural — acessibilidade não é opcional.

- **Contraste:** mínimo 4.5:1 para texto normal, 3:1 para texto grande
- **Focus ring** sempre visível (`focus-visible:outline-2`)
- **Touch targets** ≥ 44px
- **Semântica HTML** correta — headings em ordem, `main`, `nav`, `section`
- **VLibras** integrado no layout público
- **Alt text** em todas as imagens
- **ARIA** para modais (role, aria-modal, focus trap, ESC fecha)
- Versão acessível (HTML) dos editais principais

---

## Segurança

- Validação Zod em **todos** os inputs (query params, body, route params)
- `SUPABASE_SERVICE_ROLE_KEY` usada apenas no servidor — nunca exposta ao client
- Senhas hasheadas com `bcryptjs`
- Queries via Prisma (parametrizadas, sem SQL raw quando evitável)
- Variáveis sensíveis apenas em `.env` (nunca commitado)
- Rate limit em endpoints públicos e de auth (implementar com Redis)

---

## Convenções

| Contexto | Idioma |
|----------|--------|
| Código (variáveis, funções, tipos) | Inglês |
| UI / textos visíveis | Português (Brasil) |
| Commits | Português |
| Comentários em código | Português |

### Formato de Commit

```
<tipo>(<escopo>): <descrição em português>
```

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `style` | Formatação, lint |
| `chore` | Manutenção (deps, config) |

---

## Portas

| Serviço | Porta |
|---------|-------|
| Next.js dev | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Prisma Studio | 5555 |

---

## Primeira vez no projeto

```bash
cp .env.example .env
# preencher as variáveis

make setup   # install + docker-up + db-setup
make dev     # inicia
```

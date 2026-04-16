# Portal PNAB Irecê

> Plataforma oficial da **Política Nacional Aldir Blanc de Fomento à Cultura** (PNAB) para o município de Irecê/BA, gerida pela Secretaria de Arte e Cultura.

[![Deploy](https://img.shields.io/badge/deploy-cidadeslab.dev-059669)](https://cidadeslab.dev)
[![Status](https://img.shields.io/badge/status-MVP%20em%20desenvolvimento-d97706)]()
[![Acessibilidade](https://img.shields.io/badge/WCAG-AA-059669)]()

---

## Sobre

Portal de governo para a gestão completa do ciclo de vida de editais culturais da PNAB:

- **Público:** vitrine de editais, projetos apoiados, transparência, notícias, FAQ
- **Proponente:** cadastro, inscrição online (PF, PJ, MEI, Coletivo), upload de anexos, acompanhamento
- **Backoffice da Secretaria:** publicação de editais, habilitação, avaliação, resultados, recursos, equipe avaliadora

Tom institucional, gov.br-friendly. Cidadão submete CPF/CNPJ e documentos sensíveis — o portal precisa transmitir confiança e seriedade.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript 5 (strict) |
| Estilização | Tailwind CSS v3 (paleta verde esmeralda + dourado, baseada na bandeira de Irecê) |
| ORM / Banco | Prisma 6 + PostgreSQL 16 |
| Cache / Filas | Redis 7 + BullMQ (workers de email e PDF) |
| Storage | Supabase Storage (buckets: editais, propostas, manuais) |
| Auth | NextAuth v5 — Credentials (CPF/CNPJ + senha) |
| Validação | Zod em todos os inputs |
| E-mail | Nodemailer (SMTP) |
| Infra | Docker Compose |
| Acessibilidade | VLibras integrado, WCAG AA obrigatório |

---

## Pré-requisitos

- **Node.js** ≥ 20
- **Docker** + Docker Compose
- **Make** (opcional mas recomendado — atalhos para todos os comandos)

---

## Setup rápido

```bash
# 1. Clone e copie env
git clone <repo>
cd portal-pnab-irece
cp .env.example .env
# preencher SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_*, NEXTAUTH_SECRET

# 2. Setup completo (instala deps, sobe Postgres+Redis, aplica schema, gera Prisma client)
make setup

# 3. Inicia o dev (Next + infra)
make dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Comandos

> `make help` lista todos. Resumo dos mais usados:

### Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `make dev` | Inicia Postgres + Redis + Next.js (recomendado) |
| `make dev-local` | Apenas Next.js (infra já rodando) |
| `make dev-docker` | Tudo via Docker (app + worker + infra) |
| `make dev-worker` | Worker BullMQ separado (email/PDF) |
| `make build` | Build de produção |

### Banco de dados

| Comando | Descrição |
|---------|-----------|
| `make db-push` | Sincroniza schema com banco (dev) |
| `make db-migrate` | Cria e aplica migration |
| `make db-studio` | Abre Prisma Studio (GUI em :5555) |
| `make db-reset` | Reset completo do banco |

### Qualidade

| Comando | Descrição |
|---------|-----------|
| `make lint` | ESLint |
| `make typecheck` | `tsc --noEmit` |
| `make check` | lint + typecheck |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |

### Docker

| Comando | Descrição |
|---------|-----------|
| `make docker-up` | Sobe Postgres + Redis em background |
| `make docker-down` | Para todos os containers |
| `make docker-logs` | Logs de todos os containers |
| `make docker-clean` | Remove containers, volumes e imagens |

---

## Estrutura

```
portal-pnab-irece/
├── prisma/
│   ├── schema.prisma          # 12 modelos, 5 enums
│   ├── seed.ts                # Seed de desenvolvimento
│   └── seed-production.ts     # Seed de produção
├── src/
│   ├── app/
│   │   ├── (public)/          # Páginas públicas (/, /editais, /noticias, ...)
│   │   ├── (auth)/            # /login, /cadastro
│   │   ├── proponente/        # Área protegida — role PROPONENTE
│   │   ├── admin/             # Backoffice — roles internos
│   │   └── api/               # Route handlers
│   ├── lib/
│   │   ├── auth/              # NextAuth config
│   │   ├── db/                # Prisma singleton
│   │   ├── redis/             # Redis client (BullMQ-safe)
│   │   ├── storage/           # Supabase: upload, delete, signedUrl
│   │   ├── mail/              # Nodemailer + templates
│   │   ├── queue/             # BullMQ queues + workers
│   │   └── utils/             # cronograma, format, helpers
│   ├── components/ui/         # Design system (Button, Input, Card, ...)
│   ├── middleware.ts          # Proteção de rotas por role
│   └── worker.ts              # Entry point do worker BullMQ
├── e2e/                       # Playwright (ciclo-vida-completo, RBAC, ...)
├── docs/                      # Documentação do produto e MVP
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── CLAUDE.md                  # Guia detalhado para Claude Code
```

---

## RBAC — Roles

| Role | Acesso |
|------|--------|
| `PROPONENTE` | CRUD das próprias propostas; submissão; recursos |
| `ATENDIMENTO` | Ver e responder tickets |
| `HABILITADOR` | Marcar habilitado/inabilitado; registrar motivos |
| `AVALIADOR` | Ver propostas atribuídas; lançar notas e pareceres |
| `ADMIN` | Tudo — editais, usuários, publicações, resultados |

O middleware (`src/middleware.ts`) protege `/proponente`, `/admin` e `/avaliador` automaticamente.

---

## Convenções

- **Idioma:** código em inglês, UI/commits/comentários em português
- **Server Components por padrão**, `'use client'` apenas quando necessário
- **API routes:** `requestId` em todo log, validação Zod em todo input, header `X-Request-Id` em toda response, `Cache-Control` adequado
- **Acessibilidade WCAG AA é obrigatória** (contraste, focus ring, touch targets ≥44px, ARIA, alt text)
- **Paginação obrigatória** em toda listagem (`pageSize` máx. 50)
- **Senhas hasheadas** com bcryptjs; queries via Prisma parametrizadas; rate limit em endpoints públicos

### Formato de commit

```
<tipo>(<escopo>): <descrição em português>
```

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `chore` | Manutenção (deps, config) |

---

## Portas

| Serviço | Porta |
|---------|-------|
| Next.js dev | 3000 |
| PostgreSQL | 5432 (5434 em alguns dev setups) |
| Redis | 6379 |
| Prisma Studio | 5555 |

---

## Deploy

- **Produção:** [cidadeslab.dev](https://cidadeslab.dev) — VPS Linux com Docker Compose
- **CI/CD:** GitHub Actions (`.github/workflows/`)
  - `ci.yml` — lint + typecheck a cada push
  - `deploy.yml` — deploy SSH na VPS após push em `main`

---

## Testes

```bash
npm test                    # Unit (Vitest)
npm run test:watch          # Unit em modo watch
npm run test:coverage       # Cobertura
npm run test:e2e            # E2E (Playwright) — requer dev server rodando ou usa webServer auto
npm run test:e2e:ui         # E2E em modo interativo
```

E2E principais (em `e2e/`):
- `ciclo-vida-completo.spec.ts` — fluxo end-to-end de um edital, do rascunho ao resultado final
- `seguranca-rbac.spec.ts` — proteção de rotas por role
- `roles-flow.spec.ts` — fluxos por papel
- `caminho-critico.spec.ts` — caminho crítico do proponente

---

## Documentação adicional

| Arquivo | Conteúdo |
|---------|----------|
| [`CLAUDE.md`](./CLAUDE.md) | Guia profundo para desenvolvedores e Claude Code (arquitetura, padrões, comandos) |
| [`docs/RESUMO-PROJETO.md`](./docs/RESUMO-PROJETO.md) | Resumo executivo do projeto |
| [`docs/CHECKLIST-MVP.md`](./docs/CHECKLIST-MVP.md) | 32 stories do MVP com checklist |
| [`docs/CICLO-VIDA-EDITAL.md`](./docs/CICLO-VIDA-EDITAL.md) | Estados e transições do edital |
| [`docs/GUIA-CONFIGURACAO-EDITAL.md`](./docs/GUIA-CONFIGURACAO-EDITAL.md) | Como configurar um edital pelo admin |
| [`docs/PALETA-CORES.md`](./docs/PALETA-CORES.md) | Sistema de cores (verde + dourado) |
| [`docs/QA-CHECKLIST.md`](./docs/QA-CHECKLIST.md) | Checklist de QA antes de release |
| [`docs/API-V1-REFATORACAO.md`](./docs/API-V1-REFATORACAO.md) | Notas da refatoração da API v1 |

---

## Licença e contato

Software de governo desenvolvido para a **Secretaria de Arte e Cultura — Prefeitura Municipal de Irecê/BA**.

Contato institucional: cultura@irece.ba.gov.br

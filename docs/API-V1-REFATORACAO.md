# Refatoração: API REST v1 — Portal PNAB Irecê

## Motivação

O Portal PNAB atendia apenas o frontend Next.js. Com a necessidade de integrar um **app mobile** e um **serviço web externo**, foi criada uma API REST versionada, documentada e com autenticação para consumidores externos.

**Decisão arquitetural:** A API vive dentro do Next.js (`/api/v1/`), sem backend separado. O portal continua usando Server Components com Prisma direto para performance; consumidores externos usam a REST API.

---

## O que mudou

### 1. Response Envelope (`src/lib/api/response.ts`)

Antes: cada handler montava `NextResponse.json()` manualmente com formatos inconsistentes.

Agora: funções padronizadas que geram respostas com envelope uniforme:

```typescript
// Sucesso
{ data: {}, meta?: {}, requestId: "uuid" }

// Erro
{ error: "CÓDIGO", message: "Descrição", requestId: "uuid" }
```

**Funções disponíveis:** `ok()`, `okPaginated()`, `created()`, `noContent()`, `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `validationError()`, `internalError()`, `handleError()`.

Cada handler economiza ~15-20 linhas de boilerplate.

---

### 2. Service Layer (`src/lib/services/`)

Antes: lógica de negócio acoplada nos route handlers (Prisma, validações, regras).

Agora: 14 services puros (sem NextRequest/NextResponse):

| Service | Responsabilidade |
|---------|-----------------|
| `edital.service.ts` | CRUD de editais, slug, acessibilidade |
| `inscricao.service.ts` | Inscrições: criar, editar, submeter |
| `habilitacao.service.ts` | Habilitação/inabilitação |
| `avaliacao.service.ts` | Notas, pareceres, atribuição de avaliadores |
| `recurso.service.ts` | Recursos: submissão e decisão |
| `resultado.service.ts` | Cálculo e publicação de resultados |
| `noticia.service.ts` | CRUD de notícias |
| `cms.service.ts` | CRUD de páginas CMS |
| `faq.service.ts` | CRUD de FAQ |
| `ticket.service.ts` | Contato/tickets |
| `user.service.ts` | Registro, perfil, reset de senha, newsletter |
| `audit.service.ts` | Consulta e limpeza de logs |
| `apikey.service.ts` | Criação, revogação e listagem de API keys |
| `export.service.ts` | Exportação CSV, importação de contemplados |

**Benefício:** a mesma lógica é usada tanto pelas rotas v0 (portal) quanto pelas rotas v1 (API externa), sem duplicação.

---

### 3. ServiceError (`src/lib/services/errors.ts`)

Classe de erro tipada com mapeamento direto para HTTP:

| Código | HTTP Status |
|--------|-------------|
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `FORBIDDEN` | 403 |
| `BAD_REQUEST` | 400 |
| `LOCKED` | 422 |
| `UNAUTHORIZED` | 401 |

Services lançam `ServiceError`, handlers convertem automaticamente via `handleError()`.

---

### 4. Auth Resolver (`src/lib/api/auth-resolver.ts`)

Autenticação dual:

1. **Bearer Token** — `Authorization: Bearer pnab_<key>` → busca API key por hash SHA-256
2. **Session Cookie** — NextAuth v5 (fallback se não há Bearer)

Retorna `ApiCaller { type, userId, role, apiKeyId? }`.

Helpers: `requireRole(caller, 'ADMIN')`, `requireAnyAuth(caller)`, `getIp(req)`.

---

### 5. Schemas compartilhados (`src/lib/schemas/`)

Antes: schemas Zod inline em cada handler, duplicados entre rotas v0 e v1.

Agora: 11 arquivos de schema reutilizáveis:

`pagination.ts`, `edital.ts`, `inscricao.ts`, `avaliacao.ts`, `habilitacao.ts`, `recurso.ts`, `noticia.ts`, `cms.ts`, `faq.ts`, `ticket.ts`, `user.ts`

---

### 6. Utilitários (`src/lib/utils/slug.ts`)

`generateSlug()` estava duplicado em 3 arquivos. Agora centralizado com variantes:
- `generateEditalSlug(titulo, ano)` — ex: `edital-cultura-2026`
- `generateContentSlug(titulo)` — com timestamp para unicidade
- `generateSimpleSlug(titulo)` — básico

---

### 7. API Keys (`prisma/schema.prisma`)

Novo modelo `ApiKey`:

```prisma
model ApiKey {
  id         String    @id @default(cuid())
  userId     String
  label      String
  keyHash    String    @unique  // SHA-256
  prefix     String             // primeiros 12 chars
  scopes     String[]
  revokedAt  DateTime?
  lastUsedAt DateTime?
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id])
}
```

Formato: `pnab_<32 bytes base64url>`. Chave exibida apenas na criação.

---

### 8. Rotas REST v1 (`src/app/api/v1/`)

~25 route files com ~20-25 linhas cada:

```
/api/v1/editais                     GET, POST
/api/v1/editais/[id]                GET, PUT
/api/v1/editais/[id]/resultados     GET, POST
/api/v1/editais/[id]/acessivel      PUT
/api/v1/inscricoes                  GET (admin)
/api/v1/inscricoes/[id]             GET, PUT
/api/v1/inscricoes/[id]/submit      POST
/api/v1/inscricoes/[id]/habilitacao PUT
/api/v1/inscricoes/[id]/avaliacao   GET, PUT
/api/v1/inscricoes/[id]/avaliadores POST, DELETE
/api/v1/inscricoes/[id]/recursos    GET, POST
/api/v1/inscricoes/[id]/recursos/[rid] PUT
/api/v1/inscricoes/export           GET (CSV)
/api/v1/me                          GET, PUT
/api/v1/me/inscricoes               GET, POST
/api/v1/noticias                    GET, POST
/api/v1/noticias/[id]               GET, PUT, DELETE
/api/v1/cms                         GET, POST
/api/v1/cms/[id]                    GET, PUT, DELETE
/api/v1/faq                         GET, POST
/api/v1/faq/[id]                    PUT, DELETE
/api/v1/tickets                     GET, POST
/api/v1/tickets/[id]                GET, PUT
/api/v1/logs                        GET
/api/v1/avaliadores                 GET
/api/v1/contemplados/import         POST
/api/v1/auth/register               POST
/api/v1/auth/api-keys               GET, POST
/api/v1/auth/api-keys/[id]          DELETE
```

---

### 9. CORS (`src/lib/api/cors.ts` + `src/middleware.ts`)

- Origens permitidas via env `API_CORS_ORIGINS` (separadas por vírgula)
- Middleware intercepta `OPTIONS` em `/api/v1/*` antes de qualquer outra lógica
- Headers: `Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`, `Max-Age`

---

### 10. Rate Limiting (`src/lib/rate-limit/config.ts`)

Novos limites para v1:

| Chave | Janela | Máximo |
|-------|--------|--------|
| `v1:read` | 60s | 60 req |
| `v1:write` | 60s | 20 req |

---

### 11. OpenAPI + Swagger UI

- Spec: `public/openapi.yaml` (OpenAPI 3.1)
- UI: `/api-docs` — página pública com `swagger-ui-react`

---

## Arquivos criados

```
src/lib/api/response.ts
src/lib/api/auth-resolver.ts
src/lib/api/cors.ts
src/lib/services/errors.ts
src/lib/services/faq.service.ts
src/lib/services/cms.service.ts
src/lib/services/noticia.service.ts
src/lib/services/ticket.service.ts
src/lib/services/user.service.ts
src/lib/services/audit.service.ts
src/lib/services/edital.service.ts
src/lib/services/inscricao.service.ts
src/lib/services/habilitacao.service.ts
src/lib/services/avaliacao.service.ts
src/lib/services/recurso.service.ts
src/lib/services/resultado.service.ts
src/lib/services/apikey.service.ts
src/lib/services/export.service.ts
src/lib/schemas/pagination.ts
src/lib/schemas/edital.ts
src/lib/schemas/inscricao.ts
src/lib/schemas/avaliacao.ts
src/lib/schemas/habilitacao.ts
src/lib/schemas/recurso.ts
src/lib/schemas/noticia.ts
src/lib/schemas/cms.ts
src/lib/schemas/faq.ts
src/lib/schemas/ticket.ts
src/lib/schemas/user.ts
src/lib/utils/slug.ts
src/app/api/v1/**/*.ts              (~25 route files)
src/app/(public)/api-docs/page.tsx
public/openapi.yaml
```

## Arquivos modificados

```
prisma/schema.prisma                 + modelo ApiKey + relação User
src/middleware.ts                     + CORS preflight para /api/v1/*
src/lib/rate-limit/config.ts         + limites v1:read e v1:write
package.json                         + swagger-ui-react
```

## Dependências adicionadas

```
swagger-ui-react         # UI da documentação
@types/swagger-ui-react  # Tipos TypeScript
```

---

## O que NÃO mudou

- **Server Components** do portal continuam buscando direto do Prisma
- **NextAuth** permanece como auth do portal (cookie/session)
- **Rotas v0** (`/api/admin/*`, `/api/proponente/*`) continuam funcionando
- **Worker BullMQ**, **Storage Supabase**, **Redis** — sem alterações
- **Frontend** — zero breaking changes

---

## Como testar

### API Key
```bash
# Criar via portal ou via endpoint (precisa estar logado):
curl -X POST http://localhost:3000/api/v1/auth/api-keys \
  -H "Cookie: authjs.session-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"label": "Minha chave"}'
# Resposta inclui "key": "pnab_..." (copiar, não será exibida novamente)
```

### Usar a API
```bash
# Listar editais (público, sem auth):
curl http://localhost:3000/api/v1/editais

# Criar edital (requer ADMIN):
curl -X POST http://localhost:3000/api/v1/editais \
  -H "Authorization: Bearer pnab_<sua-chave>" \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Edital Teste", "objeto": "Descrição"}'

# Sem auth → 401:
curl -X POST http://localhost:3000/api/v1/editais \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Teste"}'
```

### Swagger UI
Acessar `http://localhost:3000/api-docs` no navegador.

### CORS
```bash
# Preflight:
curl -X OPTIONS http://localhost:3000/api/v1/editais \
  -H "Origin: https://app.exemplo.com" \
  -H "Access-Control-Request-Method: GET" -v
# Verificar headers Access-Control-Allow-*
```

---

## Variáveis de ambiente novas

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `API_CORS_ORIGINS` | Origens permitidas (vírgula) | `https://app.irece.ba.gov.br,https://mobile.irece.ba.gov.br` |

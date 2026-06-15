import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { registry, envelope, paginatedEnvelope, errorResponse } from './registry'

import { cmsPageSchema } from '@shared/schemas/cms.schema'
import { faqSchema } from '@shared/schemas/faq.schema'
import { noticiaSchema } from '@shared/schemas/noticias.schema'
import { createAtendimentoSchema, atendimentoPatchSchema } from '@shared/schemas/tickets.schema'
import { createApiKeySchema } from '@shared/schemas/api-keys.schema'
import { updateProfileSchema, registerSchema } from '@shared/schemas/user.schema'
import { loginInputSchema } from '@shared/schemas/autenticacao.schema'
import { editalSchema } from '@shared/schemas/editais.schema'

const ID = registry.registerParameter(
  'Id',
  z.string().openapi({ param: { name: 'id', in: 'path' }, example: 'clx0…' }),
)

const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } })
const errors = {
  400: { description: 'Parâmetros inválidos', ...json(errorResponse) },
  401: { description: 'Não autenticado', ...json(errorResponse) },
  403: { description: 'Sem permissão', ...json(errorResponse) },
  404: { description: 'Não encontrado', ...json(errorResponse) },
}

function crud(opts: {
  tag: string
  base: string
  name: string
  input: z.ZodTypeAny
  publicList?: boolean
  publicDetail?: boolean
  listRoles?: string
  writeRoles: string
}) {
  const sec: Record<string, string[]>[] = [{ cookieAuth: [] }, { bearerAuth: [] }]
  registry.registerPath({
    method: 'get',
    path: opts.base,
    tags: [opts.tag],
    summary: `Lista ${opts.name}`,
    ...(opts.publicList ? {} : { security: sec }),
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post',
    path: opts.base,
    tags: [opts.tag],
    summary: `Cria ${opts.name} (${opts.writeRoles})`,
    security: sec,
    request: { body: json(opts.input) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
}

export function buildOpenApiDocument() {
  // ── Componentes (schemas Zod → fonte da verdade) ──────────────────────────
  registry.register('CmsPageInput', cmsPageSchema)
  registry.register('FaqInput', faqSchema)
  registry.register('NoticiaInput', noticiaSchema)
  registry.register('CreateAtendimentoInput', createAtendimentoSchema)
  registry.register('AtendimentoPatchInput', atendimentoPatchSchema)
  registry.register('CreateApiKeyInput', createApiKeySchema)
  registry.register('UpdateProfileInput', updateProfileSchema)
  registry.register('RegisterInput', registerSchema)
  registry.register('LoginInput', loginInputSchema)
  registry.register('EditalInput', editalSchema)
  registry.register('ErrorResponse', errorResponse)

  const sec: Record<string, string[]>[] = [{ cookieAuth: [] }, { bearerAuth: [] }]

  // ── Conteúdo ──────────────────────────────────────────────────────────────
  crud({ tag: 'CMS', base: '/cms', name: 'páginas de conteúdo', input: cmsPageSchema, publicList: true, writeRoles: 'ADMIN' })
  registry.registerPath({
    method: 'get', path: '/cms/{id}', tags: ['CMS'], summary: 'Detalha página por slug',
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/cms/{id}', tags: ['CMS'], summary: 'Atualiza página (ADMIN)', security: sec,
    request: { params: z.object({ id: z.string() }), body: json(cmsPageSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/cms/{id}', tags: ['CMS'], summary: 'Remove página (ADMIN)', security: sec,
    request: { params: z.object({ id: z.string() }) },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  crud({ tag: 'FAQ', base: '/faq', name: 'itens de FAQ', input: faqSchema, publicList: true, writeRoles: 'ADMIN, ATENDIMENTO' })
  crud({ tag: 'Notícias', base: '/noticias', name: 'notícias', input: noticiaSchema, publicList: true, writeRoles: 'ADMIN' })

  // ── Tickets / Atendimento ──────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/tickets', tags: ['Tickets'], summary: 'Lista tickets (ADMIN, ATENDIMENTO)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/tickets', tags: ['Tickets'], summary: 'Abre ticket (público)',
    request: { body: json(createAtendimentoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── API Keys ────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/auth/api-keys', tags: ['API Keys'], summary: 'Lista API keys do usuário', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/auth/api-keys', tags: ['API Keys'], summary: 'Cria API key (chave crua retornada uma vez)', security: sec,
    request: { body: json(createApiKeySchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Me ───────────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/me', tags: ['Me'], summary: 'Perfil do usuário autenticado', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/me', tags: ['Me'], summary: 'Atualiza perfil', security: sec,
    request: { body: json(updateProfileSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── Editais ────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/editais', tags: ['Editais'], summary: 'Lista editais (público)',
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/editais', tags: ['Editais'], summary: 'Cria edital (ADMIN)', security: sec,
    request: { body: json(editalSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Autenticação ──────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/autenticacao/sessoes/sessao', tags: ['Autenticação'], summary: 'Login (cria sessão)',
    request: { body: json(loginInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  void ID

  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Portal PNAB Irecê — API v1',
      version: '1.0.0',
      description:
        'API REST do Portal PNAB de Irecê/BA (padrão modular v1). Esquemas gerados a partir dos schemas Zod em `src/shared/schemas`. Autenticação dual: sessão (cookie `pnab.access`) ou API key (`Authorization: Bearer pnab_…`).',
    },
    servers: [{ url: '/api/v1' }],
  })
}

let cached: ReturnType<typeof buildOpenApiDocument> | null = null

/** Documento OpenAPI memoizado (registro de paths roda uma única vez). */
export function getOpenApiDocument() {
  if (!cached) cached = buildOpenApiDocument()
  return cached
}

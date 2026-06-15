import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { registry, envelope, paginatedEnvelope, errorResponse } from './registry'

import { cmsPageSchema } from '@shared/schemas/cms.schema'
import { faqSchema } from '@shared/schemas/faq.schema'
import { noticiaSchema } from '@shared/schemas/noticias.schema'
import { createAtendimentoSchema, atendimentoPatchSchema } from '@shared/schemas/tickets.schema'
import { createApiKeySchema } from '@shared/schemas/api-keys.schema'
import { updateProfileSchema, registerSchema } from '@shared/schemas/user.schema'
import { loginInputSchema, refreshInputSchema } from '@shared/schemas/autenticacao.schema'
import {
  cadastroInputSchema,
  recuperacaoSenhaInputSchema,
  redefinicaoSenhaInputSchema,
} from '@shared/schemas/usuarios.schema'
import { editalSchema, editalAcessivelSchema, avancarFaseInputSchema } from '@shared/schemas/editais.schema'
import { arquivoEditalUploadMetaSchema } from '@shared/schemas/arquivos-edital.schema'
import { equipeAddInputSchema, equipeRemoveInputSchema } from '@shared/schemas/equipe-edital.schema'
import {
  publicarResultadoInputSchema,
  reordenarResultadosInputSchema,
} from '@shared/schemas/resultados-edital.schema'
import { createInscricaoSchema, updateInscricaoSchema } from '@shared/schemas/inscricoes.schema'
import { anexoUploadMetaSchema } from '@shared/schemas/anexos-inscricao.schema'
import {
  avaliacaoBodySchema,
  atribuirAvaliadoresSchema,
} from '@shared/schemas/avaliacao.schema'
import { habilitacaoSchema } from '@shared/schemas/habilitacao.schema'
import {
  submeterRecursoSchema,
  decidirRecursoSchema,
  responderRecursoSchema,
} from '@shared/schemas/recursos.schema'
import { importContempladosSchema } from '@shared/schemas/contemplados.schema'

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

const sec: Record<string, string[]>[] = [{ cookieAuth: [] }, { bearerAuth: [] }]

const params = (...names: string[]) =>
  z.object(Object.fromEntries(names.map((n) => [n, z.string()])) as Record<string, z.ZodString>)

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
  registry.register('RefreshInput', refreshInputSchema)
  registry.register('CadastroInput', cadastroInputSchema)
  registry.register('RecuperacaoSenhaInput', recuperacaoSenhaInputSchema)
  registry.register('RedefinicaoSenhaInput', redefinicaoSenhaInputSchema)
  registry.register('EditalInput', editalSchema)
  registry.register('EditalAcessivelInput', editalAcessivelSchema)
  registry.register('AvancarFaseInput', avancarFaseInputSchema)
  registry.register('ArquivoEditalUploadMeta', arquivoEditalUploadMetaSchema)
  registry.register('EquipeAddInput', equipeAddInputSchema)
  registry.register('EquipeRemoveInput', equipeRemoveInputSchema)
  registry.register('PublicarResultadoInput', publicarResultadoInputSchema)
  registry.register('ReordenarResultadosInput', reordenarResultadosInputSchema)
  registry.register('CreateInscricaoInput', createInscricaoSchema)
  registry.register('UpdateInscricaoInput', updateInscricaoSchema)
  registry.register('AnexoUploadMeta', anexoUploadMetaSchema)
  registry.register('AvaliacaoInput', avaliacaoBodySchema)
  registry.register('AtribuirAvaliadoresInput', atribuirAvaliadoresSchema)
  registry.register('HabilitacaoInput', habilitacaoSchema)
  registry.register('SubmeterRecursoInput', submeterRecursoSchema)
  registry.register('DecidirRecursoInput', decidirRecursoSchema)
  registry.register('ResponderRecursoInput', responderRecursoSchema)
  registry.register('ImportContempladosInput', importContempladosSchema)
  registry.register('ErrorResponse', errorResponse)

  // ── Conteúdo (CMS / FAQ / Notícias) ─────────────────────────────────────────
  crud({ tag: 'CMS', base: '/cms', name: 'páginas de conteúdo', input: cmsPageSchema, publicList: true, writeRoles: 'ADMIN' })
  registry.registerPath({
    method: 'get', path: '/cms/pagina/{id}', tags: ['CMS'], summary: 'Detalha página por slug',
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/cms/pagina/{id}', tags: ['CMS'], summary: 'Atualiza página (ADMIN)', security: sec,
    request: { params: params('id'), body: json(cmsPageSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/cms/pagina/{id}', tags: ['CMS'], summary: 'Remove página (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  crud({ tag: 'FAQ', base: '/faq', name: 'itens de FAQ', input: faqSchema, publicList: true, writeRoles: 'ADMIN, ATENDIMENTO' })
  registry.registerPath({
    method: 'put', path: '/faq/item/{id}', tags: ['FAQ'], summary: 'Atualiza item de FAQ (ADMIN, ATENDIMENTO)', security: sec,
    request: { params: params('id'), body: json(faqSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/faq/item/{id}', tags: ['FAQ'], summary: 'Remove item de FAQ (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  registry.registerPath({
    method: 'get', path: '/noticias', tags: ['Notícias'], summary: 'Lista notícias (público)',
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/noticias', tags: ['Notícias'], summary: 'Cria notícia (ADMIN)', security: sec,
    request: { body: json(noticiaSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/noticias/noticia/{id}', tags: ['Notícias'], summary: 'Detalha notícia por slug (público)',
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/noticias/noticia/{id}', tags: ['Notícias'], summary: 'Atualiza notícia (ADMIN)', security: sec,
    request: { params: params('id'), body: json(noticiaSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/noticias/noticia/{id}', tags: ['Notícias'], summary: 'Remove notícia (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

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
  registry.registerPath({
    method: 'get', path: '/tickets/ticket/{id}', tags: ['Tickets'], summary: 'Detalha ticket (ADMIN, ATENDIMENTO)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/tickets/ticket/{id}', tags: ['Tickets'], summary: 'Atualiza ticket (ADMIN, ATENDIMENTO)', security: sec,
    request: { params: params('id'), body: json(atendimentoPatchSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
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
  registry.registerPath({
    method: 'delete', path: '/auth/api-keys/api-key/{id}', tags: ['API Keys'], summary: 'Revoga API key', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
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
  registry.registerPath({
    method: 'get', path: '/me/inscricoes', tags: ['Me'], summary: 'Lista inscrições do proponente autenticado (PROPONENTE)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })

  // ── Autenticação ──────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/autenticacao/sessoes/sessao', tags: ['Autenticação'], summary: 'Login (cria sessão)',
    request: { body: json(loginInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/autenticacao/sessoes/sessao', tags: ['Autenticação'], summary: 'Logout (encerra sessão)',
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/autenticacao/sessoes/sessao/atual', tags: ['Autenticação'], summary: 'Sessão atual', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/autenticacao/sessoes/sessao/refresh', tags: ['Autenticação'], summary: 'Renova token de sessão',
    request: { body: json(refreshInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/autenticacao/senhas/recuperacao', tags: ['Autenticação'], summary: 'Solicita recuperação de senha',
    request: { body: json(recuperacaoSenhaInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/autenticacao/senhas/redefinicao', tags: ['Autenticação'], summary: 'Redefine senha com token',
    request: { body: json(redefinicaoSenhaInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/autenticacao/usuarios/usuario', tags: ['Autenticação'], summary: 'Cadastra novo usuário (público, rate-limited)',
    request: { body: json(cadastroInputSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Editais ────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/editais', tags: ['Editais'], summary: 'Lista editais (público)',
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/editais/edital', tags: ['Editais'], summary: 'Cria edital (ADMIN)', security: sec,
    request: { body: json(editalSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/editais/edital/{id}', tags: ['Editais'], summary: 'Detalha edital (público)',
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/editais/edital/{id}', tags: ['Editais'], summary: 'Atualiza edital (ADMIN)', security: sec,
    request: { params: params('id'), body: json(editalSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/editais/edital/{id}', tags: ['Editais'], summary: 'Remove edital (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/editais/edital/{id}/acessivel', tags: ['Editais'], summary: 'Marca edital como acessível (ADMIN)', security: sec,
    request: { params: params('id'), body: json(editalAcessivelSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'patch', path: '/editais/edital/{id}/avancar-fase', tags: ['Editais'], summary: 'Avança fase do edital (ADMIN)', security: sec,
    request: { params: params('id'), body: json(avancarFaseInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/editais/edital/{id}/arquivos', tags: ['Editais'], summary: 'Lista arquivos do edital (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/editais/edital/{id}/arquivos/arquivo', tags: ['Editais'], summary: 'Anexa arquivo ao edital (ADMIN, multipart/form-data)', security: sec,
    request: {
      params: params('id'),
      body: { content: { 'multipart/form-data': { schema: arquivoEditalUploadMetaSchema } } },
    },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/editais/edital/{id}/arquivos/arquivo/{arquivoId}', tags: ['Editais'], summary: 'Remove arquivo do edital (ADMIN)', security: sec,
    request: { params: params('id', 'arquivoId') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/editais/edital/{id}/equipe', tags: ['Editais'], summary: 'Lista equipe do edital (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/editais/edital/{id}/equipe', tags: ['Editais'], summary: 'Adiciona membro à equipe (ADMIN)', security: sec,
    request: { params: params('id'), body: json(equipeAddInputSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/editais/edital/{id}/equipe', tags: ['Editais'], summary: 'Remove membro da equipe (ADMIN)', security: sec,
    request: { params: params('id'), body: json(equipeRemoveInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/editais/edital/{id}/listas', tags: ['Editais'], summary: 'Gera listas de inscrições em PDF (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'PDF', content: { 'application/pdf': { schema: z.string().openapi({ format: 'binary' }) } } }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/editais/edital/{id}/relatorio-final', tags: ['Editais'], summary: 'Gera relatório final em PDF (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'PDF', content: { 'application/pdf': { schema: z.string().openapi({ format: 'binary' }) } } }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/editais/edital/{id}/resultados', tags: ['Editais'], summary: 'Lista resultados do edital (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/editais/edital/{id}/resultados', tags: ['Editais'], summary: 'Publica resultado (ADMIN)', security: sec,
    request: { params: params('id'), body: json(publicarResultadoInputSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'patch', path: '/editais/edital/{id}/resultados/reorder', tags: ['Editais'], summary: 'Reordena resultados (ADMIN)', security: sec,
    request: { params: params('id'), body: json(reordenarResultadosInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Inscrições ──────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/inscricoes', tags: ['Inscrições'], summary: 'Lista todas as inscrições (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes', tags: ['Inscrições'], summary: 'Cria inscrição (PROPONENTE)', security: sec,
    request: { body: json(createInscricaoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/export', tags: ['Inscrições'], summary: 'Exporta inscrições em CSV (ADMIN)', security: sec,
    responses: { 200: { description: 'CSV', content: { 'text/csv': { schema: z.string() } } }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}', tags: ['Inscrições'], summary: 'Detalha inscrição (autenticado: dono ou staff)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/inscricoes/inscricao/{id}', tags: ['Inscrições'], summary: 'Atualiza inscrição (PROPONENTE)', security: sec,
    request: { params: params('id'), body: json(updateInscricaoSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/submit', tags: ['Inscrições'], summary: 'Submete inscrição (PROPONENTE)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/retract', tags: ['Inscrições'], summary: 'Retrata submissão da inscrição (PROPONENTE)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}/comprovante', tags: ['Inscrições'], summary: 'Gera comprovante em PDF (autenticado)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'PDF', content: { 'application/pdf': { schema: z.string().openapi({ format: 'binary' }) } } }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}/projeto-pdf', tags: ['Inscrições'], summary: 'Gera PDF do projeto (autenticado)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'PDF', content: { 'application/pdf': { schema: z.string().openapi({ format: 'binary' }) } } }, ...errors },
  })

  // ── Inscrições · Anexos ──────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/anexos/anexo', tags: ['Inscrições · Anexos'], summary: 'Envia anexo (PROPONENTE, multipart/form-data)', security: sec,
    request: {
      params: params('id'),
      body: { content: { 'multipart/form-data': { schema: anexoUploadMetaSchema } } },
    },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/inscricoes/inscricao/{id}/anexos/anexo/{anexoId}', tags: ['Inscrições · Anexos'], summary: 'Remove anexo (PROPONENTE)', security: sec,
    request: { params: params('id', 'anexoId') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}/anexos/anexo/{anexoId}/url', tags: ['Inscrições · Anexos'], summary: 'URL assinada do anexo (ADMIN, ATENDIMENTO, HABILITADOR, AVALIADOR)', security: sec,
    request: { params: params('id', 'anexoId') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ url: z.string() }))) }, ...errors },
  })

  // ── Inscrições · Avaliação ───────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}/avaliacao', tags: ['Inscrições · Avaliação'], summary: 'Detalha avaliação (ADMIN, AVALIADOR)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/inscricoes/inscricao/{id}/avaliacao', tags: ['Inscrições · Avaliação'], summary: 'Salva avaliação (ADMIN, AVALIADOR)', security: sec,
    request: { params: params('id'), body: json(avaliacaoBodySchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Inscrições · Avaliadores ─────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/avaliadores', tags: ['Inscrições · Avaliadores'], summary: 'Atribui avaliadores (ADMIN)', security: sec,
    request: { params: params('id'), body: json(atribuirAvaliadoresSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/inscricoes/inscricao/{id}/avaliadores/avaliador/{avaliadorId}', tags: ['Inscrições · Avaliadores'], summary: 'Remove avaliador atribuído (ADMIN)', security: sec,
    request: { params: params('id', 'avaliadorId') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── Inscrições · Habilitação ─────────────────────────────────────────────────
  registry.registerPath({
    method: 'put', path: '/inscricoes/inscricao/{id}/habilitacao', tags: ['Inscrições · Habilitação'], summary: 'Atualiza habilitação (ADMIN, HABILITADOR)', security: sec,
    request: { params: params('id'), body: json(habilitacaoSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Inscrições · Recursos ────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}/recursos', tags: ['Inscrições · Recursos'], summary: 'Lista recursos da inscrição (autenticado)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/recursos/anexos', tags: ['Inscrições · Recursos'], summary: 'Envia anexo de recurso (PROPONENTE, multipart/form-data)', security: sec,
    request: {
      params: params('id'),
      body: { content: { 'multipart/form-data': { schema: z.object({ file: z.string().openapi({ format: 'binary' }) }) } } },
    },
    responses: { 201: { description: 'Criado', ...json(envelope(z.object({ url: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/recursos/recurso', tags: ['Inscrições · Recursos'], summary: 'Submete recurso (autenticado)', security: sec,
    request: { params: params('id'), body: json(submeterRecursoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/inscricoes/inscricao/{id}/recursos/recurso/{rid}', tags: ['Inscrições · Recursos'], summary: 'Decide recurso (ADMIN, HABILITADOR)', security: sec,
    request: { params: params('id', 'rid'), body: json(decidirRecursoSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/inscricao/{id}/recursos/recurso/{rid}/anexos', tags: ['Inscrições · Recursos'], summary: 'URL assinada de anexo de recurso (autenticado)', security: sec,
    request: { params: params('id', 'rid') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ url: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/recursos/recurso/{rid}/respostas', tags: ['Inscrições · Recursos'], summary: 'Responde recurso (AVALIADOR)', security: sec,
    request: { params: params('id', 'rid'), body: json(responderRecursoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Avaliadores ──────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/avaliadores', tags: ['Avaliadores'], summary: 'Lista avaliadores (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })

  // ── Contemplados ─────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/contemplados/import', tags: ['Contemplados'], summary: 'Importa contemplados (ADMIN)', security: sec,
    request: { body: json(importContempladosSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Logs ─────────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/logs', tags: ['Logs'], summary: 'Lista logs de auditoria (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
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

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
import { importContempladosFormSchema } from '@shared/schemas/contemplados.schema'
import { campaignSchema, ruleSchema } from '@shared/schemas/notifications.schema'
import {
  categoriaCreateSchema,
  categoriaUpdateSchema,
  categoriaReorderSchema,
} from '@shared/schemas/configuracoes-categorias.schema'
import {
  templateAvaliacaoCreateSchema,
  templateAvaliacaoUpdateSchema,
} from '@shared/schemas/configuracoes-templates-avaliacao.schema'
import {
  tipoAnexoCreateSchema,
  tipoAnexoUpdateSchema,
} from '@shared/schemas/configuracoes-tipos-anexo.schema'
import {
  emailTemplateUpsertSchema,
  emailTemplatePreviewSchema,
  emailTemplateTestSendSchema,
} from '@shared/schemas/email-templates.schema'
import { bannerSchema } from '@shared/schemas/banners.schema'
import { slideSchema } from '@shared/schemas/slides.schema'
import { newsletterInscricaoSchema } from '@shared/schemas/newsletter.schema'

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
  createPath?: string
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
    path: opts.createPath ?? opts.base,
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
  registry.register('ImportContempladosInput', importContempladosFormSchema)
  registry.register('CampaignInput', campaignSchema)
  registry.register('RuleInput', ruleSchema)
  registry.register('CategoriaCreateInput', categoriaCreateSchema)
  registry.register('CategoriaUpdateInput', categoriaUpdateSchema)
  registry.register('CategoriaReorderInput', categoriaReorderSchema)
  registry.register('TemplateAvaliacaoCreateInput', templateAvaliacaoCreateSchema)
  registry.register('TemplateAvaliacaoUpdateInput', templateAvaliacaoUpdateSchema)
  registry.register('TipoAnexoCreateInput', tipoAnexoCreateSchema)
  registry.register('TipoAnexoUpdateInput', tipoAnexoUpdateSchema)
  registry.register('EmailTemplateUpsertInput', emailTemplateUpsertSchema)
  registry.register('EmailTemplatePreviewInput', emailTemplatePreviewSchema)
  registry.register('EmailTemplateTestSendInput', emailTemplateTestSendSchema)
  registry.register('BannerInput', bannerSchema)
  registry.register('SlideInput', slideSchema)
  registry.register('NewsletterInscricaoInput', newsletterInscricaoSchema)
  registry.register('ErrorResponse', errorResponse)

  // ── Conteúdo (CMS / FAQ / Notícias) ─────────────────────────────────────────
  crud({ tag: 'CMS', base: '/cms', createPath: '/cms/pagina', name: 'páginas de conteúdo', input: cmsPageSchema, publicList: true, writeRoles: 'ADMIN' })
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

  crud({ tag: 'FAQ', base: '/faq', createPath: '/faq/item', name: 'itens de FAQ', input: faqSchema, publicList: true, writeRoles: 'ADMIN, ATENDIMENTO' })
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
    method: 'post', path: '/noticias/noticia', tags: ['Notícias'], summary: 'Cria notícia (ADMIN)', security: sec,
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
    method: 'post', path: '/tickets/ticket', tags: ['Tickets'], summary: 'Abre ticket (público)',
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
    method: 'get', path: '/autenticacao/api-keys', tags: ['API Keys'], summary: 'Lista API keys do usuário', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/autenticacao/api-keys/api-key', tags: ['API Keys'], summary: 'Cria API key (chave crua retornada uma vez)', security: sec,
    request: { body: json(createApiKeySchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/autenticacao/api-keys/api-key/{id}', tags: ['API Keys'], summary: 'Revoga API key', security: sec,
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
    method: 'post', path: '/autenticacao/sessoes/sessao/renovacao', tags: ['Autenticação'], summary: 'Renova token de sessão',
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
    method: 'patch', path: '/editais/edital/{id}/resultados/reordenacao', tags: ['Editais'], summary: 'Reordena resultados (ADMIN)', security: sec,
    request: { params: params('id'), body: json(reordenarResultadosInputSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Inscrições ──────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/inscricoes', tags: ['Inscrições'], summary: 'Lista todas as inscrições (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao', tags: ['Inscrições'], summary: 'Cria inscrição (PROPONENTE)', security: sec,
    request: { body: json(createInscricaoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/inscricoes/exportacao', tags: ['Inscrições'], summary: 'Exporta inscrições em CSV (ADMIN)', security: sec,
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
    method: 'post', path: '/inscricoes/inscricao/{id}/submissao', tags: ['Inscrições'], summary: 'Submete inscrição (PROPONENTE)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/inscricoes/inscricao/{id}/retratacao', tags: ['Inscrições'], summary: 'Retrata submissão da inscrição (PROPONENTE)', security: sec,
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
    method: 'post', path: '/contemplados/importacao', tags: ['Contemplados'], summary: 'Importa contemplados via CSV (ADMIN, multipart/form-data)', security: sec,
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: importContempladosFormSchema.extend({ file: z.string().openapi({ format: 'binary' }) }),
          },
        },
      },
    },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Logs ─────────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/logs', tags: ['Logs'], summary: 'Lista logs de auditoria (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/logs/expurgo', tags: ['Logs'], summary: 'Expurga logs de auditoria antigos (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/logs/erros/expurgo', tags: ['Logs'], summary: 'Expurga logs de erro antigos (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Notificações · Campanhas ─────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/notificacoes/campanhas', tags: ['Notificações · Campanhas'], summary: 'Lista campanhas de notificação (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/campanhas/campanha', tags: ['Notificações · Campanhas'], summary: 'Cria campanha (ADMIN)', security: sec,
    request: { body: json(campaignSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/notificacoes/campanhas/campanha/{id}', tags: ['Notificações · Campanhas'], summary: 'Detalha campanha (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/notificacoes/campanhas/campanha/{id}', tags: ['Notificações · Campanhas'], summary: 'Atualiza campanha (ADMIN)', security: sec,
    request: { params: params('id'), body: json(campaignSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/notificacoes/campanhas/campanha/{id}', tags: ['Notificações · Campanhas'], summary: 'Remove campanha (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/campanhas/campanha/{id}/envio', tags: ['Notificações · Campanhas'], summary: 'Dispara envio da campanha (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/campanhas/campanha/{id}/cancelamento', tags: ['Notificações · Campanhas'], summary: 'Cancela envio da campanha (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/campanhas/campanha/{id}/audiencia', tags: ['Notificações · Campanhas'], summary: 'Calcula audiência da campanha (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Notificações · Regras ────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/notificacoes/regras', tags: ['Notificações · Regras'], summary: 'Lista regras de notificação (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/regras/regra', tags: ['Notificações · Regras'], summary: 'Cria regra (ADMIN)', security: sec,
    request: { body: json(ruleSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/notificacoes/regras/regra/{id}', tags: ['Notificações · Regras'], summary: 'Detalha regra (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/notificacoes/regras/regra/{id}', tags: ['Notificações · Regras'], summary: 'Atualiza regra (ADMIN)', security: sec,
    request: { params: params('id'), body: json(ruleSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/notificacoes/regras/regra/{id}', tags: ['Notificações · Regras'], summary: 'Remove regra (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/regras/regra/{id}/ativacao', tags: ['Notificações · Regras'], summary: 'Ativa/desativa regra (ADMIN)', security: sec,
    request: { params: params('id'), body: json(z.object({ ativo: z.boolean() })) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/regras/regra/{id}/audiencia', tags: ['Notificações · Regras'], summary: 'Calcula audiência da regra (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Notificações · Inbox ─────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/notificacoes', tags: ['Notificações'], summary: 'Lista notificações enviadas (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/notificacoes/me', tags: ['Notificações'], summary: 'Inbox do usuário autenticado', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/notificacoes/me/nao-lidas', tags: ['Notificações'], summary: 'Conta notificações não lidas', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ total: z.number() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/me/lidas', tags: ['Notificações'], summary: 'Marca todas como lidas', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/notificacoes/me/notificacao/{id}/leitura', tags: ['Notificações'], summary: 'Marca notificação como lida', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Configurações · Categorias ───────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/configuracoes/categorias', tags: ['Configurações · Categorias'], summary: 'Lista categorias (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/configuracoes/categorias/categoria', tags: ['Configurações · Categorias'], summary: 'Cria categoria (ADMIN)', security: sec,
    request: { body: json(categoriaCreateSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/configuracoes/categorias/categoria/{id}', tags: ['Configurações · Categorias'], summary: 'Atualiza categoria (ADMIN)', security: sec,
    request: { params: params('id'), body: json(categoriaUpdateSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/configuracoes/categorias/categoria/{id}', tags: ['Configurações · Categorias'], summary: 'Remove categoria (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/configuracoes/categorias/reordenacao', tags: ['Configurações · Categorias'], summary: 'Reordena categorias (ADMIN)', security: sec,
    request: { body: json(categoriaReorderSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Configurações · Templates de Avaliação ───────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/configuracoes/templates-avaliacao', tags: ['Configurações · Templates de Avaliação'], summary: 'Lista templates de avaliação (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/configuracoes/templates-avaliacao/template', tags: ['Configurações · Templates de Avaliação'], summary: 'Cria template de avaliação (ADMIN)', security: sec,
    request: { body: json(templateAvaliacaoCreateSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/configuracoes/templates-avaliacao/template/{id}', tags: ['Configurações · Templates de Avaliação'], summary: 'Detalha template de avaliação (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/configuracoes/templates-avaliacao/template/{id}', tags: ['Configurações · Templates de Avaliação'], summary: 'Atualiza template de avaliação (ADMIN)', security: sec,
    request: { params: params('id'), body: json(templateAvaliacaoUpdateSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/configuracoes/templates-avaliacao/template/{id}', tags: ['Configurações · Templates de Avaliação'], summary: 'Remove template de avaliação (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── Configurações · Tipos de Anexo ───────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/configuracoes/tipos-anexo', tags: ['Configurações · Tipos de Anexo'], summary: 'Lista tipos de anexo (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/configuracoes/tipos-anexo/tipo', tags: ['Configurações · Tipos de Anexo'], summary: 'Cria tipo de anexo (ADMIN)', security: sec,
    request: { body: json(tipoAnexoCreateSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/configuracoes/tipos-anexo/tipo/{id}', tags: ['Configurações · Tipos de Anexo'], summary: 'Atualiza tipo de anexo (ADMIN)', security: sec,
    request: { params: params('id'), body: json(tipoAnexoUpdateSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/configuracoes/tipos-anexo/tipo/{id}', tags: ['Configurações · Tipos de Anexo'], summary: 'Remove tipo de anexo (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── E-mail Templates ─────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/email-templates', tags: ['E-mail Templates'], summary: 'Lista templates de e-mail (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/email-templates/template/{id}', tags: ['E-mail Templates'], summary: 'Detalha template de e-mail (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/email-templates/template/{id}', tags: ['E-mail Templates'], summary: 'Atualiza template de e-mail (ADMIN)', security: sec,
    request: { params: params('id'), body: json(emailTemplateUpsertSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/email-templates/template/{id}/previa', tags: ['E-mail Templates'], summary: 'Pré-visualiza template renderizado (ADMIN)', security: sec,
    request: { params: params('id'), body: json(emailTemplatePreviewSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/email-templates/template/{id}/teste', tags: ['E-mail Templates'], summary: 'Envia e-mail de teste (ADMIN)', security: sec,
    request: { params: params('id'), body: json(emailTemplateTestSendSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Banners ──────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/banners', tags: ['Banners'], summary: 'Lista banners (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/banners/banner', tags: ['Banners'], summary: 'Cria banner (ADMIN)', security: sec,
    request: { body: json(bannerSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/banners/banner/{id}', tags: ['Banners'], summary: 'Detalha banner (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/banners/banner/{id}', tags: ['Banners'], summary: 'Atualiza banner (ADMIN)', security: sec,
    request: { params: params('id'), body: json(bannerSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/banners/banner/{id}', tags: ['Banners'], summary: 'Remove banner (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── Slides ───────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/slides', tags: ['Slides'], summary: 'Lista slides (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/slides/slide', tags: ['Slides'], summary: 'Cria slide (ADMIN)', security: sec,
    request: { body: json(slideSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'get', path: '/slides/slide/{id}', tags: ['Slides'], summary: 'Detalha slide (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'put', path: '/slides/slide/{id}', tags: ['Slides'], summary: 'Atualiza slide (ADMIN)', security: sec,
    request: { params: params('id'), body: json(slideSchema) },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/slides/slide/{id}', tags: ['Slides'], summary: 'Remove slide (ADMIN)', security: sec,
    request: { params: params('id') },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── Newsletter / Contato ─────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/newsletter/inscricao', tags: ['Newsletter'], summary: 'Inscreve e-mail na newsletter (público)',
    request: { body: json(newsletterInscricaoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })
  registry.registerPath({
    method: 'post', path: '/contato/mensagem', tags: ['Contato'], summary: 'Abre ticket de contato (público)',
    request: { body: json(createAtendimentoSchema) },
    responses: { 201: { description: 'Criado', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Upload ───────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/upload/imagem', tags: ['Upload'], summary: 'Envia imagem para o storage (ADMIN, multipart/form-data)', security: sec,
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.string().openapi({ format: 'binary' }),
              pasta: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: { 201: { description: 'Criado', ...json(envelope(z.object({ url: z.string() }))) }, ...errors },
  })

  // ── Usuários ─────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/usuarios/busca', tags: ['Usuários'], summary: 'Busca usuários por nome/CPF/papel (ADMIN)', security: sec,
    request: {
      query: z.object({
        q: z.string().optional(),
        ids: z.string().optional(),
        role: z.enum(['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN']).optional(),
        limit: z.coerce.number().optional(),
      }),
    },
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
  })

  // ── Me · Avatar ──────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/me/avatar', tags: ['Me'], summary: 'Envia avatar do usuário (autenticado, multipart/form-data)', security: sec,
    request: {
      body: {
        content: {
          'multipart/form-data': { schema: z.object({ file: z.string().openapi({ format: 'binary' }) }) },
        },
      },
    },
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ url: z.string() }))) }, ...errors },
  })
  registry.registerPath({
    method: 'delete', path: '/me/avatar', tags: ['Me'], summary: 'Remove avatar do usuário (autenticado)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.object({ message: z.string() }))) }, ...errors },
  })

  // ── Autenticação · Declaração ────────────────────────────────────────────────
  registry.registerPath({
    method: 'post', path: '/autenticacao/usuarios/declaracao', tags: ['Autenticação'], summary: 'Envia declaração do usuário (autenticado, multipart/form-data)', security: sec,
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.string().openapi({ format: 'binary' }),
              userId: z.string(),
            }),
          },
        },
      },
    },
    responses: { 200: { description: 'OK', ...json(envelope(z.unknown())) }, ...errors },
  })

  // ── Recursos (lista agregada) ────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/recursos', tags: ['Recursos'], summary: 'Lista recursos visíveis ao usuário (autenticado)', security: sec,
    responses: { 200: { description: 'OK', ...json(paginatedEnvelope(z.unknown())) }, ...errors },
  })

  // ── Habilitadores ────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get', path: '/habilitadores', tags: ['Habilitadores'], summary: 'Lista habilitadores (ADMIN)', security: sec,
    responses: { 200: { description: 'OK', ...json(envelope(z.array(z.unknown()))) }, ...errors },
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

import { Prisma, type StatusConteudo, type UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit, type AuditAction } from '@/lib/audit'
import { slugify } from '@/lib/utils/slug'
import { podeTransicionar } from '@/lib/memorial/publicacao'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { ServiceError } from './errors'

/**
 * Peças comuns aos serviços do Memorial (exposição, acervo, pessoa, evento, álbum):
 * slug, vínculos M:N, versão, auditoria e mudança de status.
 */

export interface Autor {
  userId: string
  role: UserRole
  ip?: string
}

export type EntidadeMemorial =
  | 'MemorialExposicao'
  | 'MemorialAcervoItem'
  | 'MemorialPessoa'
  | 'MemorialEvento'
  | 'MemorialAlbum'
  | 'MemorialConfig'

const PAPEIS_EDITORIAIS: UserRole[] = ['COMUNICACAO', 'SUPER_ADMIN']

export function paginar(p: { page: number; pageSize: number }) {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize }
}

export function metaPaginacao(p: { page: number; pageSize: number }, total: number) {
  return { page: p.page, pageSize: p.pageSize, total, totalPages: Math.ceil(total / p.pageSize) }
}

/** Para `create`: liga os ids informados. */
export function conectar(ids?: string[]) {
  return ids?.length ? { connect: ids.map((id) => ({ id })) } : undefined
}

/** Para `update`: lista informada substitui os vínculos; ausente mantém como está. */
export function substituir(ids?: string[]) {
  return ids ? { set: ids.map((id) => ({ id })) } : undefined
}

export function exigirEncontrado<T>(registro: T | null, mensagem: string): T {
  if (!registro) throw new ServiceError('NOT_FOUND', mensagem)
  return registro
}

/**
 * Slug escolhido pela equipe é respeitado (conflito vira erro); sem escolha, nasce do
 * título e ganha sufixo numérico se já estiver em uso.
 */
export async function definirSlug(
  escolhido: string | undefined,
  titulo: string,
  emUso: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (escolhido) {
    if (await emUso(escolhido)) throw new ServiceError('CONFLICT', 'Este endereço (slug) já está em uso.')
    return escolhido
  }
  const base = slugify(titulo).slice(0, 100) || 'memorial'
  let candidato = base
  for (let n = 2; await emUso(candidato); n++) candidato = `${base}-${n}`
  return candidato
}

export type FiltroSlug = { slug: string; id?: { not: string } }

/** Monta o teste "slug em uso?" de uma entidade, ignorando o próprio registro na edição. */
export function verificadorDeSlug(contar: (where: FiltroSlug) => Promise<number>, ignorarId?: string) {
  return async (slug: string) => (await contar(ignorarId ? { slug, id: { not: ignorarId } } : { slug })) > 0
}

/** Converte violação de unicidade do Prisma em 409 legível. */
export async function comConflito<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ServiceError('CONFLICT', 'Já existe um registro com este endereço (slug).')
    }
    throw err
  }
}

/** Grava uma nova versão (snapshot do estado atual) no histórico. */
export async function registrarVersao(
  entidade: EntidadeMemorial,
  entidadeId: string,
  estado: unknown,
  userId: string,
) {
  const ultima = await prisma.memorialVersao.findFirst({
    where: { entidade, entidadeId },
    orderBy: { versao: 'desc' },
    select: { versao: true },
  })
  // JSON ida e volta: datas viram ISO e o snapshot fica independente do tipo do Prisma
  const snapshot = JSON.parse(JSON.stringify(estado)) as Prisma.InputJsonValue
  await prisma.memorialVersao.create({
    data: { entidade, entidadeId, versao: (ultima?.versao ?? 0) + 1, snapshot, criadoPorId: userId },
  })
}

export async function listarVersoes(
  entidade: EntidadeMemorial,
  entidadeId: string,
  p: { page: number; pageSize: number },
) {
  const where = { entidade, entidadeId }
  const [itens, total] = await Promise.all([
    prisma.memorialVersao.findMany({ where, orderBy: { versao: 'desc' }, ...paginar(p) }),
    prisma.memorialVersao.count({ where }),
  ])
  return { itens, total }
}

type AcaoMemorial = Extract<AuditAction, `MEMORIAL_CONTEUDO_${string}` | 'MEMORIAL_CONFIG_ATUALIZADA'>

/** Auditoria + versão numa chamada. Exclusão não gera versão: o histórico anterior fica. */
export async function registrarAlteracao(params: {
  acao: AcaoMemorial
  entidade: EntidadeMemorial
  id: string
  rotulo: string
  autor: Autor
  estado?: unknown
  detalhes?: Record<string, unknown>
}) {
  const { acao, entidade, id, rotulo, autor, estado, detalhes } = params
  if (estado !== undefined) await registrarVersao(entidade, id, estado, autor.userId)
  await logAudit({
    userId: autor.userId,
    action: acao,
    entity: entidade,
    entityId: id,
    details: { rotulo, ...detalhes },
    ip: autor.ip,
  })
}

/**
 * Muda o status respeitando o fluxo editorial. Publicar exige papel editorial e os
 * campos mínimos de cada tipo de conteúdo (`pendencias`).
 */
export async function transicionar<T extends { id: string; status: StatusConteudo }>(params: {
  entidade: EntidadeMemorial
  autor: Autor
  atual: T | null
  novo: StatusConteudo
  pendencias: (registro: T) => string[]
  rotulo: (registro: T) => string
  salvar: (status: StatusConteudo) => Promise<T>
}): Promise<T> {
  const { entidade, autor, novo } = params
  if (!PAPEIS_EDITORIAIS.includes(autor.role)) {
    throw new ServiceError('FORBIDDEN', 'Só a equipe de comunicação pode mudar o status do conteúdo.')
  }
  const atual = exigirEncontrado(params.atual, 'Conteúdo não encontrado.')
  if (!podeTransicionar(atual.status, novo)) {
    throw new ServiceError(
      'BAD_REQUEST',
      `Não é possível passar de "${ROTULO_STATUS[atual.status]}" para "${ROTULO_STATUS[novo]}".`,
    )
  }
  if (novo === 'PUBLICADO') {
    const falta = params.pendencias(atual)
    if (falta.length > 0) {
      throw new ServiceError('LOCKED', `Para publicar, preencha: ${falta.join(', ')}.`)
    }
  }

  const salvo = await params.salvar(novo)
  await registrarAlteracao({
    acao: novo === 'PUBLICADO' ? 'MEMORIAL_CONTEUDO_PUBLICADO' : 'MEMORIAL_CONTEUDO_ATUALIZADO',
    entidade,
    id: salvo.id,
    rotulo: params.rotulo(salvo),
    autor,
    estado: salvo,
    detalhes: { de: atual.status, para: novo },
  })
  return salvo
}

import { randomInt } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { toCsv } from '@/lib/export/csv'
import { construirSchemaDeRespostas, colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import { ServiceError } from './errors'
import type { CampoFormulario } from '@/types/campo-formulario'

type Cliente = Prisma.TransactionClient | typeof prisma

/** Texto solto é procurado como id ou como slug. */
export type ReferenciaQuestionario = string | { id: string } | { slug: string }

function filtroDaReferencia(ref: ReferenciaQuestionario): Prisma.QuestionarioWhereInput {
  if (typeof ref === 'string') return { OR: [{ id: ref }, { slug: ref }] }
  return 'id' in ref ? { id: ref.id } : { slug: ref.slug }
}

export interface ContextoResposta {
  userId?: string | null
  nome?: string | null
  email?: string | null
  ip?: string
  /** Transação de quem chama (ex.: agendamento do Memorial grava a visita e a resposta juntas). */
  tx?: Prisma.TransactionClient
  /** Fluxos internos podem aceitar questionário ainda não publicado. Padrão: só publicado. */
  exigirPublicado?: boolean
}

// Sem 0/O, 1/I/L: o protocolo é lido em voz alta e anotado à mão.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

function sortearProtocolo(): string {
  let sufixo = ''
  for (let i = 0; i < 6; i++) sufixo += ALFABETO[randomInt(ALFABETO.length)]
  return `QST-${new Date().getFullYear()}-${sufixo}`
}

async function protocoloLivre(db: Cliente): Promise<string> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const protocolo = sortearProtocolo()
    const existe = await db.questionarioResposta.findUnique({ where: { protocolo }, select: { id: true } })
    if (!existe) return protocolo
  }
  throw new Error('Não foi possível gerar protocolo único para a resposta')
}

/**
 * Valida as respostas pelos campos vigentes do questionário e grava junto a
 * versão e o snapshot desses campos. Pensada para ser chamada também por
 * outros módulos: com `contexto.tx`, roda dentro da transação de quem chama e
 * não registra auditoria — o fluxo que abriu a transação audita a própria ação,
 * assim não sobra log de resposta que foi desfeita no rollback.
 *
 * Lança `ZodError` (respostas inválidas) ou `ServiceError`.
 */
export async function registrarRespostaQuestionario(
  ref: ReferenciaQuestionario,
  dados: Record<string, unknown>,
  contexto: ContextoResposta = {},
) {
  const db: Cliente = contexto.tx ?? prisma
  const questionario = await db.questionario.findFirst({
    where: filtroDaReferencia(ref),
    select: { id: true, slug: true, status: true, campos: true, versao: true, exigeLogin: true, mensagemSucesso: true },
  })
  const exigirPublicado = contexto.exigirPublicado ?? true
  if (!questionario || (exigirPublicado && questionario.status !== 'PUBLICADO')) {
    throw new ServiceError('NOT_FOUND', 'Questionário não encontrado.')
  }
  if (questionario.exigeLogin && !contexto.userId) {
    throw new ServiceError('UNAUTHORIZED', 'Entre na sua conta para responder este questionário.')
  }

  const campos = questionario.campos as unknown as CampoFormulario[]
  const respostas = construirSchemaDeRespostas(campos).parse(dados)

  const resposta = await db.questionarioResposta.create({
    data: {
      questionarioId: questionario.id,
      protocolo: await protocoloLivre(db),
      versao: questionario.versao,
      camposSnapshot: campos as unknown as Prisma.InputJsonValue,
      dados: respostas as Prisma.InputJsonValue,
      userId: contexto.userId ?? null,
      nome: contexto.nome || null,
      email: contexto.email || null,
    },
    select: { id: true, protocolo: true, createdAt: true },
  })

  if (!contexto.tx) {
    await logAudit({
      userId: contexto.userId ?? undefined,
      action: AUDIT_ACTIONS.QUESTIONARIO_RESPOSTA_ENVIADA,
      entity: 'QuestionarioResposta',
      entityId: resposta.id,
      details: { questionarioId: questionario.id, slug: questionario.slug, versao: questionario.versao },
      ip: contexto.ip,
    })
  }

  return { ...resposta, mensagemSucesso: questionario.mensagemSucesso }
}

async function garantirQuestionario(questionarioId: string) {
  const existe = await prisma.questionario.findUnique({ where: { id: questionarioId }, select: { id: true, slug: true } })
  if (!existe) throw new ServiceError('NOT_FOUND', 'Questionário não encontrado.')
  return existe
}

export async function listarRespostas(questionarioId: string, page: number, pageSize: number) {
  await garantirQuestionario(questionarioId)
  const where = { questionarioId }
  const [data, total] = await Promise.all([
    prisma.questionarioResposta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, protocolo: true, versao: true, camposSnapshot: true, dados: true, nome: true, email: true, createdAt: true },
    }),
    prisma.questionarioResposta.count({ where }),
  ])
  return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

/**
 * Exporta todas as respostas, uma coluna por campo-folha. A ordem das colunas
 * segue a versão mais recente e acrescenta no fim o que só existia em versões
 * anteriores.
 */
export async function exportarRespostasCsv(questionarioId: string, userId: string, ip?: string) {
  const questionario = await garantirQuestionario(questionarioId)
  const respostas = await prisma.questionarioResposta.findMany({
    where: { questionarioId },
    orderBy: { createdAt: 'asc' },
    select: { protocolo: true, versao: true, camposSnapshot: true, dados: true, nome: true, email: true, createdAt: true },
  })

  const snapshotsPorVersao = new Map<number, CampoFormulario[]>()
  for (const r of respostas) snapshotsPorVersao.set(r.versao, r.camposSnapshot as unknown as CampoFormulario[])
  const snapshots = [...snapshotsPorVersao].sort(([a], [b]) => b - a).map(([, campos]) => campos)
  const colunas = colunasDosSnapshots(snapshots)

  const cabecalho = ['Protocolo', 'Enviado em', 'Versão', 'Nome', 'E-mail', ...colunas.map((c) => c.rotulo)]
  const linhas = respostas.map((r) => {
    const dados = (r.dados ?? {}) as Record<string, unknown>
    return [
      r.protocolo,
      r.createdAt.toISOString(),
      r.versao,
      r.nome ?? '',
      r.email ?? '',
      ...colunas.map((c) => valorDaColuna(dados, c.chave)),
    ]
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.EXPORTACAO_CSV,
    entity: 'Questionario',
    entityId: questionarioId,
    details: { slug: questionario.slug, total: respostas.length },
    ip,
  })

  return { csv: toCsv([cabecalho, ...linhas]), nomeArquivo: `respostas-${questionario.slug}.csv` }
}

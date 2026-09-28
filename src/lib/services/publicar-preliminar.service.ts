import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { marcarCronogramaDoPreliminar } from '@/lib/edital/cronograma-preliminar'
import { resolverTemplateResultado } from '@/lib/edital/template-resultado'
import { avisarProponentesDoResultado } from '@/lib/results/avisar-resultado'
import { montarClassificacao } from '@/lib/results/classificacao'
import { opcoesDaClassificacao } from '@/lib/results/classificacao-opcoes'
import { guardarResultadoPreliminar, lerResultadoPreliminar } from '@/lib/results/resultado-publico'
import { STATUS_EM_PROCESSO_AVALIACAO } from './avaliacao-buckets'
import { ServiceError } from './errors'

/** Fases em que o preliminar ainda pode ser publicado (as mesmas em que a tela oferece o botão). */
const FASES_PARA_PUBLICAR = ['INSCRICOES_ENCERRADAS', 'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR']
const PRAZO_DA_TRANSACAO_MS = 60_000
const MAXIMO_LISTADO = 10

interface PublicarPreliminarInput {
  editalId: string
  userId: string
  ip?: string
  /** Padrão: não avisa. O preliminar circula pelo Diário Oficial e pela página do edital. */
  avisarPorEmail?: boolean
}

export interface PreliminarPublicado {
  total: number
  contempladas: number
  suplentes: number
  naoContempladas: number
  hasEmpates: boolean
  /** O que ficou por ligar no cronograma; a publicação segue mesmo assim. */
  avisos: string[]
}

/** Toda inscrição em avaliação precisa ter ao menos uma avaliação finalizada, senão sairia desclassificada por falta de nota. */
async function exigirAvaliacoes(editalId: string): Promise<void> {
  const semNota = await prisma.inscricao.findMany({
    where: { editalId, status: { in: STATUS_EM_PROCESSO_AVALIACAO }, avaliacoes: { none: { finalizada: true } } },
    select: { numero: true },
    orderBy: { numero: 'asc' },
  })
  if (semNota.length === 0) return

  const numeros = semNota.slice(0, MAXIMO_LISTADO).map((i) => i.numero).join(', ')
  const resto = semNota.length > MAXIMO_LISTADO ? ` e mais ${semNota.length - MAXIMO_LISTADO}` : ''
  throw new ServiceError(
    'BAD_REQUEST',
    `Há inscrição sem avaliação finalizada (${numeros}${resto}). Conclua as avaliações antes de publicar.`,
  )
}

/**
 * Publica o resultado preliminar com a classificação: quem foi classificado, suplente ou desclassificado.
 *
 * Numa transação só: grava nota, posição e situação de cada inscrição, congela a lista que a página
 * pública lê, leva o edital a RESULTADO_PRELIMINAR (o que libera nota e parecer ao proponente) e liga
 * os marcos do cronograma. A classificação sai do mesmo cálculo da tela e do PDF. Publicar uma segunda
 * vez é recusado: a lista congelada é a que circulou no Diário Oficial.
 */
export async function publicarResultadoPreliminar(input: PublicarPreliminarInput): Promise<PreliminarPublicado> {
  const { editalId, userId, ip, avisarPorEmail = false } = input

  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: {
      id: true, titulo: true, slug: true, status: true, cronograma: true,
      vagasSuplentes: true, notaMinima: true, categoriasConfig: true, resultadoTemplate: true,
      resultadoPreliminar: true, resultadoPreliminarPublicadoEm: true,
    },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')
  if (!FASES_PARA_PUBLICAR.includes(edital.status)) {
    throw new ServiceError('BAD_REQUEST', 'O resultado preliminar só pode ser publicado até a fase de avaliação.')
  }
  if (edital.resultadoPreliminarPublicadoEm || lerResultadoPreliminar(edital.resultadoPreliminar)) {
    throw new ServiceError('CONFLICT', 'O resultado preliminar deste edital já foi publicado.')
  }
  await exigirAvaliacoes(editalId)

  const { foraDaClassificacao } = resolverTemplateResultado(edital.resultadoTemplate)
  const categorias = await montarClassificacao(editalId, opcoesDaClassificacao(edital, true))
  const linhas = categorias.flatMap((c) => c.linhas).filter((l) => !foraDaClassificacao.includes(l.numero))
  if (linhas.length === 0) throw new ServiceError('BAD_REQUEST', 'Nenhuma inscrição avaliada encontrada.')

  const agora = new Date()
  const { cronograma, avisos } = marcarCronogramaDoPreliminar(edital.cronograma)

  await prisma.$transaction(async (tx) => {
    for (const linha of linhas) {
      await tx.inscricao.update({
        where: { id: linha.inscricaoId },
        data: { notaFinal: linha.notaFinal, notaBonus: linha.notaBonus, posicao: linha.posicao, status: linha.status },
      })
    }
    await guardarResultadoPreliminar(editalId, agora, tx)
    await tx.edital.update({
      where: { id: editalId },
      data: {
        status: 'RESULTADO_PRELIMINAR',
        resultadoPreliminarPublicadoEm: agora,
        ...(Array.isArray(cronograma) ? { cronograma: cronograma as Prisma.InputJsonValue } : {}),
      },
    })
  }, { timeout: PRAZO_DA_TRANSACAO_MS })

  const conta = (situacao: string) => linhas.filter((l) => l.status === situacao).length
  const publicado: PreliminarPublicado = {
    total: linhas.length,
    contempladas: conta('CONTEMPLADA'),
    suplentes: conta('SUPLENTE'),
    naoContempladas: conta('NAO_CONTEMPLADA'),
    hasEmpates: linhas.some((l) => l.empatado),
    avisos,
  }

  await logAudit({
    userId,
    action: 'RESULTADO_PRELIMINAR_PUBLICADO',
    entity: 'Edital',
    entityId: editalId,
    details: {
      fase: 'RESULTADO_PRELIMINAR', totalInscrições: publicado.total, contempladas: publicado.contempladas,
      suplentes: publicado.suplentes, naoContempladas: publicado.naoContempladas, avisouPorEmail: avisarPorEmail, avisos,
    },
    ip,
  })

  if (avisarPorEmail) {
    await avisarProponentesDoResultado({
      inscricaoIds: linhas.map((l) => l.inscricaoId), editalTitulo: edital.titulo, slug: edital.slug, final: false,
    })
  }

  return publicado
}

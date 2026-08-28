import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { ServiceError } from '@/lib/services/errors'
import { migrateLegacyCronograma, validateCronogramaOrderServer } from '@/lib/utils/cronograma'
import {
  aplicarRetificacao,
  parseRetificacoes,
  removerRetificacao,
  reverterRetificacao,
} from '@/lib/utils/retificacao'
import type { RegistrarRetificacaoInput } from '@/lib/schemas/retificacao'
import type { Retificacao } from '@/types/retificacao'

interface Ator {
  userId: string
  ip?: string
}

/**
 * Grava uma retificação já publicada no Diário Oficial e aplica ao cronograma
 * as datas que ela alterou.
 *
 * Guardar a data anterior é responsabilidade do sistema, não de quem preenche:
 * a operadora informa apenas a data nova, e o carimbo do que valia antes é
 * lido do próprio cronograma no momento de salvar. Sem isso, a data riscada na
 * tela dependeria de alguém redigitar corretamente uma data que o sistema já
 * conhece.
 */
export async function registrarRetificacao(
  editalId: string,
  input: RegistrarRetificacaoInput,
  ator: Ator,
): Promise<{ retificacao: Retificacao; marcosAlterados: number }> {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, cronograma: true, retificacoes: true },
  })

  if (!edital) {
    throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')
  }

  const jaExistentes = parseRetificacoes(edital.retificacoes)
  if (jaExistentes.some((r) => r.numero === input.numero)) {
    throw new ServiceError(
      'CONFLICT',
      `Já existe a retificação nº ${input.numero} neste edital. Desfaça a anterior ou use outro número.`,
    )
  }

  const cronogramaNovo = aplicarRetificacao(edital.cronograma, input.numero, input.alteracoes)

  // Uma retificação que deixa o cronograma fora de ordem publicaria ao cidadão
  // um prazo que termina antes de começar — barra antes de gravar.
  const erros = validateCronogramaOrderServer(cronogramaNovo)
  if (erros.length > 0) {
    throw new ServiceError(
      'BAD_REQUEST',
      `As novas datas deixam o cronograma fora de ordem: ${erros.join('; ')}`,
    )
  }

  const marcosAlterados = cronogramaNovo.filter(
    (item) => item.retificado?.retificacaoNumero === input.numero,
  ).length

  const retificacao: Retificacao = {
    numero: input.numero,
    publicadoEm: input.publicadoEm,
    resumo: input.resumo,
    ...(input.diarioOficialUrl ? { diarioOficialUrl: input.diarioOficialUrl } : {}),
    registradoEm: new Date().toISOString(),
  }

  await prisma.edital.update({
    where: { id: editalId },
    data: {
      cronograma: cronogramaNovo as unknown as object,
      retificacoes: [...jaExistentes, retificacao] as unknown as object,
    },
  })

  await logAudit({
    userId: ator.userId,
    action: 'EDITAL_RETIFICADO',
    entity: 'Edital',
    entityId: editalId,
    details: {
      editalTitulo: edital.titulo,
      numero: input.numero,
      publicadoEm: input.publicadoEm,
      marcosAlterados,
      alteracoes: input.alteracoes,
    },
    ip: ator.ip,
  })

  return { retificacao, marcosAlterados }
}

/**
 * Desfaz uma retificação: restaura as datas que valiam antes dela e apaga o
 * registro do ato. Usado quando o lançamento não bate com o que saiu no
 * Diário — situação em que reescrever as datas à mão deixaria a tela riscando
 * uma data que nunca existiu.
 */
export async function desfazerRetificacao(
  editalId: string,
  numero: string,
  ator: Ator,
): Promise<{ marcosRestaurados: number }> {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, cronograma: true, retificacoes: true },
  })

  if (!edital) {
    throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')
  }

  const existentes = parseRetificacoes(edital.retificacoes)
  if (!existentes.some((r) => r.numero === numero)) {
    throw new ServiceError('NOT_FOUND', `Retificação nº ${numero} não encontrada neste edital.`)
  }

  const marcosRestaurados = migrateLegacyCronograma(edital.cronograma).filter(
    (item) => item.retificado?.retificacaoNumero === numero,
  ).length
  const cronogramaAnterior = reverterRetificacao(edital.cronograma, numero)

  await prisma.edital.update({
    where: { id: editalId },
    data: {
      cronograma: cronogramaAnterior as unknown as object,
      retificacoes: removerRetificacao(edital.retificacoes, numero) as unknown as object,
    },
  })

  await logAudit({
    userId: ator.userId,
    action: 'EDITAL_RETIFICACAO_DESFEITA',
    entity: 'Edital',
    entityId: editalId,
    details: { editalTitulo: edital.titulo, numero, marcosRestaurados },
    ip: ator.ip,
  })

  return { marcosRestaurados }
}

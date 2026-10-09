import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ServiceError } from '@/lib/services/errors'
import { obterQuestionario } from '@/lib/services/questionario.service'
import { intervaloDoPeriodo, type Periodo } from './periodo'

const POR_PAGINA = 20

async function questionarioOu404(id: string) {
  try {
    return await obterQuestionario(id)
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound()
    throw err
  }
}

/**
 * Respostas de um questionário, da mais nova para a mais antiga, com filtro
 * opcional de período. Mesmo recorte de campos da listagem da API.
 */
export async function carregarRespostas(id: string, page: number, periodo: Periodo) {
  const questionario = await questionarioOu404(id)
  const intervalo = intervaloDoPeriodo(periodo)
  const where = { questionarioId: id, ...(intervalo.gte || intervalo.lt ? { createdAt: intervalo } : {}) }
  const [data, total, totalGeral] = await Promise.all([
    prisma.questionarioResposta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: { id: true, protocolo: true, versao: true, camposSnapshot: true, dados: true, nome: true, email: true, createdAt: true },
    }),
    prisma.questionarioResposta.count({ where }),
    prisma.questionarioResposta.count({ where: { questionarioId: id } }),
  ])
  return { questionario, data, total, totalGeral, page, totalPages: Math.ceil(total / POR_PAGINA) }
}

export type Resposta = Awaited<ReturnType<typeof carregarRespostas>>['data'][number]

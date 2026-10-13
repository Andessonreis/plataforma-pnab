import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { registrarRespostaQuestionario } from '@/lib/services/questionario-resposta.service'
import type { CampoFormulario } from '@/types/campo-formulario'

/**
 * Ponte entre o agendamento e os questionários configuráveis. As perguntas extras são
 * as de um questionário publicado com a finalidade abaixo; se a equipe não publicou
 * nenhum, o agendamento segue só com os campos fixos.
 */
export const FINALIDADE_AGENDAMENTO = 'memorial-agendamento'

export interface QuestionarioAgendamento {
  id: string
  slug: string
  titulo: string
  descricao: string | null
  campos: CampoFormulario[]
}

export async function buscarPerguntasExtras(): Promise<QuestionarioAgendamento | null> {
  const q = await prisma.questionario.findFirst({
    where: { finalidade: FINALIDADE_AGENDAMENTO, status: 'PUBLICADO' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, slug: true, titulo: true, descricao: true, campos: true },
  })
  if (!q) return null
  return { ...q, campos: Array.isArray(q.campos) ? (q.campos as unknown as CampoFormulario[]) : [] }
}

interface Autor {
  userId?: string
  nome: string
  email: string
}

/** Valida e grava as respostas dentro da transação do agendamento; devolve o id da resposta. */
export async function registrarPerguntasExtras(
  tx: Prisma.TransactionClient,
  questionarioId: string,
  dados: Record<string, unknown>,
  autor: Autor,
): Promise<string> {
  const resposta = await registrarRespostaQuestionario(questionarioId, dados, { ...autor, tx })
  return resposta.id
}

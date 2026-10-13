import { prisma } from '@/lib/db'
import type { ListarQuestionariosInput } from '@/lib/schemas/questionario'
import { listarQuestionarios } from '@/lib/services/questionario.service'
import type { CampoFormulario } from '@/types/campo-formulario'

/**
 * Lista do painel com o que o cartão precisa mostrar além da listagem padrão:
 * o texto das perguntas e a data da última resposta. Duas consultas a mais,
 * limitadas aos questionários da página.
 */
export async function carregarLista(consulta: ListarQuestionariosInput) {
  const { data, meta } = await listarQuestionarios(consulta)
  const ids = data.map((q) => q.id)
  const [detalhes, ultimas] = await Promise.all([
    prisma.questionario.findMany({ where: { id: { in: ids } }, select: { id: true, descricao: true, campos: true } }),
    prisma.questionarioResposta.groupBy({ by: ['questionarioId'], where: { questionarioId: { in: ids } }, _max: { createdAt: true } }),
  ])
  const detalhePor = new Map(detalhes.map((d) => [d.id, d]))
  const ultimaPor = new Map(ultimas.map((u) => [u.questionarioId, u._max.createdAt]))

  return {
    meta,
    questionarios: data.map((q) => {
      const campos = (detalhePor.get(q.id)?.campos ?? []) as unknown as CampoFormulario[]
      return {
        ...q,
        descricao: detalhePor.get(q.id)?.descricao ?? null,
        perguntas: campos.filter((c) => c.tipo !== 'info').map((c) => c.label),
        ultimaResposta: ultimaPor.get(q.id) ?? null,
      }
    }),
  }
}

export type QuestionarioDaLista = Awaited<ReturnType<typeof carregarLista>>['questionarios'][number]

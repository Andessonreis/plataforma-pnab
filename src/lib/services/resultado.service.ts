import { prisma } from '@server/lib/db'
import { logAudit } from '@/lib/audit'
import { calculateResults, saveResults } from '@/lib/results/calculate'
import { enqueueEmail } from '@/lib/queue'
import { ServiceError } from '@shared/service-error'

export async function getResultados(editalId: string) {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, status: true },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const inscricoes = await prisma.inscricao.findMany({
    where: { editalId },
    include: {
      proponente: { select: { nome: true, cpfCnpj: true } },
      avaliacoes: {
        where: { finalizada: true },
        select: { notaTotal: true, avaliadorId: true },
      },
    },
    orderBy: { notaFinal: { sort: 'desc', nulls: 'last' } },
  })

  const resultados = inscricoes
    .filter((i) => !['RASCUNHO', 'ENVIADA'].includes(i.status))
    .map((i, index) => ({
      posicao: index + 1,
      inscricaoId: i.id,
      numero: i.numero,
      proponenteNome: i.proponente.nome,
      categoria: i.categoria,
      notaFinal: i.notaFinal ? Number(i.notaFinal) : null,
      status: i.status,
      totalAvaliacoes: i.avaliacoes.length,
    }))

  return { edital, resultados }
}

export async function publishResultados(
  editalId: string,
  fase: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL',
  userId: string,
  ip?: string,
) {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, slug: true, status: true, vagasContemplados: true, vagasSuplentes: true },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const resultados = await calculateResults(editalId)
  if (resultados.length === 0) {
    throw new ServiceError('BAD_REQUEST', 'Nenhuma inscrição avaliada encontrada.')
  }

  await saveResults(resultados, fase, {
    contemplados: edital.vagasContemplados,
    suplentes: edital.vagasSuplentes,
  })

  const editalStatus = fase === 'RESULTADO_FINAL' ? 'RESULTADO_FINAL' : 'RESULTADO_PRELIMINAR'
  await prisma.edital.update({
    where: { id: editalId },
    data: { status: editalStatus },
  })

  // Notifica proponentes
  const inscricoes = await prisma.inscricao.findMany({
    where: { id: { in: resultados.map((r) => r.inscricaoId) } },
    include: { proponente: { select: { email: true, nome: true } } },
  })

  const template = fase === 'RESULTADO_FINAL' ? 'resultado_final' : 'resultado_preliminar'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  for (const inscricao of inscricoes) {
    try {
      await enqueueEmail({
        to: inscricao.proponente.email,
        subject: `${fase === 'RESULTADO_FINAL' ? 'Resultado Final' : 'Resultado Preliminar'} — ${edital.titulo}`,
        template,
        data: {
          edital: edital.titulo,
          url: `${baseUrl}/editais/${edital.slug}/resultados`,
        },
      })
    } catch {
      // Não bloqueia publicação se falhar enfileiramento
    }
  }

  const auditAction = fase === 'RESULTADO_FINAL'
    ? 'RESULTADO_FINAL_PUBLICADO'
    : 'RESULTADO_PRELIMINAR_PUBLICADO'

  await logAudit({
    userId,
    action: auditAction,
    entity: 'Edital',
    entityId: editalId,
    details: { fase, totalInscrições: resultados.length },
    ip,
  })

  return { totalInscrições: resultados.length }
}

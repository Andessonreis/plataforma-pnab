import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { calculateResults, saveResults } from '@/lib/results/calculate'
import { viewNotaFinal } from '@/lib/services/resultado-view'
import { guardarResultadoPreliminar } from '@/lib/results/resultado-publico'
import { hrefResultados } from '@/lib/edital/rotas-resultado'
import { enqueueEmail } from '@/lib/queue'
import { ServiceError } from './errors'

export async function getResultados(editalId: string, role: UserRole) {
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { id: true, titulo: true, status: true, bonusVisivelParaAdmin: true },
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
      notaFinal: viewNotaFinal(i, role, edital.bonusVisivelParaAdmin),
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
    select: { id: true, titulo: true, slug: true, status: true, vagasContemplados: true, vagasSuplentes: true, notaMinima: true, categoriasConfig: true },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const resultados = await calculateResults(editalId)
  if (resultados.length === 0) {
    throw new ServiceError('BAD_REQUEST', 'Nenhuma inscrição avaliada encontrada.')
  }

  await saveResults(resultados, fase, {
    contemplados: edital.vagasContemplados,
    suplentes: edital.vagasSuplentes,
    notaMinima: edital.notaMinima ? Number(edital.notaMinima) : null,
    categoriasConfig: Array.isArray(edital.categoriasConfig)
      ? (edital.categoriasConfig as unknown as import('@/types/categoria-config').CategoriaConfig[])
      : null,
  })

  // A página do preliminar lê esta cópia: depois do recurso as inscrições já não a refletem.
  // Vem antes de mudar o status: se falhar, o edital continua na fase e a publicação se repete.
  if (fase === 'RESULTADO_PRELIMINAR') await guardarResultadoPreliminar(editalId)

  const editalStatus = fase === 'RESULTADO_FINAL' ? 'RESULTADO_FINAL' : 'RESULTADO_PRELIMINAR'
  await prisma.edital.update({
    where: { id: editalId },
    data: {
      status: editalStatus,
      // Ato explícito que libera nota/parecer pro proponente — ver
      // resultadoPreliminarPublicadoEm/resultadoFinalPublicadoEm no schema.
      ...(fase === 'RESULTADO_FINAL'
        ? { resultadoFinalPublicadoEm: new Date() }
        : { resultadoPreliminarPublicadoEm: new Date() }),
    },
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
          url: `${baseUrl}${hrefResultados(edital.slug, fase === 'RESULTADO_FINAL')}`,
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

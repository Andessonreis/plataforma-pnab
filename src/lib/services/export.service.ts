import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { formatTelefoneBR } from '@/lib/utils/format'

export async function exportInscricoesCsv(editalId: string, userId: string, ip?: string) {
  const inscricoes = await prisma.inscricao.findMany({
    where: editalId ? { editalId } : {},
    include: {
      edital: { select: { titulo: true } },
      proponente: { select: { nome: true, cpfCnpj: true, email: true, telefone: true } },
      _count: { select: { avaliacoes: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Gera CSV
  const header = 'Número,Edital,Proponente,CPF/CNPJ,Email,Telefone,Categoria,Status,Nota Final,Avaliações,Data Envio\n'
  const rows = inscricoes.map((i) => {
    return [
      i.numero,
      `"${i.edital.titulo}"`,
      `"${i.proponente.nome}"`,
      i.proponente.cpfCnpj ?? '',
      i.proponente.email,
      formatTelefoneBR(i.proponente.telefone ?? ''),
      i.categoria ?? '',
      i.status,
      i.notaFinal ? Number(i.notaFinal) : '',
      i._count.avaliacoes,
      i.submittedAt ? i.submittedAt.toISOString() : '',
    ].join(',')
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.EXPORTACAO_CSV,
    entity: 'Inscricao',
    details: { editalId, total: inscricoes.length },
    ip,
  })

  return header + rows.join('\n')
}

export async function importContemplados(
  editalId: string,
  contemplados: Array<{ inscricaoId: string; valorAprovado: number }>,
  userId: string,
  ip?: string,
) {
  const edital = await prisma.edital.findUnique({ where: { id: editalId }, select: { id: true } })
  if (!edital) throw new Error('Edital não encontrado.')

  const updates = contemplados.map((c) =>
    prisma.projetoApoiado.upsert({
      where: { inscricaoId: c.inscricaoId },
      update: { valorAprovado: c.valorAprovado },
      create: {
        inscricaoId: c.inscricaoId,
        valorAprovado: c.valorAprovado,
        statusExecucao: 'EM_EXECUCAO',
        publicado: false,
      },
    }),
  )

  await prisma.$transaction(updates)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.IMPORTACAO_CONTEMPLADOS,
    entity: 'Edital',
    entityId: editalId,
    details: { total: contemplados.length },
    ip,
  })

  return { imported: contemplados.length }
}

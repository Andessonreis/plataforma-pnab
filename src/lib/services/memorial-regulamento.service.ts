import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

/** Versão em vigor: a de número mais alto que já começou a valer. */
export async function obterRegulamentoVigente() {
  return prisma.memorialRegulamento.findFirst({
    where: { vigenteDesde: { lte: new Date() } },
    orderBy: { versao: 'desc' },
    select: { versao: true, texto: true, vigenteDesde: true },
  })
}

export async function listarVersoesRegulamento() {
  return prisma.memorialRegulamento.findMany({
    orderBy: { versao: 'desc' },
    take: 20,
    select: { versao: true, vigenteDesde: true },
  })
}

/**
 * Publica o texto como versão nova. Versões antigas nunca são editadas: cada visita
 * guarda o número da versão que a pessoa aceitou.
 */
export async function publicarNovoRegulamento(texto: string, userId: string, ip?: string) {
  const regulamento = await prisma.$transaction(async (tx) => {
    const ultima = await tx.memorialRegulamento.findFirst({ orderBy: { versao: 'desc' }, select: { versao: true } })
    return tx.memorialRegulamento.create({
      data: { versao: (ultima?.versao ?? 0) + 1, texto, criadoPorId: userId },
      select: { versao: true, texto: true, vigenteDesde: true },
    })
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.MEMORIAL_CONFIG_ATUALIZADA,
    entity: 'MemorialRegulamento',
    entityId: String(regulamento.versao),
    details: { versao: regulamento.versao },
    ip,
  })

  return regulamento
}

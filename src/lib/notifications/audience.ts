import { prisma } from '@/lib/db'
import type { AudienceFilter } from './types'

/**
 * Resolve um filtro de audiência em uma lista de userIds únicos.
 *
 * Semântica:
 * - Cada filtro presente CONSTRÓI o conjunto inicial (UNION entre fontes diretas).
 * - userIds/emails são UNION com o resultado dos demais filtros.
 * - Filtro vazio retorna [] (segurança: nunca disparar pra "todos" sem opt-in).
 *
 * Resultado é deduplicado (Set).
 */
export async function resolveAudience(filtro: AudienceFilter): Promise<string[]> {
  const ids = new Set<string>()

  // ── Filtros baseados em inscrição ──────────────────────────────────────
  if (filtro.editais && filtro.editais.length > 0) {
    const inscricoes = await prisma.inscricao.findMany({
      where: {
        editalId: { in: filtro.editais },
        ...(filtro.inscricaoStatus && filtro.inscricaoStatus.length > 0
          ? { status: { in: filtro.inscricaoStatus } }
          : {}),
      },
      select: { proponenteId: true },
      distinct: ['proponenteId'],
    })
    for (const i of inscricoes) ids.add(i.proponenteId)
  }

  // ── Filtros baseados no User ───────────────────────────────────────────
  if (filtro.tipoProponente && filtro.tipoProponente.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        tipoProponente: { in: filtro.tipoProponente },
        ativo: true,
      },
      select: { id: true },
    })
    for (const u of users) ids.add(u.id)
  }

  // ── Sem inscrição ──────────────────────────────────────────────────────
  if (filtro.semInscricao === true) {
    const users = await prisma.user.findMany({
      where: {
        ativo: true,
        role: 'PROPONENTE',
        inscricoes: { none: {} },
      },
      select: { id: true },
    })
    for (const u of users) ids.add(u.id)
  }

  if (filtro.semInscricaoNoEdital) {
    const users = await prisma.user.findMany({
      where: {
        ativo: true,
        role: 'PROPONENTE',
        inscricoes: { none: { editalId: filtro.semInscricaoNoEdital } },
      },
      select: { id: true },
    })
    for (const u of users) ids.add(u.id)
  }

  // ── Adições manuais (UNION) ────────────────────────────────────────────
  if (filtro.userIds && filtro.userIds.length > 0) {
    // Filtra só IDs válidos pra não persistir lixo
    const validUsers = await prisma.user.findMany({
      where: { id: { in: filtro.userIds }, ativo: true },
      select: { id: true },
    })
    for (const u of validUsers) ids.add(u.id)
  }

  if (filtro.emails && filtro.emails.length > 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: filtro.emails }, ativo: true },
      select: { id: true },
    })
    for (const u of users) ids.add(u.id)
  }

  return Array.from(ids)
}

/**
 * Conta a audiência sem materializar a lista (mais leve pra preview UI).
 * Aqui resolvemos completamente porque os filtros são heterogêneos e a
 * união de IDs é necessária pra deduplicar — mas devolvemos só o tamanho.
 */
export async function countAudience(filtro: AudienceFilter): Promise<number> {
  const ids = await resolveAudience(filtro)
  return ids.length
}

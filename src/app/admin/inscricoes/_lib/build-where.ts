import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { categoriaWhere } from '@/lib/inscricoes/area-filter'
import type { UserRole } from '@prisma/client'

interface FiltrosAtivos {
  statusFilter?: string
  editalIdFilter?: string
  areaFilter?: string
  searchQuery?: string
}

/**
 * Monta o `where` do Prisma pra `/admin/inscricoes`, escopado pelo papel de
 * quem está logado. Mantém a mesma regra de negócio que já existia antes do
 * redesign — só saiu do componente de página pra não competir com o JSX pela
 * atenção de quem lê.
 */
export async function buildInscricoesWhere(
  userId: string,
  role: UserRole,
  { statusFilter, editalIdFilter, areaFilter, searchQuery }: FiltrosAtivos,
): Promise<Record<string, unknown>> {
  const isAvaliador = role === 'AVALIADOR'
  const isHabilitador = role === 'HABILITADOR'

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter
  if (editalIdFilter) where.editalId = editalIdFilter
  if (isHabilitador) {
    // Rascunho não foi enviado — não há o que habilitar nele. Bloqueado mesmo
    // que o filtro de status peça RASCUNHO explicitamente pela URL.
    where.status = statusFilter === 'RASCUNHO' ? { in: [] } : statusFilter || { not: 'RASCUNHO' }
  }
  const recorteArea = categoriaWhere(areaFilter)
  if (recorteArea !== undefined) where.categoria = recorteArea
  if (searchQuery) {
    where.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
      { proponente: { cpfCnpj: { contains: searchQuery } } },
    ]
  }

  // AVALIADOR vê inscrições de editais onde é membro da equipe (função AVALIADOR),
  // em fases de avaliação em diante. Se o edital não tem equipe, todos veem (compat).
  if (isAvaliador) {
    const visiveis = await getEditaisVisiveis(userId, 'AVALIADOR')
    where.status = { notIn: ['RASCUNHO', 'INABILITADA'] }
    where.edital = {
      status: { in: ['AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO'] },
    }
    if (visiveis) {
      if (editalIdFilter && !visiveis.includes(editalIdFilter)) {
        where.editalId = { in: [] }
      } else if (!editalIdFilter) {
        where.editalId = { in: visiveis }
      }
    }
  }

  // HABILITADOR só vê inscrições de editais atribuídos (ou todos, se sem equipe)
  if (isHabilitador) {
    // Edital já concluído não tem triagem pendente — não há motivo pra
    // aparecer na lista de trabalho do Habilitador.
    where.edital = { status: { notIn: ['ENCERRADO', 'RESULTADO_FINAL'] } }
    const visiveis = await getEditaisVisiveis(userId, 'HABILITADOR')
    if (visiveis) {
      if (editalIdFilter && !visiveis.includes(editalIdFilter)) {
        // Se filtrou um edital ao qual não tem acesso, zera
        where.editalId = { in: [] }
      } else if (!editalIdFilter) {
        where.editalId = { in: visiveis }
      }
    }
  }

  return where
}

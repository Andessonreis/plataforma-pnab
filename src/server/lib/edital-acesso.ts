import { prisma } from '@server/lib/db'

/**
 * Verifica se o usuário tem acesso a um edital específico.
 *
 * AVALIADOR: acesso somente quando explicitamente adicionado à equipe
 * (sem compat — admin sempre define quem avalia na Seção 9 do edital).
 * HABILITADOR: se o edital NÃO tem equipe configurada → liberado (backwards compat);
 * se tem equipe → só membros atribuídos.
 */
export async function temAcessoEdital(
  userId: string,
  editalId: string,
  funcao: 'AVALIADOR' | 'HABILITADOR',
): Promise<boolean> {
  // AVALIADOR: sem compat. Sempre precisa estar explicitamente na equipe.
  if (funcao === 'AVALIADOR') {
    const membro = await prisma.editalMembro.findUnique({
      where: { editalId_userId_funcao: { editalId, userId, funcao } },
      select: { id: true },
    })
    return !!membro
  }

  // HABILITADOR: com compat. Conta membros com essa função nesse edital
  const totalMembros = await prisma.editalMembro.count({
    where: { editalId, funcao },
  })

  // Edital sem equipe dessa função → todos com o role acessam
  if (totalMembros === 0) return true

  // Edital com equipe → verifica se o user está atribuído
  const membro = await prisma.editalMembro.findUnique({
    where: { editalId_userId_funcao: { editalId, userId, funcao } },
    select: { id: true },
  })

  return !!membro
}

/**
 * Retorna IDs de editais visíveis para o usuário com determinada função.
 *
 * AVALIADOR: somente editais onde o user foi explicitamente adicionado
 * na equipe (sem compat). Retorna sempre array.
 *
 * HABILITADOR (compat):
 * - Editais sem equipe configurada → visíveis para todos com o role.
 * - Editais com equipe → só para atribuídos.
 * - Retorna null se não há nenhum edital com equipe.
 */
export async function getEditaisVisiveis(
  userId: string,
  funcao: 'AVALIADOR' | 'HABILITADOR',
): Promise<string[] | null> {
  // AVALIADOR: sem compat. Retorna só os editais onde está na equipe (pode ser []).
  if (funcao === 'AVALIADOR') {
    const meus = await prisma.editalMembro.findMany({
      where: { userId, funcao },
      select: { editalId: true },
    })
    return meus.map((e) => e.editalId)
  }

  // HABILITADOR: compat — editais que TÊM pelo menos um membro com essa função
  const editaisComEquipe = await prisma.editalMembro.groupBy({
    by: ['editalId'],
    where: { funcao },
  })

  // Se nenhum edital tem equipe configurada → todos visíveis
  if (editaisComEquipe.length === 0) return null

  const editaisComEquipeIds = editaisComEquipe.map((e) => e.editalId)

  // Editais onde esse user foi atribuído com essa função
  const meusEditais = await prisma.editalMembro.findMany({
    where: { userId, funcao },
    select: { editalId: true },
  })
  const meusEditaisIds = meusEditais.map((e) => e.editalId)

  // Editais SEM equipe (todos acessam) + editais COM equipe onde o user está
  const todosEditaisIds = await prisma.edital.findMany({
    select: { id: true },
  })

  const editaisComEquipeSet = new Set(editaisComEquipeIds)
  const meusEditaisSet = new Set(meusEditaisIds)

  const visiveis = todosEditaisIds
    .map((e) => e.id)
    .filter((id) => !editaisComEquipeSet.has(id) || meusEditaisSet.has(id))

  return visiveis
}

import { prisma } from '@/lib/db'

/**
 * Verifica se o usuário tem acesso a um edital específico.
 *
 * Se o edital NÃO tem equipe configurada para aquela função → acesso liberado (backwards compat).
 * Se tem equipe → só membros atribuídos.
 */
export async function temAcessoEdital(
  userId: string,
  editalId: string,
  funcao: 'AVALIADOR' | 'HABILITADOR',
): Promise<boolean> {
  // Conta membros com essa função nesse edital
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
 * - Editais sem equipe configurada para a função → visíveis para todos com aquele role.
 * - Editais com equipe → só para atribuídos.
 *
 * Retorna null se não há nenhum edital com equipe configurada (ou seja, todos são visíveis).
 * Retorna array de IDs se precisa filtrar.
 */
export async function getEditaisVisiveis(
  userId: string,
  funcao: 'AVALIADOR' | 'HABILITADOR',
): Promise<string[] | null> {
  // Editais que TÊM pelo menos um membro com essa função
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

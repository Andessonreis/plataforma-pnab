'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { temAcessoEdital } from '@/lib/edital-acesso'
import { retificacaoVigente, retificacoesOrdenadas } from '@/lib/utils/retificacao'
import type { Retificacao } from '@/types/retificacao'

export interface EditalInfoAvaliador {
  titulo: string
  ano: number
  slug: string
  resumo: string | null
  categorias: string[]
  retificacaoVigente: Retificacao | null
  retificacoesAnteriores: Retificacao[]
}

/**
 * Dados do edital pro modal "Ver edital" na área do avaliador — evita ele ter
 * que abrir a página pública numa aba nova só pra conferir se saiu retificação.
 * Mesmo escopo de acesso da fila de avaliação (`temAcessoEdital`).
 */
export async function getEditalInfoParaAvaliador(editalId: string): Promise<EditalInfoAvaliador | null> {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') return null

  const temAcesso = await temAcessoEdital(session.user.id, editalId, 'AVALIADOR')
  if (!temAcesso) return null

  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { titulo: true, ano: true, slug: true, resumo: true, categorias: true, retificacoes: true },
  })
  if (!edital) return null

  const todas = retificacoesOrdenadas(edital.retificacoes)
  const vigente = retificacaoVigente(edital.retificacoes)

  return {
    titulo: edital.titulo,
    ano: edital.ano,
    slug: edital.slug,
    resumo: edital.resumo,
    categorias: edital.categorias,
    retificacaoVigente: vigente,
    retificacoesAnteriores: vigente ? todas.filter((r) => r.numero !== vigente.numero) : [],
  }
}

import type { StatusConteudo } from '@prisma/client'
import { prisma } from '@/lib/db'

type ContagemPorStatus = Partial<Record<StatusConteudo, number>>

function porStatus(grupos: { status: StatusConteudo; _count: { _all: number } }[]): ContagemPorStatus {
  return Object.fromEntries(grupos.map((g) => [g.status, g._count._all]))
}

/** Números do painel inicial: quanto existe de cada conteúdo e em que etapa está. */
export async function contarConteudo() {
  const [exposicoes, acervo, pessoas, eventos, albuns, fotosSemAutorizacao] = await Promise.all([
    prisma.memorialExposicao.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.memorialAcervoItem.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.memorialPessoa.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.memorialEvento.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.memorialAlbum.count(),
    prisma.memorialAcervoItem.count({ where: { tipo: 'FOTOGRAFIA', autorizado: false } }),
  ])
  return {
    exposicoes: porStatus(exposicoes),
    acervo: porStatus(acervo),
    pessoas: porStatus(pessoas),
    eventos: porStatus(eventos),
    albuns,
    fotosSemAutorizacao,
  }
}

const LIMITE_OPCOES = 300

/** Listas curtas (id + nome) para os seletores de vínculo dos formulários. */
export async function opcoesDeVinculo() {
  const [exposicoes, itens, pessoas, eventos, albuns] = await Promise.all([
    prisma.memorialExposicao.findMany({ select: { id: true, titulo: true }, orderBy: { titulo: 'asc' }, take: LIMITE_OPCOES }),
    prisma.memorialAcervoItem.findMany({ select: { id: true, titulo: true }, orderBy: { titulo: 'asc' }, take: LIMITE_OPCOES }),
    prisma.memorialPessoa.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' }, take: LIMITE_OPCOES }),
    prisma.memorialEvento.findMany({ select: { id: true, titulo: true }, orderBy: { titulo: 'asc' }, take: LIMITE_OPCOES }),
    prisma.memorialAlbum.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' }, take: LIMITE_OPCOES }),
  ])
  const opcao = (id: string, rotulo: string) => ({ id, rotulo })
  return {
    exposicoes: exposicoes.map((e) => opcao(e.id, e.titulo)),
    itens: itens.map((i) => opcao(i.id, i.titulo)),
    pessoas: pessoas.map((p) => opcao(p.id, p.nome)),
    eventos: eventos.map((e) => opcao(e.id, e.titulo)),
    albuns: albuns.map((a) => opcao(a.id, a.nome)),
  }
}

export type OpcoesDeVinculo = Awaited<ReturnType<typeof opcoesDeVinculo>>

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { pendenciasEvento } from '@/lib/memorial/publicacao'
import type { EventoInput } from '@/lib/schemas/memorial-evento'
import type { ListagemAdmin } from '@/lib/schemas/memorial-comum'
import type { PaginationInput } from '@/lib/schemas/pagination'
import { conectar, exigirEncontrado, paginar, substituir } from './memorial-conteudo.service'
import { crudConteudo } from './memorial-crud.service'

const VINCULOS = {
  itens: { select: { id: true, titulo: true } },
  pessoas: { select: { id: true, nome: true } },
  exposicoes: { select: { id: true, titulo: true } },
} satisfies Prisma.MemorialEventoInclude

function dados(i: EventoInput) {
  return { titulo: i.titulo, descricao: i.descricao, periodo: i.periodo, ano: i.ano, fontes: i.fontes }
}

export const { obter, criar, atualizar, excluir, mudarStatus } = crudConteudo({
  entidade: 'MemorialEvento',
  naoEncontrado: 'Evento não encontrado.',
  nomeDaEntrada: (i: EventoInput) => i.titulo,
  nomeDoRegistro: (r) => r.titulo,
  pendencias: pendenciasEvento,
  buscar: (id: string) => prisma.memorialEvento.findUnique({ where: { id } }),
  detalhar: (id: string) => prisma.memorialEvento.findUnique({ where: { id }, include: VINCULOS }),
  contarSlug: (where) => prisma.memorialEvento.count({ where }),
  inserir: (i, slug) =>
    prisma.memorialEvento.create({
      data: {
        ...dados(i),
        slug,
        itens: conectar(i.itemIds),
        pessoas: conectar(i.pessoaIds),
        exposicoes: conectar(i.exposicaoIds),
      },
      include: VINCULOS,
    }),
  alterar: (id, i, slug) =>
    prisma.memorialEvento.update({
      where: { id },
      data: {
        ...dados(i),
        slug,
        itens: substituir(i.itemIds),
        pessoas: substituir(i.pessoaIds),
        exposicoes: substituir(i.exposicaoIds),
      },
      include: VINCULOS,
    }),
  apagar: (id) => prisma.memorialEvento.delete({ where: { id } }),
  salvarStatus: (id, status) => prisma.memorialEvento.update({ where: { id }, data: { status } }),
})

export async function listarAdmin(f: ListagemAdmin) {
  const where: Prisma.MemorialEventoWhereInput = {
    status: f.status,
    ...(f.q && {
      OR: [
        { titulo: { contains: f.q, mode: 'insensitive' } },
        { descricao: { contains: f.q, mode: 'insensitive' } },
        { periodo: { contains: f.q, mode: 'insensitive' } },
      ],
    }),
  }
  const [itens, total] = await Promise.all([
    prisma.memorialEvento.findMany({ where, orderBy: [{ ano: 'asc' }, { titulo: 'asc' }], ...paginar(f) }),
    prisma.memorialEvento.count({ where }),
  ])
  return { itens, total }
}

const PUBLICADO = { status: 'PUBLICADO' } as const

/** Linha do tempo: eventos publicados em ordem cronológica, com uma foto de apoio. */
export async function linhaDoTempo(p: PaginationInput) {
  const [itens, total] = await Promise.all([
    prisma.memorialEvento.findMany({
      where: PUBLICADO,
      orderBy: [{ ano: 'asc' }, { titulo: 'asc' }],
      include: { itens: { where: { ...PUBLICADO, tipo: 'FOTOGRAFIA' }, take: 1 } },
      ...paginar(p),
    }),
    prisma.memorialEvento.count({ where: PUBLICADO }),
  ])
  return { itens, total }
}

export async function obterPublico(slug: string) {
  const r = await prisma.memorialEvento.findFirst({
    where: { slug, ...PUBLICADO },
    include: {
      itens: { where: PUBLICADO, orderBy: { createdAt: 'asc' } },
      pessoas: { where: PUBLICADO, orderBy: { nome: 'asc' } },
      exposicoes: { where: PUBLICADO, orderBy: { ordem: 'asc' } },
    },
  })
  return exigirEncontrado(r, 'Evento não encontrado.')
}

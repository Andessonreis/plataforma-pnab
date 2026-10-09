import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { pendenciasExposicao } from '@/lib/memorial/publicacao'
import type { ExposicaoInput } from '@/lib/schemas/memorial-exposicao'
import type { ListagemAdmin } from '@/lib/schemas/memorial-comum'
import type { PaginationInput } from '@/lib/schemas/pagination'
import { conectar, exigirEncontrado, paginar, substituir } from './memorial-conteudo.service'
import { crudConteudo } from './memorial-crud.service'

const VINCULOS = {
  itens: { select: { id: true, titulo: true } },
  pessoas: { select: { id: true, nome: true } },
  eventos: { select: { id: true, titulo: true } },
} satisfies Prisma.MemorialExposicaoInclude

function dados(i: ExposicaoInput) {
  return {
    titulo: i.titulo,
    subtitulo: i.subtitulo,
    descricao: i.descricao,
    periodo: i.periodo,
    localizacao: i.localizacao,
    capaUrl: i.capaUrl,
    dataInicio: i.dataInicio,
    dataFim: i.dataFim,
    destaque: i.destaque,
    ordem: i.ordem,
  }
}

export const { obter, criar, atualizar, excluir, mudarStatus } = crudConteudo({
  entidade: 'MemorialExposicao',
  naoEncontrado: 'Exposição não encontrada.',
  nomeDaEntrada: (i: ExposicaoInput) => i.titulo,
  nomeDoRegistro: (r) => r.titulo,
  pendencias: pendenciasExposicao,
  buscar: (id: string) => prisma.memorialExposicao.findUnique({ where: { id } }),
  detalhar: (id: string) => prisma.memorialExposicao.findUnique({ where: { id }, include: VINCULOS }),
  contarSlug: (where) => prisma.memorialExposicao.count({ where }),
  inserir: (i, slug) =>
    prisma.memorialExposicao.create({
      data: {
        ...dados(i),
        slug,
        itens: conectar(i.itemIds),
        pessoas: conectar(i.pessoaIds),
        eventos: conectar(i.eventoIds),
      },
      include: VINCULOS,
    }),
  alterar: (id, i, slug) =>
    prisma.memorialExposicao.update({
      where: { id },
      data: {
        ...dados(i),
        slug,
        itens: substituir(i.itemIds),
        pessoas: substituir(i.pessoaIds),
        eventos: substituir(i.eventoIds),
      },
      include: VINCULOS,
    }),
  apagar: (id) => prisma.memorialExposicao.delete({ where: { id } }),
  salvarStatus: (id, status) => prisma.memorialExposicao.update({ where: { id }, data: { status } }),
})

export async function listarAdmin(f: ListagemAdmin) {
  const where: Prisma.MemorialExposicaoWhereInput = {
    status: f.status,
    ...(f.q && {
      OR: [
        { titulo: { contains: f.q, mode: 'insensitive' } },
        { subtitulo: { contains: f.q, mode: 'insensitive' } },
        { descricao: { contains: f.q, mode: 'insensitive' } },
      ],
    }),
  }
  const [itens, total] = await Promise.all([
    prisma.memorialExposicao.findMany({ where, orderBy: [{ ordem: 'asc' }, { updatedAt: 'desc' }], ...paginar(f) }),
    prisma.memorialExposicao.count({ where }),
  ])
  return { itens, total }
}

// ── Público: só o que está PUBLICADO, inclusive nos vínculos ────────────────

const PUBLICADO = { status: 'PUBLICADO' } as const

export async function listarPublicas(p: PaginationInput) {
  const [itens, total] = await Promise.all([
    prisma.memorialExposicao.findMany({
      where: PUBLICADO,
      orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }, { dataInicio: 'desc' }],
      ...paginar(p),
    }),
    prisma.memorialExposicao.count({ where: PUBLICADO }),
  ])
  return { itens, total }
}

export async function obterPublica(slug: string) {
  const r = await prisma.memorialExposicao.findFirst({
    where: { slug, ...PUBLICADO },
    include: {
      itens: { where: PUBLICADO, orderBy: [{ decada: 'asc' }, { createdAt: 'asc' }] },
      pessoas: { where: PUBLICADO, orderBy: { nome: 'asc' } },
      eventos: { where: PUBLICADO, orderBy: { ano: 'asc' } },
    },
  })
  return exigirEncontrado(r, 'Exposição não encontrada.')
}

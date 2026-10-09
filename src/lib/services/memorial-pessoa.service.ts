import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { pendenciasPessoa } from '@/lib/memorial/publicacao'
import type { PessoaInput } from '@/lib/schemas/memorial-pessoa'
import type { ListagemAdmin } from '@/lib/schemas/memorial-comum'
import type { PaginationInput } from '@/lib/schemas/pagination'
import { conectar, exigirEncontrado, paginar, substituir } from './memorial-conteudo.service'
import { crudConteudo } from './memorial-crud.service'

const VINCULOS = {
  itens: { select: { id: true, titulo: true } },
  eventos: { select: { id: true, titulo: true } },
  exposicoes: { select: { id: true, titulo: true } },
} satisfies Prisma.MemorialPessoaInclude

function dados(i: PessoaInput) {
  return { nome: i.nome, biografia: i.biografia, fotoUrl: i.fotoUrl, periodo: i.periodo, fontes: i.fontes }
}

export const { obter, criar, atualizar, excluir, mudarStatus } = crudConteudo({
  entidade: 'MemorialPessoa',
  naoEncontrado: 'Pessoa não encontrada.',
  nomeDaEntrada: (i: PessoaInput) => i.nome,
  nomeDoRegistro: (r) => r.nome,
  pendencias: pendenciasPessoa,
  buscar: (id: string) => prisma.memorialPessoa.findUnique({ where: { id } }),
  detalhar: (id: string) => prisma.memorialPessoa.findUnique({ where: { id }, include: VINCULOS }),
  contarSlug: (where) => prisma.memorialPessoa.count({ where }),
  inserir: (i, slug) =>
    prisma.memorialPessoa.create({
      data: {
        ...dados(i),
        slug,
        itens: conectar(i.itemIds),
        eventos: conectar(i.eventoIds),
        exposicoes: conectar(i.exposicaoIds),
      },
      include: VINCULOS,
    }),
  alterar: (id, i, slug) =>
    prisma.memorialPessoa.update({
      where: { id },
      data: {
        ...dados(i),
        slug,
        itens: substituir(i.itemIds),
        eventos: substituir(i.eventoIds),
        exposicoes: substituir(i.exposicaoIds),
      },
      include: VINCULOS,
    }),
  apagar: (id) => prisma.memorialPessoa.delete({ where: { id } }),
  salvarStatus: (id, status) => prisma.memorialPessoa.update({ where: { id }, data: { status } }),
})

export async function listarAdmin(f: ListagemAdmin) {
  const where: Prisma.MemorialPessoaWhereInput = {
    status: f.status,
    ...(f.q && {
      OR: [
        { nome: { contains: f.q, mode: 'insensitive' } },
        { biografia: { contains: f.q, mode: 'insensitive' } },
      ],
    }),
  }
  const [itens, total] = await Promise.all([
    prisma.memorialPessoa.findMany({ where, orderBy: { nome: 'asc' }, ...paginar(f) }),
    prisma.memorialPessoa.count({ where }),
  ])
  return { itens, total }
}

const PUBLICADO = { status: 'PUBLICADO' } as const

export async function listarPublicas(p: PaginationInput) {
  const [itens, total] = await Promise.all([
    prisma.memorialPessoa.findMany({ where: PUBLICADO, orderBy: { nome: 'asc' }, ...paginar(p) }),
    prisma.memorialPessoa.count({ where: PUBLICADO }),
  ])
  return { itens, total }
}

export async function obterPublica(slug: string) {
  const r = await prisma.memorialPessoa.findFirst({
    where: { slug, ...PUBLICADO },
    include: {
      itens: { where: PUBLICADO, orderBy: [{ decada: 'asc' }, { createdAt: 'asc' }] },
      eventos: { where: PUBLICADO, orderBy: { ano: 'asc' } },
      exposicoes: { where: PUBLICADO, orderBy: { ordem: 'asc' } },
    },
  })
  return exigirEncontrado(r, 'Pessoa não encontrada.')
}

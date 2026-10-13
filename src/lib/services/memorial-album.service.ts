import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { AlbumInput } from '@/lib/schemas/memorial-album'
import type { ListagemAdmin } from '@/lib/schemas/memorial-comum'
import type { PaginationInput } from '@/lib/schemas/pagination'
import {
  type Autor,
  comConflito,
  definirSlug,
  exigirEncontrado,
  paginar,
  registrarAlteracao,
  verificadorDeSlug,
} from './memorial-conteudo.service'

/*
 * Álbum é só organização (Inauguração, São João, Re-Tratos do Tempo...): não tem
 * ciclo de publicação próprio. O que aparece ao público são as fotos publicadas dele.
 */

const ENTIDADE = 'MemorialAlbum'
const NAO_ENCONTRADO = 'Álbum não encontrado.'

const slugEmUso = (ignorarId?: string) =>
  verificadorDeSlug((where) => prisma.memorialAlbum.count({ where }), ignorarId)

export async function listarAdmin(f: ListagemAdmin) {
  const where: Prisma.MemorialAlbumWhereInput = f.q
    ? { nome: { contains: f.q, mode: 'insensitive' } }
    : {}
  const [itens, total] = await Promise.all([
    prisma.memorialAlbum.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { itens: true } } },
      ...paginar(f),
    }),
    prisma.memorialAlbum.count({ where }),
  ])
  return { itens, total }
}

export async function obter(id: string) {
  return exigirEncontrado(await prisma.memorialAlbum.findUnique({ where: { id } }), NAO_ENCONTRADO)
}

export async function criar(i: AlbumInput, autor: Autor) {
  const slug = await definirSlug(i.slug, i.nome, slugEmUso())
  const r = await comConflito(() =>
    prisma.memorialAlbum.create({ data: { nome: i.nome, descricao: i.descricao, ordem: i.ordem, slug } }),
  )
  await registrarAlteracao({ acao: 'MEMORIAL_CONTEUDO_CRIADO', entidade: ENTIDADE, id: r.id, rotulo: r.nome, autor })
  return r
}

export async function atualizar(id: string, i: AlbumInput, autor: Autor) {
  const atual = await obter(id)
  const slug = i.slug && i.slug !== atual.slug ? await definirSlug(i.slug, i.nome, slugEmUso(id)) : atual.slug
  const r = await comConflito(() =>
    prisma.memorialAlbum.update({
      where: { id },
      data: { nome: i.nome, descricao: i.descricao, ordem: i.ordem, slug },
    }),
  )
  await registrarAlteracao({ acao: 'MEMORIAL_CONTEUDO_ATUALIZADO', entidade: ENTIDADE, id, rotulo: r.nome, autor })
  return r
}

/** As fotos do álbum continuam no acervo, só ficam sem álbum (onDelete: SetNull). */
export async function excluir(id: string, autor: Autor) {
  const atual = await obter(id)
  await prisma.memorialAlbum.delete({ where: { id } })
  await registrarAlteracao({ acao: 'MEMORIAL_CONTEUDO_EXCLUIDO', entidade: ENTIDADE, id, rotulo: atual.nome, autor })
}

/** Álbuns com ao menos uma fotografia publicada, com a quantidade e uma foto de capa. */
export async function listarPublicos(p: PaginationInput) {
  const comFotos = { itens: { some: { status: 'PUBLICADO', tipo: 'FOTOGRAFIA' } } } as const
  const [itens, total] = await Promise.all([
    prisma.memorialAlbum.findMany({
      where: comFotos,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      select: {
        nome: true,
        slug: true,
        descricao: true,
        _count: { select: { itens: { where: { status: 'PUBLICADO' } } } },
      },
      ...paginar(p),
    }),
    prisma.memorialAlbum.count({ where: comFotos }),
  ])
  return { itens, total }
}

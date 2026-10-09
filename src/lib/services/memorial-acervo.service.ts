import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { pendenciasItem } from '@/lib/memorial/publicacao'
import type {
  AcervoItemInput,
  AcervoLoteInput,
  ListagemAcervoAdmin,
  ListagemAcervoPublico,
} from '@/lib/schemas/memorial-acervo'
import { type Autor, conectar, exigirEncontrado, paginar, registrarAlteracao, substituir } from './memorial-conteudo.service'
import { crudConteudo } from './memorial-crud.service'

const VINCULOS = {
  album: { select: { id: true, nome: true } },
  exposicoes: { select: { id: true, titulo: true } },
  pessoas: { select: { id: true, nome: true } },
  eventos: { select: { id: true, titulo: true } },
} satisfies Prisma.MemorialAcervoItemInclude

function dados(i: AcervoItemInput) {
  return {
    tipo: i.tipo,
    titulo: i.titulo,
    legenda: i.legenda,
    descricao: i.descricao,
    contextoHistorico: i.contextoHistorico,
    dataAproximada: i.dataAproximada,
    decada: i.decada,
    local: i.local,
    autor: i.autor,
    fotografo: i.fotografo,
    fonte: i.fonte,
    credito: i.credito,
    direitosUso: i.direitosUso,
    autorizado: i.autorizado,
    arquivoUrl: i.arquivoUrl,
    versaoWebUrl: i.versaoWebUrl,
    fotoAtualUrl: i.fotoAtualUrl,
    tags: i.tags,
  }
}

export const { obter, criar, atualizar, excluir, mudarStatus } = crudConteudo({
  entidade: 'MemorialAcervoItem',
  naoEncontrado: 'Item do acervo não encontrado.',
  nomeDaEntrada: (i: AcervoItemInput) => i.titulo,
  nomeDoRegistro: (r) => r.titulo,
  pendencias: pendenciasItem,
  buscar: (id: string) => prisma.memorialAcervoItem.findUnique({ where: { id } }),
  detalhar: (id: string) => prisma.memorialAcervoItem.findUnique({ where: { id }, include: VINCULOS }),
  inserir: (i) =>
    prisma.memorialAcervoItem.create({
      data: {
        ...dados(i),
        album: i.albumId ? { connect: { id: i.albumId } } : undefined,
        exposicoes: conectar(i.exposicaoIds),
        pessoas: conectar(i.pessoaIds),
        eventos: conectar(i.eventoIds),
      },
      include: VINCULOS,
    }),
  alterar: (id, i) =>
    prisma.memorialAcervoItem.update({
      where: { id },
      data: {
        ...dados(i),
        album: i.albumId ? { connect: { id: i.albumId } } : { disconnect: true },
        exposicoes: substituir(i.exposicaoIds),
        pessoas: substituir(i.pessoaIds),
        eventos: substituir(i.eventoIds),
      },
      include: VINCULOS,
    }),
  apagar: (id) => prisma.memorialAcervoItem.delete({ where: { id } }),
  salvarStatus: (id, status) => prisma.memorialAcervoItem.update({ where: { id }, data: { status } }),
})

/** Fotos enviadas em lote entram como rascunho, com os dados comuns já preenchidos. */
export async function criarLote(l: AcervoLoteInput, autor: Autor) {
  const criados = await prisma.$transaction(
    l.arquivos.map((a) =>
      prisma.memorialAcervoItem.create({
        data: {
          tipo: 'FOTOGRAFIA',
          titulo: a.titulo,
          arquivoUrl: a.arquivoUrl,
          albumId: l.albumId,
          decada: l.decada,
          fotografo: l.fotografo,
          credito: l.credito,
          direitosUso: l.direitosUso,
          autorizado: l.autorizado,
        },
      }),
    ),
  )
  for (const r of criados) {
    await registrarAlteracao({
      acao: 'MEMORIAL_CONTEUDO_CRIADO',
      entidade: 'MemorialAcervoItem',
      id: r.id,
      rotulo: r.titulo,
      autor,
      estado: r,
      detalhes: { lote: criados.length },
    })
  }
  return criados
}

export async function listarAdmin(f: ListagemAcervoAdmin) {
  const where: Prisma.MemorialAcervoItemWhereInput = {
    status: f.status,
    tipo: f.tipo,
    albumId: f.albumId,
    decada: f.decada,
    ...(f.q && {
      OR: [
        { titulo: { contains: f.q, mode: 'insensitive' } },
        { legenda: { contains: f.q, mode: 'insensitive' } },
        { descricao: { contains: f.q, mode: 'insensitive' } },
        { tags: { has: f.q.toLowerCase() } },
      ],
    }),
  }
  const [itens, total] = await Promise.all([
    prisma.memorialAcervoItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { album: { select: { nome: true } } },
      ...paginar(f),
    }),
    prisma.memorialAcervoItem.count({ where }),
  ])
  return { itens, total }
}

// ── Público ────────────────────────────────────────────────────────────────

const PUBLICADO = { status: 'PUBLICADO' } as const

export async function listarPublicos(f: ListagemAcervoPublico) {
  const where: Prisma.MemorialAcervoItemWhereInput = {
    ...PUBLICADO,
    tipo: f.tipo,
    decada: f.decada,
    album: f.album ? { slug: f.album } : undefined,
  }
  const [itens, total] = await Promise.all([
    prisma.memorialAcervoItem.findMany({
      where,
      orderBy: [{ decada: 'asc' }, { createdAt: 'asc' }],
      include: { album: { select: { nome: true, slug: true } } },
      ...paginar(f),
    }),
    prisma.memorialAcervoItem.count({ where }),
  ])
  return { itens, total }
}

export async function obterPublico(id: string) {
  const r = await prisma.memorialAcervoItem.findFirst({
    where: { id, ...PUBLICADO },
    include: {
      album: { select: { nome: true, slug: true } },
      exposicoes: { where: PUBLICADO, select: { titulo: true, slug: true } },
      pessoas: { where: PUBLICADO, select: { nome: true, slug: true } },
      eventos: { where: PUBLICADO, select: { titulo: true, slug: true, ano: true } },
    },
  })
  return exigirEncontrado(r, 'Item do acervo não encontrado.')
}

/** Décadas que têm ao menos uma fotografia publicada, para o filtro da galeria. */
export async function decadasPublicadas() {
  const grupos = await prisma.memorialAcervoItem.groupBy({
    by: ['decada'],
    where: { ...PUBLICADO, tipo: 'FOTOGRAFIA', decada: { not: null } },
    orderBy: { decada: 'asc' },
  })
  return grupos.map((g) => g.decada).filter((d): d is number => d !== null)
}

import { randomUUID } from 'crypto'
import type { Manual, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { deleteFile, extractStoragePath, uploadFile } from '@/lib/storage'
import { slugify } from '@/lib/utils/slug'
import { lerDocumentoValidado } from '@/lib/manuais/arquivo'
import type { ListagemManuais, ManualInput } from '@/lib/schemas/manual'
import type { Autor } from './memorial-conteudo.service'
import { ServiceError } from './errors'

const BUCKET = 'manuais'

async function existente(id: string): Promise<Manual> {
  const manual = await prisma.manual.findUnique({ where: { id } })
  if (!manual) throw new ServiceError('NOT_FOUND', 'Documento não encontrado.')
  return manual
}

function auditar(action: string, manual: Pick<Manual, 'id' | 'titulo' | 'categoria' | 'publicado'>, autor: Autor) {
  return logAudit({
    userId: autor.userId,
    action,
    entity: 'Manual',
    entityId: manual.id,
    details: { titulo: manual.titulo, categoria: manual.categoria, publicado: manual.publicado },
    ip: autor.ip,
  })
}

/**
 * Apaga o arquivo do disco quando nenhum outro manual aponta para ele.
 * Falha ao apagar não desfaz a gravação no banco: o arquivo fica órfão, só isso.
 */
async function descartarArquivo(url: string, idIgnorado?: string) {
  const caminho = extractStoragePath(BUCKET, url)
  if (!caminho) return
  const emUso = await prisma.manual.count({ where: { url, ...(idIgnorado ? { id: { not: idIgnorado } } : {}) } })
  if (emUso > 0) return
  try {
    await deleteFile(BUCKET, caminho)
  } catch (err) {
    console.error({ aviso: 'Falha ao apagar arquivo de manual', erro: err instanceof Error ? err.message : 'Unknown' })
  }
}

export async function listarAdmin(f: ListagemManuais) {
  const where: Prisma.ManualWhereInput = f.status ? { publicado: f.status === 'publicado' } : {}
  const [itens, total] = await Promise.all([
    prisma.manual.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { titulo: 'asc' }],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.manual.count({ where }),
  ])
  return { itens, total }
}

/** Categorias já usadas, para sugerir no formulário e evitar grafias diferentes. */
export async function categorias(): Promise<string[]> {
  const linhas = await prisma.manual.findMany({ distinct: ['categoria'], select: { categoria: true }, orderBy: { categoria: 'asc' } })
  return linhas.map((l) => l.categoria)
}

export async function obter(id: string) {
  return existente(id)
}

export async function criar(i: ManualInput, autor: Autor) {
  const manual = await prisma.manual.create({ data: i })
  await auditar('MANUAL_CRIADO', manual, autor)
  return manual
}

export async function atualizar(id: string, i: ManualInput, autor: Autor) {
  const atual = await existente(id)
  const manual = await prisma.manual.update({ where: { id }, data: i })
  if (atual.url !== manual.url) await descartarArquivo(atual.url, id)
  await auditar('MANUAL_ATUALIZADO', manual, autor)
  return manual
}

export async function excluir(id: string, autor: Autor) {
  const atual = await existente(id)
  await prisma.manual.delete({ where: { id } })
  await descartarArquivo(atual.url)
  await auditar('MANUAL_EXCLUIDO', atual, autor)
}

/**
 * Grava o documento no bucket público e devolve a URL. O nome no disco nasce do
 * nome original (sem acento, para o link e o download) mais um sufixo aleatório.
 */
export async function enviarArquivo(file: File): Promise<string> {
  const doc = await lerDocumentoValidado(file)
  if (!doc.ok) throw new ServiceError('BAD_REQUEST', doc.message)
  const base = slugify(file.name.slice(0, file.name.length - doc.ext.length - 1)).slice(0, 60) || 'documento'
  return uploadFile(BUCKET, `${base}-${randomUUID().slice(0, 8)}.${doc.ext}`, doc.buffer, doc.mime)
}

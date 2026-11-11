import { prisma } from '@/lib/db'
import { extensaoDoArquivo, isImagemManual } from '@/lib/manuais/regras'

export type TipoArquivo = 'pdf' | 'documento' | 'planilha' | 'imagem'

export interface ManualPublico {
  id: string
  titulo: string
  url: string
  versao: string | null
  /** Extensão em caixa alta, para o selo do cartão. */
  extensao: string
  tipo: TipoArquivo
}

export interface CategoriaDeManuais {
  /** Âncora da seção, para o índice no topo da página. */
  id: string
  nome: string
  manuais: ManualPublico[]
}

export function tipoDoArquivo(url: string): TipoArquivo {
  const ext = extensaoDoArquivo(url)
  if (isImagemManual(url)) return 'imagem'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'xls' || ext === 'xlsx') return 'planilha'
  return 'documento'
}

function idDaCategoria(nome: string, posicao: number): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `categoria-${base || posicao}`
}

/** Manuais publicados, agrupados por categoria na ordem alfabética do banco. */
export async function consultarManuais(): Promise<CategoriaDeManuais[]> {
  const registros = await prisma.manual.findMany({
    where: { publicado: true },
    orderBy: [{ categoria: 'asc' }, { titulo: 'asc' }],
  })

  const porCategoria = new Map<string, ManualPublico[]>()
  for (const m of registros) {
    const manual: ManualPublico = {
      id: m.id,
      titulo: m.titulo,
      url: m.url,
      versao: m.versao,
      extensao: extensaoDoArquivo(m.url).toUpperCase() || 'ARQUIVO',
      tipo: tipoDoArquivo(m.url),
    }
    porCategoria.set(m.categoria, [...(porCategoria.get(m.categoria) ?? []), manual])
  }

  return Array.from(porCategoria, ([nome, manuais], i) => ({ id: idDaCategoria(nome, i), nome, manuais }))
}

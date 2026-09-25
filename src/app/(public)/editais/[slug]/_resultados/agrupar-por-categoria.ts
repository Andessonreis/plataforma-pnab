import { slugify } from '@/lib/utils/slug'
import { descreverQuadroVagas } from '@/lib/pdf/modelo/lista-classificacao'
import type { LinhaResultadoPublico } from '@/lib/results/resultado-publico'
import type { CategoriaConfig } from '@/types/categoria-config'

export interface CategoriaResultado {
  /** Âncora estável para o índice de categorias da página. */
  ancora: string
  nome: string
  /** Vagas e valor da categoria, do quadro de vagas do edital; nulo se o edital não a configura. */
  quadroDeVagas: string | null
  linhas: LinhaResultadoPublico[]
}

const SEM_CATEGORIA = 'Sem categoria'

function ancoraDe(nome: string): string {
  return `categoria-${slugify(nome) || 'outras'}`
}

/**
 * Separa a lista em categorias, em ordem alfabética como no PDF da
 * classificação, e junta a cada uma o quadro de vagas do edital. Dentro de cada
 * categoria vale a ordem em que as linhas chegam (já vêm por posição).
 */
export function agruparPorCategoria(
  linhas: LinhaResultadoPublico[],
  categoriasConfig: CategoriaConfig[] | null,
): CategoriaResultado[] {
  const grupos = new Map<string, LinhaResultadoPublico[]>()
  for (const linha of linhas) {
    const nome = linha.categoria ?? SEM_CATEGORIA
    grupos.set(nome, [...(grupos.get(nome) ?? []), linha])
  }

  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([nome, grupo]) => {
    const config = categoriasConfig?.find((c) => c.nome === nome)
    return {
      ancora: ancoraDe(nome),
      nome,
      quadroDeVagas: config ? descreverQuadroVagas(config) : null,
      linhas: grupo,
    }
  })
}

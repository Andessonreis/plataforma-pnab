import { prisma } from '@/lib/db'
import { FASES_DO_PRELIMINAR, resultadoDefinitivo } from '@/lib/edital/fase'
import { resolverTemplateResultado, type TemplateResultado } from '@/lib/edital/template-resultado'
import {
  lerResultadoPreliminar, linhasDoResultado, type LinhaResultadoPublico,
} from '@/lib/results/resultado-publico'
import type { CategoriaConfig } from '@/types/categoria-config'
import { agruparPorCategoria, type CategoriaResultado } from './agrupar-por-categoria'
import { escolherDiarioOficial } from './diario-oficial'

export type FaseResultado = 'preliminar' | 'definitivo'

/** Fases em que o resultado preliminar já foi publicado. */
const FASES_COM_RESULTADO = [...FASES_DO_PRELIMINAR, 'RESULTADO_FINAL', 'ENCERRADO']

export interface ResultadoEdital {
  titulo: string
  ano: number
  slug: string
  fase: FaseResultado
  /** Falso quando a lista da fase ainda não foi publicada (ou não ficou guardada). */
  disponivel: boolean
  /** Dia em que o preliminar foi publicado; só existe quando a cópia foi guardada. */
  publicadoEm: Date | null
  /** Fotos, títulos e rótulos das páginas de resultado deste edital. */
  template: TemplateResultado
  /** Verdadeiro quando o edital usa fórmula — muda o rótulo da coluna. */
  porPontuacao: boolean
  diarioOficialUrl: string | null
  /** O resultado definitivo já saiu — o preliminar deixa de admitir recurso. */
  definitivoPublicado: boolean
  total: number
  categorias: CategoriaResultado[]
}

/** Linhas da fase: o preliminar lê a cópia guardada; o definitivo, as inscrições como estão. */
async function linhasDaFase(
  fase: FaseResultado,
  edital: { id: string; status: string; resultadoPreliminar: unknown },
  foraDaClassificacao: readonly string[],
): Promise<{ linhas: LinhaResultadoPublico[]; publicadoEm: Date | null } | null> {
  if (fase === 'definitivo') {
    return resultadoDefinitivo(edital.status)
      ? { linhas: await linhasDoResultado(edital.id, foraDaClassificacao), publicadoEm: null }
      : null
  }

  // Edital que voltou a uma fase anterior à publicação não expõe a cópia: o resultado deixou de ser público.
  const guardado = FASES_COM_RESULTADO.includes(edital.status) ? lerResultadoPreliminar(edital.resultadoPreliminar) : null
  if (guardado) return { linhas: guardado.linhas, publicadoEm: new Date(guardado.publicadoEm) }

  // Edital que ainda está na fase do preliminar e não guardou a cópia: a lista atual é a do preliminar.
  return FASES_DO_PRELIMINAR.includes(edital.status)
    ? { linhas: await linhasDoResultado(edital.id, foraDaClassificacao), publicadoEm: null }
    : null
}

export async function consultarResultado(slug: string, fase: FaseResultado): Promise<ResultadoEdital | null> {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: {
      id: true, titulo: true, ano: true, status: true, formulaAvaliacao: true,
      cronograma: true, categoriasConfig: true, resultadoPreliminar: true, resultadoTemplate: true,
    },
  })
  if (!edital) return null

  const template = resolverTemplateResultado(edital.resultadoTemplate)
  const dados = await linhasDaFase(fase, edital, template.foraDaClassificacao)

  // Só o preliminar recorre ao arquivo do edital: um "Diário Oficial" anexado
  // ali é, em regra, o da primeira publicação, e não pode passar pela lista final.
  const preliminar = fase === 'preliminar'
  let diarioOficialUrl = escolherDiarioOficial(edital.cronograma, preliminar)
  if (!diarioOficialUrl && preliminar) {
    const arquivoDiario = await prisma.arquivoEdital.findFirst({
      where: {
        editalId: edital.id,
        OR: [
          { titulo: { contains: 'Diário Oficial', mode: 'insensitive' } },
          { url: { contains: 'pdfGateway', mode: 'insensitive' } },
        ],
      },
      select: { url: true },
    })
    diarioOficialUrl = arquivoDiario?.url ?? null
  }

  const categoriasConfig = Array.isArray(edital.categoriasConfig)
    ? (edital.categoriasConfig as unknown as CategoriaConfig[])
    : null

  return {
    titulo: edital.titulo,
    ano: edital.ano,
    slug,
    fase,
    disponivel: dados !== null,
    template,
    publicadoEm: dados?.publicadoEm ?? null,
    porPontuacao: Boolean(edital.formulaAvaliacao),
    diarioOficialUrl,
    definitivoPublicado: resultadoDefinitivo(edital.status),
    total: dados?.linhas.length ?? 0,
    categorias: dados ? agruparPorCategoria(dados.linhas, categoriasConfig) : [],
  }
}

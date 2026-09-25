import { cache } from 'react'
import { prisma } from '@/lib/db'
import { resultadoDefinitivo } from '@/lib/edital/fase'
import { janelaDoRecurso } from '@/lib/edital/prazo-recurso'
import { resolverTemplateResultado, type TemplateResultado } from '@/lib/edital/template-resultado'
import { ETAPAS_RECURSO, faseDaEtapa } from '@/lib/services/relatorio-recursos.etapas'
import { buscarRecursosDaEtapa, situacaoDe } from '@/lib/services/recursos-da-etapa'
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import { escolherDiarioOficial } from './diario-oficial'

const ETAPA = ETAPAS_RECURSO.selecao

/**
 * Trechos do título do documento com o relatório em PDF, cadastrado entre os
 * documentos do edital. Sem depender do travessão nem da capitalização: o
 * título é digitado à mão no admin.
 */
const TRECHOS_DO_TITULO_DO_RELATORIO = ['Recursos Interpostos', 'Seleção']

export interface RecursoPublico {
  posicao: number
  numero: string
  proponente: string
  /** Mascarado como nas relações publicadas no Diário Oficial. */
  cpfCnpj: string
  /** Código da decisão (`DEFERIDO`, `INDEFERIDO`); nulo enquanto o recurso está em análise. */
  decisao: string | null
  situacao: string
}

export interface ResultadoRecursos {
  titulo: string
  ano: number
  slug: string
  /** Fotos da capa: as mesmas do template das páginas de resultado do edital. */
  fotos: TemplateResultado['fotos']
  /** Falso até o resultado final: a decisão dos recursos só é pública junto com ele. */
  disponivel: boolean
  etapa: string
  /** Rótulo do total de inscrições da etapa, como no relatório em PDF. */
  rotuloDoUniverso: string
  prazo: { inicio: Date; fim: Date } | null
  totalInscricoes: number
  recursos: RecursoPublico[]
  relatorioUrl: string | null
  diarioOficialUrl: string | null
}

/**
 * Resultado dos recursos da etapa de seleção, como o portal o expõe ao público.
 *
 * A decisão de cada recurso é ato da Comissão de Seleção e só é divulgada com
 * o resultado final (`respostaRecursoLiberada`); antes disso a página existe
 * mas não lista nada, para a decisão não vazar por um endereço direto.
 */
export const consultarResultadoRecursos = cache(async (slug: string): Promise<ResultadoRecursos | null> => {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { id: true, titulo: true, ano: true, status: true, cronograma: true, resultadoTemplate: true },
  })
  if (!edital) return null

  const base = {
    titulo: edital.titulo,
    ano: edital.ano,
    slug,
    fotos: resolverTemplateResultado(edital.resultadoTemplate).fotos,
    etapa: ETAPA.rotulo,
    rotuloDoUniverso: ETAPA.labelUniverso,
  }
  const disponivel = resultadoDefinitivo(edital.status)
  if (!disponivel) {
    return { ...base, disponivel, prazo: null, totalInscricoes: 0, recursos: [], relatorioUrl: null, diarioOficialUrl: null }
  }

  const { fase, acaoJanela } = faseDaEtapa(edital.cronograma, ETAPA)
  const janela = janelaDoRecurso(edital.cronograma, acaoJanela)
  const [{ recursos, totalInscricoes }, relatorio] = await Promise.all([
    buscarRecursosDaEtapa(edital.id, fase, ETAPA.universo),
    prisma.arquivoEdital.findFirst({
      where: {
        editalId: edital.id,
        AND: TRECHOS_DO_TITULO_DO_RELATORIO.map((trecho) => ({ titulo: { contains: trecho, mode: 'insensitive' as const } })),
      },
      orderBy: { createdAt: 'desc' },
      select: { url: true },
    }),
  ])

  return {
    ...base,
    disponivel,
    prazo: janela?.fim ? { inicio: janela.inicio, fim: janela.fim } : null,
    totalInscricoes,
    recursos: recursos.map((r, i) => ({
      posicao: i + 1,
      numero: r.inscricao.numero,
      proponente: r.inscricao.proponente.nome,
      cpfCnpj: maskCpfCnpjParcial(r.inscricao.proponente.cpfCnpj),
      decisao: r.decisao,
      situacao: situacaoDe(r.decisao),
    })),
    relatorioUrl: relatorio?.url ?? null,
    diarioOficialUrl: escolherDiarioOficial(edital.cronograma, false),
  }
})

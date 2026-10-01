import { prisma } from '@/lib/db'
import { resolverTemplateResultado, type TemplateResultado } from '@/lib/edital/template-resultado'
import {
  CATEGORIAS_HABILITACAO_FESTIVAL,
  isEditalFestival,
  type PropostaHabilitacaoFestival,
} from '@/lib/edital/dados-habilitados-festival'
import type { CronogramaItem } from '@/types/cronograma'
import { PUBLICACAO_STATUS_FILTER } from '@/lib/edital/publicacoes'

export interface PropostaHabilitacaoItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  modalidade: string
  notaFinal: number
  habilitada: boolean
  motivo?: string
}

export interface CategoriaHabilitacaoItem {
  nome: string
  ancora: string
  vagasInfo?: string
  propostas: PropostaHabilitacaoItem[]
}

export interface HabilitacaoEdital {
  titulo: string
  ano: number
  slug: string
  /**
   * Falso quando o resultado da habilitação ainda não foi publicado no Diário Oficial.
   * Pode ser forçado como `true` via preview no ambiente administrativo/staging.
   */
  disponivel: boolean
  dataPublicacaoPrevista: string | null
  diarioOficialUrl: string | null
  template: TemplateResultado
  totalConvocados: number
  totalHabilitados: number
  totalInabilitados: number
  categorias: CategoriaHabilitacaoItem[]
}

interface OpcoesConsulta {
  preview?: boolean
}

function normalizarAncora(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buscarDiarioOficialMarco(cronograma: unknown): { diarioOficialUrl: string | null; dataHora: string | null } {
  if (!Array.isArray(cronograma)) return { diarioOficialUrl: null, dataHora: null }

  for (const it of cronograma as CronogramaItem[]) {
    if (it && typeof it === 'object' && it.tipo === 'custom') {
      if (it.acao === 'PUBLICACAO_HABILITADOS' || it.acao === 'PUBLICACAO_HABILITADOS_POS_RECURSOS') {
        return {
          diarioOficialUrl: it.diarioOficialUrl?.trim() || null,
          dataHora: it.dataHora || null,
        }
      }
    }
  }

  return { diarioOficialUrl: null, dataHora: null }
}

export async function consultarHabilitacao(
  slug: string,
  opcoes?: OpcoesConsulta,
): Promise<HabilitacaoEdital | null> {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: {
      id: true,
      titulo: true,
      ano: true,
      cronograma: true,
      resultadoTemplate: true,
    },
  })

  if (!edital) return null

  const template = resolverTemplateResultado(edital.resultadoTemplate)
  const marcoHabilitacao = buscarDiarioOficialMarco(edital.cronograma)

  let diarioOficialUrl = marcoHabilitacao.diarioOficialUrl

  // Se não encontrou link direto no marco, verifica se há arquivo anexado específico de habilitação
  if (!diarioOficialUrl) {
    const arquivo = await prisma.arquivoEdital.findFirst({
      where: {
        editalId: edital.id,
        tipo: { not: 'PDF_EDITAL' },
        OR: [
          { titulo: { contains: 'Habilita', mode: 'insensitive' } },
          { titulo: { contains: 'Diário Oficial', mode: 'insensitive' } },
        ],
      },
      select: { url: true },
    })
    diarioOficialUrl = arquivo?.url ?? null
  }

  // Divulgação no sistema: só liberada quando o Diário Oficial for informado,
  // salvo em modo preview explícito para conferência administrativa.
  const disponivel = Boolean(opcoes?.preview || diarioOficialUrl)

  // Caso especial: Festival de Arte e Cultura de Irecê (Inversão de Fases)
  if (isEditalFestival(slug)) {
    let totalConvocados = 0
    let totalHabilitados = 0
    let totalInabilitados = 0

    const categorias: CategoriaHabilitacaoItem[] = CATEGORIAS_HABILITACAO_FESTIVAL.map((cat) => {
      const propostas: PropostaHabilitacaoItem[] = cat.propostas.map((prop: PropostaHabilitacaoFestival) => {
        totalConvocados++
        if (prop.habilitado) {
          totalHabilitados++
        } else {
          totalInabilitados++
        }

        return {
          posicao: prop.posicao,
          numero: prop.numero,
          nome: prop.nome,
          cpfCnpj: prop.cpfCnpj,
          modalidade: prop.modalidade,
          notaFinal: prop.notaFinal,
          habilitada: prop.habilitado,
          motivo: prop.motivo,
        }
      })

      return {
        nome: cat.nome,
        ancora: cat.ancora,
        vagasInfo: cat.vagasInfo,
        propostas,
      }
    })

    return {
      titulo: edital.titulo,
      ano: edital.ano,
      slug,
      disponivel,
      dataPublicacaoPrevista: marcoHabilitacao.dataHora,
      diarioOficialUrl,
      template,
      totalConvocados,
      totalHabilitados,
      totalInabilitados,
      categorias,
    }
  }

  // Comportamento padrão para demais editais (lendo da tabela Inscricao)
  const inscricoes = await prisma.inscricao.findMany({
    where: {
      editalId: edital.id,
      status: { in: PUBLICACAO_STATUS_FILTER.PUBLICACAO_HABILITADOS },
      resultadoLiberadoEm: { not: null },
    },
    include: {
      proponente: { select: { nome: true, cpfCnpj: true } },
    },
    orderBy: [{ categoria: 'asc' }, { numero: 'asc' }],
  })

  const totalConvocados = inscricoes.length
  let totalHabilitados = 0
  let totalInabilitados = 0

  const gruposPorCategoria = new Map<string, PropostaHabilitacaoItem[]>()

  for (const inscricao of inscricoes) {
    const habilitada = inscricao.status !== 'INABILITADA'
    if (habilitada) {
      totalHabilitados++
    } else {
      totalInabilitados++
    }

    const catNome = inscricao.categoria || 'Geral'
    const lista = gruposPorCategoria.get(catNome) || []

    lista.push({
      posicao: inscricao.posicao ?? lista.length + 1,
      numero: inscricao.numero,
      nome: inscricao.proponente.nome,
      cpfCnpj: inscricao.proponente.cpfCnpj || '',
      modalidade: inscricao.cotasOptIn.length > 0 ? `Cota — ${inscricao.cotasOptIn.join(', ')}` : 'Ampla concorrência',
      notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal) : 0,
      habilitada,
      motivo: inscricao.motivoInabilitacao || undefined,
    })

    gruposPorCategoria.set(catNome, lista)
  }

  const categorias: CategoriaHabilitacaoItem[] = Array.from(gruposPorCategoria.entries()).map(([nome, propostas]) => ({
    nome,
    ancora: normalizarAncora(nome),
    propostas,
  }))

  return {
    titulo: edital.titulo,
    ano: edital.ano,
    slug,
    disponivel,
    dataPublicacaoPrevista: marcoHabilitacao.dataHora,
    diarioOficialUrl,
    template,
    totalConvocados,
    totalHabilitados,
    totalInabilitados,
    categorias,
  }
}

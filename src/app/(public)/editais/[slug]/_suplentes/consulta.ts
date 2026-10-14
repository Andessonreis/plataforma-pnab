import { prisma } from '@/lib/db'
import { resolverTemplateResultado, type TemplateResultado } from '@/lib/edital/template-resultado'
import {
  CATEGORIAS_SUPLENTES_FESTIVAL,
  type PropostaSuplenteFestival,
} from '@/lib/edital/dados-suplentes-festival'
import { isEditalFestival } from '@/lib/edital/dados-habilitados-festival'
import type { CronogramaItem } from '@/types/cronograma'

export interface PropostaSuplenteItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  modalidade: string
  notaFinal: number
  convocado: boolean
  situacao: string
  motivo?: string
}

export interface CategoriaSuplentesItem {
  nome: string
  ancora: string
  vagasInfo?: string
  propostas: PropostaSuplenteItem[]
}

export interface SuplentesEdital {
  titulo: string
  ano: number
  slug: string
  disponivel: boolean
  dataPublicacaoPrevista: string | null
  diarioOficialUrl: string | null
  template: TemplateResultado
  totalConvocados: number
  totalCategorias: number
  categorias: CategoriaSuplentesItem[]
}

interface OpcoesConsulta {
  preview?: boolean
}

function buscarDiarioOficialMarco(cronograma: unknown): { diarioOficialUrl: string | null; dataHora: string | null } {
  if (!Array.isArray(cronograma)) return { diarioOficialUrl: null, dataHora: null }

  for (const it of cronograma as CronogramaItem[]) {
    if (it && typeof it === 'object') {
      if (
        (it.tipo === 'custom' && it.label?.toLowerCase().includes('suplente')) ||
        (it as { acao?: string }).acao === 'PUBLICACAO_SUPLENTES'
      ) {
        return {
          diarioOficialUrl: (it as { diarioOficialUrl?: string }).diarioOficialUrl?.trim() || null,
          dataHora: it.dataHora || null,
        }
      }
    }
  }

  return { diarioOficialUrl: null, dataHora: null }
}

export async function consultarSuplentes(
  slug: string,
  opcoes?: OpcoesConsulta,
): Promise<SuplentesEdital | null> {
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
  const marcoSuplentes = buscarDiarioOficialMarco(edital.cronograma)

  let diarioOficialUrl = marcoSuplentes.diarioOficialUrl

  // Se não encontrou link direto no marco, verifica se há arquivo anexado
  if (!diarioOficialUrl) {
    const arquivo = await prisma.arquivoEdital.findFirst({
      where: {
        editalId: edital.id,
        tipo: { not: 'PDF_EDITAL' },
        OR: [
          { titulo: { contains: 'Suplente', mode: 'insensitive' } },
          { titulo: { contains: 'Diário Oficial', mode: 'insensitive' } },
        ],
      },
      select: { url: true },
    })
    diarioOficialUrl = arquivo?.url ?? null
  }

  // Fallback padrão se for o festival
  if (!diarioOficialUrl && isEditalFestival(slug)) {
    diarioOficialUrl = `/api/arquivos/editais/edital-${edital.id}/diario-oficial-ed-2949-convocacao-de-suplente.pdf`
  }

  const disponivel = Boolean(opcoes?.preview || diarioOficialUrl || isEditalFestival(slug))

  if (isEditalFestival(slug)) {
    let totalConvocados = 0

    const categorias: CategoriaSuplentesItem[] = CATEGORIAS_SUPLENTES_FESTIVAL.map((cat) => {
      const propostas: PropostaSuplenteItem[] = cat.propostas.map((prop: PropostaSuplenteFestival) => {
        if (prop.convocado) {
          totalConvocados++
        }

        return {
          posicao: prop.posicao,
          numero: prop.numero,
          nome: prop.nome,
          cpfCnpj: prop.cpfCnpj,
          modalidade: prop.modalidade,
          notaFinal: prop.notaFinal,
          convocado: prop.convocado,
          situacao: prop.situacao,
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
      dataPublicacaoPrevista: marcoSuplentes.dataHora,
      diarioOficialUrl,
      template,
      totalConvocados,
      totalCategorias: categorias.length,
      categorias,
    }
  }

  // Para outros editais, consulta na tabela Inscricao propostas com status SUPLENTE
  const inscricoes = await prisma.inscricao.findMany({
    where: {
      editalId: edital.id,
      status: 'SUPLENTE',
    },
    include: {
      proponente: { select: { nome: true, cpfCnpj: true } },
    },
    orderBy: [{ categoria: 'asc' }, { posicao: 'asc' }],
  })

  const gruposPorCategoria = new Map<string, PropostaSuplenteItem[]>()
  let totalConvocados = 0

  for (const inscricao of inscricoes) {
    totalConvocados++
    const catNome = inscricao.categoria || 'Geral'
    const lista = gruposPorCategoria.get(catNome) || []

    lista.push({
      posicao: inscricao.posicao ?? lista.length + 1,
      numero: inscricao.numero,
      nome: inscricao.proponente.nome,
      cpfCnpj: inscricao.proponente.cpfCnpj || '',
      modalidade: inscricao.cotasOptIn.length > 0 ? `Cota — ${inscricao.cotasOptIn.join(', ')}` : 'Ampla concorrência',
      notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal) : 0,
      convocado: true,
      situacao: 'Convocado',
      motivo: 'Vaga remanescente de suplência',
    })

    gruposPorCategoria.set(catNome, lista)
  }

  const categorias: CategoriaSuplentesItem[] = Array.from(gruposPorCategoria.entries()).map(([nome, propostas]) => ({
    nome,
    ancora: nome.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    propostas,
  }))

  return {
    titulo: edital.titulo,
    ano: edital.ano,
    slug,
    disponivel,
    dataPublicacaoPrevista: marcoSuplentes.dataHora,
    diarioOficialUrl,
    template,
    totalConvocados,
    totalCategorias: categorias.length,
    categorias,
  }
}

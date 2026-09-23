import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { descartarEmissao, registrarEmissao, type Emissao } from '@/lib/documentos/emissao'
import { ETAPAS_RECURSO_ROTULO, type EtapaRecurso } from '@/lib/edital/etapas-recurso'
import { prazoRecursoEncerrado, protocoladoForaDoPrazo } from '@/lib/edital/prazo-recurso'
import { PUBLICACAO_STATUS_FILTER } from '@/lib/edital/publicacoes'
import { generateRelatorioRecursos, type RelatorioRecursosItem } from '@/lib/pdf/relatorio-recursos'
import { recursoDecisaoLabel } from '@/lib/status-maps'
import { formatDate } from '@/lib/utils/format'
import type { AcaoJanela } from '@/types/cronograma'
import { ServiceError } from './errors'

interface EtapaConfig {
  rotulo: string
  /** Valor de `Recurso.fase` que pertence à etapa. */
  fase: 'HABILITACAO' | 'RESULTADO_PRELIMINAR'
  /** Item do cronograma que delimita o prazo de interposição. */
  acaoJanela: AcaoJanela
  /** Status das inscrições que entraram na etapa. */
  universo: InscricaoStatus[]
  /** Rótulo curto: rótulos longos quebram a linha da tabela de dados do PDF. */
  labelUniverso: string
}

const ETAPAS_RECURSO: Record<EtapaRecurso, EtapaConfig> = {
  habilitacao: {
    rotulo: ETAPAS_RECURSO_ROTULO.habilitacao,
    fase: 'HABILITACAO',
    acaoJanela: 'RECURSO_HABILITACAO_JANELA',
    universo: PUBLICACAO_STATUS_FILTER.PUBLICACAO_HABILITADOS,
    labelUniverso: 'Inscrições analisadas',
  },
  selecao: {
    rotulo: ETAPAS_RECURSO_ROTULO.selecao,
    fase: 'RESULTADO_PRELIMINAR',
    acaoJanela: 'RECURSO_RESULTADO_JANELA',
    // Inclui RECURSO_ABERTO por compatibilidade com inscrições de editais
    // anteriores: submitRecurso já não move a inscrição para esse status.
    universo: PUBLICACAO_STATUS_FILTER.PUBLICACAO_RESULTADO_PRELIMINAR,
    labelUniverso: 'Inscrições classificadas',
  },
}

interface EmitirRelatorioRecursosInput {
  editalId: string
  etapa: EtapaRecurso
  userId: string
  ip?: string
}

export interface RelatorioRecursosEmitido {
  buffer: Buffer
  filename: string
  /** Nulo quando o registro de emissão falhou; o PDF sai mesmo assim, sem código. */
  emissao: Emissao | null
}

const SUFIXO_FORA_DO_PRAZO = ' (fora do prazo)'

/** Decisão ausente é recurso ainda em análise; valor desconhecido aparece como veio. */
function situacaoDe(decisao: string | null): string {
  if (decisao === null) return 'Em análise'
  return recursoDecisaoLabel[decisao] ?? decisao
}

/**
 * Emite o extrato dos recursos interpostos numa etapa, com ou sem recurso.
 *
 * Cada emissão fica registrada duas vezes: em `DocumentoEmitido`, que dá o
 * código e o QR impressos no PDF, e no log de auditoria, que guarda quem
 * emitiu e o mesmo código para ligar a trilha ao documento.
 *
 * Recurso protocolado fora da janela do cronograma não é escondido: entra no
 * extrato marcado e contado, porque a rota de interposição não barra por data.
 */
export async function emitirRelatorioRecursos(
  { editalId, etapa, userId, ip }: EmitirRelatorioRecursosInput,
): Promise<RelatorioRecursosEmitido> {
  const config = ETAPAS_RECURSO[etapa]

  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { titulo: true, ano: true, slug: true, cronograma: true },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const prazo = prazoRecursoEncerrado(edital.cronograma, config.acaoJanela, config.rotulo)

  const [recursos, totalInscricoes] = await Promise.all([
    prisma.recurso.findMany({
      where: { fase: config.fase, inscricao: { editalId } },
      // O id desempata protocolos do mesmo instante: sem ele a ordem, e com ela o hash, poderia variar.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        createdAt: true,
        decisao: true,
        inscricao: {
          select: { numero: true, proponente: { select: { nome: true, cpfCnpj: true } } },
        },
      },
    }),
    prisma.inscricao.count({ where: { editalId, status: { in: config.universo } } }),
  ])

  const fora = recursos.map((r) => protocoladoForaDoPrazo(r.createdAt, prazo))
  const totalForaDoPrazo = fora.filter(Boolean).length

  const itens: RelatorioRecursosItem[] = recursos.map((r, i) => ({
    posicao: i + 1,
    numero: r.inscricao.numero,
    nome: r.inscricao.proponente.nome,
    cpfCnpj: r.inscricao.proponente.cpfCnpj ?? '',
    protocoladoEm: r.createdAt,
    situacao: situacaoDe(r.decisao) + (fora[i] ? SUFIXO_FORA_DO_PRAZO : ''),
  }))

  const emissao = await registrarEmissao({
    tipo: 'RELATORIO_RECURSOS',
    titulo: `Relatório de recursos — ${config.rotulo} — ${edital.titulo} (${edital.ano})`,
    editalId,
    emitidoPorId: userId,
    conteudo: {
      edital: edital.titulo,
      ano: edital.ano,
      etapa,
      prazo: { inicio: prazo.inicio.toISOString(), fim: prazo.fim.toISOString() },
      totalInscricoes,
      recursos: itens.map((i) => ({
        numero: i.numero,
        protocoladoEm: i.protocoladoEm.toISOString(),
        situacao: i.situacao,
      })),
    },
    metadados: {
      Etapa: config.rotulo,
      'Prazo para interposição': `${formatDate(prazo.inicio)} a ${formatDate(prazo.fim)}`,
      [config.labelUniverso]: totalInscricoes,
      'Recursos interpostos': itens.length,
      ...(totalForaDoPrazo > 0 ? { 'Fora do prazo': totalForaDoPrazo } : {}),
    },
  })

  let buffer: Buffer
  try {
    buffer = await generateRelatorioRecursos({
      edital: { titulo: edital.titulo, ano: edital.ano },
      etapa: config.rotulo,
      prazo,
      totalInscricoes,
      labelTotalInscricoes: config.labelUniverso,
      recursos: itens,
      foraDoPrazo: totalForaDoPrazo,
      emissao,
    })
  } catch (err) {
    // Sem PDF não há documento em circulação: o código não pode continuar valendo na verificação.
    if (emissao) await descartarEmissao(emissao.codigo)
    throw err
  }

  await logAudit({
    userId,
    action: 'EXPORTACAO_RELATORIO_RECURSOS',
    entity: 'Edital',
    entityId: editalId,
    details: {
      slug: edital.slug,
      etapa,
      recursos: itens.length,
      totalInscricoes,
      foraDoPrazo: totalForaDoPrazo,
      codigoEmissao: emissao?.codigo ?? null,
      hashConteudo: emissao?.hashConteudo ?? null,
    },
    ip,
  })

  const dia = new Date().toISOString().slice(0, 10)
  return { buffer, filename: `relatorio_recursos_${etapa}_${edital.slug}_${dia}.pdf`, emissao }
}

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { descartarEmissao, registrarEmissao, type Emissao } from '@/lib/documentos/emissao'
import { templatePreferido } from '@/lib/documentos/preferencia'
import type { TemplatePdf } from '@/lib/documentos/template'
import type { EtapaRecurso } from '@/lib/edital/etapas-recurso'
import { prazoRecursoEncerrado, protocoladoForaDoPrazo } from '@/lib/edital/prazo-recurso'
import type { RelatorioRecursosData } from '@/lib/pdf/modelo/tipos'
import { generateRelatorioRecursos, type RelatorioRecursosItem } from '@/lib/pdf/relatorio-recursos'
import { gerarRelatorioRecursosV1 } from '@/lib/pdf/template-1/relatorio-recursos'
import { formatDate } from '@/lib/utils/format'
import { ServiceError } from './errors'
import { ETAPAS_RECURSO, faseDaEtapa } from './relatorio-recursos.etapas'
import { buscarRecursosDaEtapa, situacaoDe } from './recursos-da-etapa'

interface EmitirRelatorioRecursosInput {
  editalId: string
  etapa: EtapaRecurso
  userId: string
  ip?: string
  /** Versão de layout pedida; sem ela vale a última que quem emite usou no edital. */
  template?: TemplatePdf
  /** Tira do extrato a coluna de data e hora do protocolo. */
  ocultarProtocolo?: boolean
}

export interface RelatorioRecursosEmitido {
  buffer: Buffer
  filename: string
  /** Nulo quando o registro de emissão falhou; o PDF sai mesmo assim, sem código. */
  emissao: Emissao | null
}

const SUFIXO_FORA_DO_PRAZO = ' (fora do prazo)'

const GERADORES: Record<TemplatePdf, (dados: RelatorioRecursosData) => Promise<Buffer>> = {
  1: gerarRelatorioRecursosV1,
  2: generateRelatorioRecursos,
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
  { editalId, etapa, userId, ip, template: templatePedido, ocultarProtocolo }: EmitirRelatorioRecursosInput,
): Promise<RelatorioRecursosEmitido> {
  const config = ETAPAS_RECURSO[etapa]

  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { titulo: true, ano: true, slug: true, cronograma: true },
  })
  if (!edital) throw new ServiceError('NOT_FOUND', 'Edital não encontrado.')

  const { fase, acaoJanela } = faseDaEtapa(edital.cronograma, config)
  const prazo = prazoRecursoEncerrado(edital.cronograma, acaoJanela, config.rotulo)

  const { recursos, totalInscricoes } = await buscarRecursosDaEtapa(editalId, fase, config.universo)

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

  const template = templatePedido ?? await templatePreferido(userId, editalId)

  const emissao = await registrarEmissao({
    tipo: 'RELATORIO_RECURSOS',
    titulo: `Relatório de recursos — ${config.rotulo} — ${edital.titulo} (${edital.ano})`,
    editalId,
    emitidoPorId: userId,
    template,
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
      ...(ocultarProtocolo ? { 'Coluna de protocolo': 'oculta' } : {}),
    },
  })

  let buffer: Buffer
  try {
    buffer = await GERADORES[template]({
      edital: { titulo: edital.titulo, ano: edital.ano },
      etapa: config.rotulo,
      prazo,
      totalInscricoes,
      labelTotalInscricoes: config.labelUniverso,
      recursos: itens,
      foraDoPrazo: totalForaDoPrazo,
      ocultarProtocolo,
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

/**
 * Conteúdo do relatório de recursos interpostos que as duas versões de layout
 * escrevem do mesmo jeito: identificação, colunas, linhas, conclusão e aviso.
 * Sem PDFKit.
 */
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import type { RelatorioRecursosData, RelatorioRecursosItem } from './tipos'

/** Somam a largura útil da página (495,28pt). */
const COLUNAS_RECURSOS = [
  { label: 'Nº', width: 24 },
  { label: 'Inscrição', width: 74 },
  { label: 'Proponente', width: 155 },
  { label: 'CPF/CNPJ', width: 68 },
  { label: 'Protocolado em', width: 84.28 },
  { label: 'Situação', width: 90 },
]

const POSICAO_PROTOCOLO = 4

/** Colunas da tabela; sem o protocolo, a largura dele vai para o nome do proponente. */
export function colunasRecursos({ ocultarProtocolo }: RelatorioRecursosData): Array<{ label: string; width: number }> {
  if (!ocultarProtocolo) return COLUNAS_RECURSOS
  const liberada = COLUNAS_RECURSOS[POSICAO_PROTOCOLO].width
  return COLUNAS_RECURSOS
    .filter((_, i) => i !== POSICAO_PROTOCOLO)
    .map((coluna) => (coluna.label === 'Proponente' ? { ...coluna, width: coluna.width + liberada } : coluna))
}

export const SEM_RECURSO = 'Não consta recurso interposto no prazo.'

/** Sem a coluna de protocolo o documento não sustenta "no prazo indicado": cita só a etapa. */
export function avisoLegalRecursos({ ocultarProtocolo }: RelatorioRecursosData): string {
  const abrangencia = ocultarProtocolo ? 'na etapa indicada' : 'na etapa e no prazo indicados'
  return 'Documento oficial gerado pela plataforma Portal PNAB Irecê. Relaciona os recursos '
    + `registrados no sistema ${abrangencia} acima, conforme os dados existentes na data e hora de geração.`
}

const TZ = 'America/Sao_Paulo'

function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR', { timeZone: TZ })
}

function formatarHora(data: Date): string {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
}

function formatarDataHora(data: Date): string {
  return `${formatarData(data)} ${formatarHora(data)}`
}

/** Data no corpo do texto: "08/09/2026, às 23h59". */
function formatarDataPorExtenso(data: Date): string {
  return `${formatarData(data)}, às ${formatarHora(data).replace(':', 'h')}`
}

export function descreverPrazo(prazo: RelatorioRecursosData['prazo']): string {
  if (!prazo) return 'não fixado no cronograma'
  return `${formatarData(prazo.inicio)} a ${formatarData(prazo.fim)}`
}

/** Encerrado só quando a janela do cronograma já passou. */
function descreverSituacaoPrazo(prazo: RelatorioRecursosData['prazo']): string {
  if (!prazo) return '—'
  return prazo.fim.getTime() < Date.now() ? 'Encerrado' : 'Em curso'
}

/** Bloco de identificação que abre o documento. */
export function identificacaoRecursos(data: RelatorioRecursosData): Array<{ label: string; value: string }> {
  return [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Etapa', value: data.etapa },
    { label: 'Prazo para interposição', value: descreverPrazo(data.prazo) },
    { label: 'Situação do prazo', value: descreverSituacaoPrazo(data.prazo) },
    { label: data.labelTotalInscricoes, value: String(data.totalInscricoes) },
    { label: 'Recursos interpostos', value: String(data.recursos.length) },
  ]
}

export function valoresDoRecurso(item: RelatorioRecursosItem, { ocultarProtocolo }: RelatorioRecursosData): string[] {
  const valores = [
    String(item.posicao),
    item.numero,
    item.nome,
    maskCpfCnpjParcial(item.cpfCnpj),
    formatarDataHora(item.protocoladoEm),
    item.situacao,
  ]
  return ocultarProtocolo ? valores.filter((_, i) => i !== POSICAO_PROTOCOLO) : valores
}

export function conclusao({ etapa, prazo, recursos, foraDoPrazo = 0, ocultarProtocolo }: RelatorioRecursosData): string {
  const total = recursos.length
  const janela = prazo
    ? ` — de ${formatarData(prazo.inicio)} a ${formatarDataPorExtenso(prazo.fim)} —`
    : ''

  if (total === 0) {
    return (
      `Encerrado o prazo recursal previsto no cronograma do edital para a etapa "${etapa}"${janela}, ` +
      'não consta recurso interposto nos registros da plataforma.'
    )
  }

  const semAfirmarPrazo = foraDoPrazo > 0 || ocultarProtocolo === true
  const abertura = semAfirmarPrazo
    ? `Encerrado o prazo recursal previsto no cronograma do edital para a etapa "${etapa}"`
    : `No prazo recursal previsto no cronograma do edital para a etapa "${etapa}"`
  const ressalva = foraDoPrazo > 0 ? `, dos quais ${foraDoPrazo} protocolado(s) fora desse prazo` : ''
  return `${abertura}${janela}, foram registrados ${total} recurso(s), relacionados acima${ressalva}.`
}

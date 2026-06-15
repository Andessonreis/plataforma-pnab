import type { EditalStatus } from '@prisma/client'
import type {
  CronogramaItem,
  CronogramaFormItem,
  CronogramaDisplayItem,
  CronogramaLegacyItem,
  CronogramaValidationWarning,
} from '@shared/types/cronograma'
import { CRONOGRAMA_FASES_ORDENADAS, CRONOGRAMA_FASES_FORMULARIO } from '@shared/types/cronograma'
import { editalCronogramaLabel } from '@shared/status-maps'
import { parseBrazilDateTime } from '@shared/utils/format'

// ── Normalização para fuzzy matching (reutilizada do scheduler) ─────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Patterns de labels legados → fase correspondente
const LEGACY_LABEL_TO_FASE: Array<{ patterns: string[]; fase: EditalStatus }> = [
  {
    fase: 'PUBLICADO',
    patterns: ['publicacao do edital', 'publicacao edital'],
  },
  {
    fase: 'INSCRICOES_ABERTAS',
    patterns: [
      'inicio das inscricoes',
      'inicio inscricoes',
      'abertura das inscricoes',
      'abertura inscricoes',
      'inscricoes abertas',
    ],
  },
  {
    fase: 'INSCRICOES_ENCERRADAS',
    patterns: [
      'encerramento das inscricoes',
      'encerramento inscricoes',
      'fim das inscricoes',
      'fim inscricoes',
      'inscricoes encerradas',
    ],
  },
  {
    fase: 'HABILITACAO',
    patterns: [
      'inicio da habilitacao',
      'inicio habilitacao',
      'habilitacao',
      'fase de habilitacao',
    ],
  },
  {
    fase: 'AVALIACAO',
    patterns: [
      'inicio da avaliacao',
      'inicio avaliacao',
      'avaliacao',
      'fase de avaliacao',
    ],
  },
  {
    fase: 'RESULTADO_PRELIMINAR',
    patterns: [
      'resultado preliminar',
      'publicacao do resultado preliminar',
      'publicacao resultado preliminar',
    ],
  },
  {
    fase: 'RECURSO',
    patterns: [
      'inicio da fase de recursos',
      'fase de recursos',
      'recursos',
      'inicio recursos',
    ],
  },
  {
    fase: 'RESULTADO_FINAL',
    patterns: [
      'resultado final',
      'publicacao do resultado final',
      'publicacao resultado final',
    ],
  },
  {
    fase: 'ENCERRADO',
    patterns: [
      'encerramento do edital',
      'encerramento edital',
      'encerramento',
    ],
  },
]

/**
 * Tenta identificar qual fase do edital um label legado representa.
 */
function matchLabelToFase(label: string): EditalStatus | null {
  const normalized = normalize(label)
  for (const entry of LEGACY_LABEL_TO_FASE) {
    if (entry.patterns.some((p) => normalized.includes(p))) {
      return entry.fase
    }
  }
  return null
}

// ── parseCronograma — converte qualquer formato para DisplayItem[] ──────────

/**
 * Converte cronograma (novo, legado ou string) para array de CronogramaDisplayItem.
 * Usado nas páginas públicas para renderizar o cronograma.
 */
export function parseCronograma(raw: unknown): CronogramaDisplayItem[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []

  return data
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && typeof item.dataHora === 'string',
    )
    .map((item): CronogramaDisplayItem => {
      // Formato novo com tipo 'fase'
      if (item.tipo === 'fase' && typeof item.fase === 'string') {
        return {
          label: editalCronogramaLabel[item.fase as EditalStatus] ?? String(item.fase),
          dataHora: String(item.dataHora),
          fase: item.fase as EditalStatus,
        }
      }
      // Formato novo com tipo 'custom' — admin marcou explicitamente como item
      // custom; NUNCA inferir fase por fuzzy match no label (causaria falso
      // "Em andamento", ex.: "Prazo para recurso da habilitação" casando com
      // o pattern 'habilitacao' e sendo tratado como a fase HABILITACAO).
      if (item.tipo === 'custom') {
        return {
          label: typeof item.label === 'string' ? item.label : '—',
          dataHora: String(item.dataHora),
          ...(typeof item.fimEm === 'string' && item.fimEm ? { fimEm: item.fimEm } : {}),
          ...(typeof item.acao === 'string' ? { acao: item.acao as CronogramaDisplayItem['acao'] } : {}),
        }
      }
      // Formato legado (sem campo `tipo`) — fuzzy match preserva comportamento antigo
      const legacyFase = typeof item.label === 'string' ? matchLabelToFase(item.label) : null
      return {
        label: typeof item.label === 'string' ? item.label : '—',
        dataHora: String(item.dataHora),
        ...(legacyFase ? { fase: legacyFase } : {}),
        ...(typeof item.fimEm === 'string' && item.fimEm ? { fimEm: item.fimEm } : {}),
      }
    })
    // PUBLICADO não aparece no cronograma — a publicação é ação manual do admin
    .filter((item) => item.fase !== 'PUBLICADO')
}

// ── parseCronogramaPublico — cronograma com "Publicação" baseado no status real

/**
 * Versão para páginas públicas: injeta "Publicação do Edital" com a data real
 * (publishedAt — preenchida quando o admin muda status de RASCUNHO para PUBLICADO).
 * Items de fase PUBLICADO do banco são sempre filtrados — a data real prevalece.
 */
export function parseCronogramaPublico(
  raw: unknown,
  editalStatus: EditalStatus,
  publishedAt: Date | string | null,
): CronogramaDisplayItem[] {
  const items = parseCronograma(raw)

  // Só mostra "Publicação do Edital" se o edital foi publicado (tem publishedAt)
  if (!publishedAt || editalStatus === 'RASCUNHO') return items

  const publicacaoItem: CronogramaDisplayItem = {
    label: editalCronogramaLabel.PUBLICADO,
    dataHora: typeof publishedAt === 'string' ? publishedAt : publishedAt.toISOString(),
    fase: 'PUBLICADO',
  }

  return [publicacaoItem, ...items]
}

// ── getNextDeadline — retorna o próximo item futuro ─────────────────────────

export function getNextDeadline(cronograma: unknown): CronogramaDisplayItem | null {
  const items = parseCronograma(cronograma)
  const now = new Date()

  const future = items
    .filter((item) => item.dataHora && parseBrazilDateTime(item.dataHora) > now)
    .sort((a, b) => parseBrazilDateTime(a.dataHora).getTime() - parseBrazilDateTime(b.dataHora).getTime())

  return future[0] ?? null
}

// ── getCronogramaItemStatus — status visual por ordem do cronograma ─────────

export type CronogramaItemStatus = 'past' | 'current' | 'future'

/**
 * Calcula o status visual de um item do cronograma baseado **na ordem do array
 * e nas datas**, não no status do edital. Regra:
 *
 *   - Se o item tem `fimEm` (janela): usa a janela explícita.
 *   - Caso contrário: o "fim" implícito é o início do próximo item com data.
 *   - Se for o último item (sem próximo): vira `past` assim que a data passa
 *     (marco pontual, ex.: ENCERRADO — nunca fica "em andamento" indefinido).
 *
 * Permite que items custom intercalados (ex.: "Publicação no Diário Oficial")
 * façam um item de fase anterior ficar `past`, mesmo que o status do edital
 * no banco ainda esteja na fase. Isso é proposital: o cronograma público
 * descreve marcos para o cidadão; o status do edital é uma máquina de estados
 * separada gerida pelo scheduler/admin.
 */
export function getCronogramaItemStatus(
  items: CronogramaDisplayItem[],
  index: number,
  now: Date = new Date(),
): CronogramaItemStatus {
  const item = items[index]
  if (!item) return 'future'

  const start = parseBrazilDateTime(item.dataHora)
  if (isNaN(start.getTime())) return 'future'

  if (item.fimEm) {
    const end = parseBrazilDateTime(item.fimEm)
    if (!isNaN(end.getTime())) {
      if (now < start) return 'future'
      if (now > end) return 'past'
      return 'current'
    }
  }

  if (now < start) return 'future'

  for (let i = index + 1; i < items.length; i++) {
    const nextStart = parseBrazilDateTime(items[i].dataHora)
    if (!isNaN(nextStart.getTime())) {
      return now >= nextStart ? 'past' : 'current'
    }
  }

  return 'past'
}

// ── isFaseCompleted — verifica se o edital já passou por uma fase ────────────

/**
 * Ordem completa de status incluindo RASCUNHO.
 * Usado para determinar se uma fase já foi concluída.
 */
const STATUS_ORDER: EditalStatus[] = [
  'RASCUNHO',
  ...CRONOGRAMA_FASES_ORDENADAS,
]

/**
 * Verifica se uma fase do cronograma foi efetivamente concluída,
 * baseando-se no status atual do edital (não apenas na data).
 *
 * Uma fase é "concluída" quando o edital já avançou ALÉM dela.
 * Ex: INSCRICOES_ABERTAS é concluído quando status > INSCRICOES_ABERTAS.
 */
export function isFaseCompleted(fase: EditalStatus, currentStatus: EditalStatus): boolean {
  const faseIndex = STATUS_ORDER.indexOf(fase)
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  if (faseIndex === -1 || currentIndex === -1) return false
  // ENCERRADO é terminal — se chegou nele, está concluído
  if (fase === 'ENCERRADO' && currentIndex === faseIndex) return true
  return currentIndex > faseIndex
}

/**
 * Verifica se o edital está ATUALMENTE nessa fase (em andamento).
 * ENCERRADO é estado terminal — nunca é "em andamento", vai direto pra concluído.
 */
export function isFaseCurrent(fase: EditalStatus, currentStatus: EditalStatus): boolean {
  if (fase === 'ENCERRADO') return false
  const faseIndex = STATUS_ORDER.indexOf(fase)
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  if (faseIndex === -1 || currentIndex === -1) return false
  return currentIndex === faseIndex
}

// ── migrateLegacyCronograma — converte formato antigo para novo ─────────────

/**
 * Converte cronograma legado (array de { label, dataHora })
 * para o formato novo (discriminated union com tipo 'fase' ou 'custom').
 *
 * Se o dado já está no formato novo (items com campo `tipo`), retorna como está.
 */
export function migrateLegacyCronograma(raw: unknown): CronogramaItem[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []

  // Se já está no formato novo (pelo menos um item tem campo `tipo`), retorna direto
  const hasNewFormat = data.some(
    (item) => typeof item === 'object' && item !== null && ('tipo' in item),
  )
  if (hasNewFormat) {
    return data as CronogramaItem[]
  }

  // Formato legado — converter
  const usedFases = new Set<EditalStatus>()
  const result: CronogramaItem[] = []

  for (const item of data as CronogramaLegacyItem[]) {
    if (!item.label || typeof item.label !== 'string') continue

    const fase = matchLabelToFase(item.label)
    // PUBLICADO não é fase do cronograma — migra como custom para não perder a info
    if (fase && fase !== 'PUBLICADO' && !usedFases.has(fase)) {
      usedFases.add(fase)
      result.push({
        tipo: 'fase',
        fase,
        dataHora: item.dataHora ?? '',
      })
    } else {
      result.push({
        tipo: 'custom',
        label: item.label,
        dataHora: item.dataHora ?? '',
      })
    }
  }

  return result
}

// ── Helpers para o formulário ───────────────────────────────────────────────

/**
 * Extrai as fases fixas de um cronograma (formato novo),
 * retornando um record de EditalStatus → { dataHora }.
 */
export function extractFases(
  cronograma: CronogramaItem[],
): Record<string, { dataHora: string }> {
  const fases: Record<string, { dataHora: string }> = {}

  for (const fase of CRONOGRAMA_FASES_ORDENADAS) {
    fases[fase] = { dataHora: '' }
  }

  for (const item of cronograma) {
    if (item.tipo === 'fase' && item.fase in fases) {
      fases[item.fase] = { dataHora: item.dataHora }
    }
  }

  return fases
}

/**
 * Extrai os items customizados de um cronograma (formato novo).
 */
export function extractCustomItems(
  cronograma: CronogramaItem[],
): Array<{ label: string; dataHora: string }> {
  return cronograma
    .filter((item): item is CronogramaItem & { tipo: 'custom' } => item.tipo === 'custom')
    .map((item) => ({
      label: item.label,
      dataHora: item.dataHora,
    }))
}

// ── Helpers para o novo CronogramaEditor (drag & drop) ──────────────────────

let _counter = 0

/** Gera ID efêmero único para @dnd-kit */
export function generateFormItemId(): string {
  return `cfi_${Date.now()}_${++_counter}`
}

/**
 * Converte dados salvos no banco (CronogramaItem[]) para formato do formulário
 * com IDs efêmeros. Preserva a ordem original.
 * Trata dados legados (sem campo `tipo`) via migrateLegacyCronograma.
 */
export function cronogramaToFormItems(raw: unknown): CronogramaFormItem[] {
  const items = migrateLegacyCronograma(raw)
  return items.map((item) => ({ ...item, id: generateFormItemId() }))
}

/**
 * Remove IDs efêmeros dos form items para salvar no banco.
 */
export function formItemsToCronograma(items: CronogramaFormItem[]): CronogramaItem[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = item
    return rest
  })
}

/**
 * Valida a ordem cronológica dos items do cronograma.
 * Usa a ORDEM VISUAL (posição no array / drag & drop) como referência:
 * cada item com data deve ter data >= ao item anterior com data.
 * Isso garante que reordenar via drag gera warnings se as datas ficarem inconsistentes.
 */
export function validateCronogramaOrder(
  items: CronogramaFormItem[],
): CronogramaValidationWarning[] {
  const warnings: CronogramaValidationWarning[] = []

  // Pega todos os items (fases + custom) que têm data preenchida, na ordem visual
  const itemsComData: { id: string; label: string; fase?: EditalStatus; date: Date }[] = []
  for (const item of items) {
    if (!item.dataHora?.trim()) continue
    const d = parseBrazilDateTime(item.dataHora)
    if (isNaN(d.getTime())) continue

    const label =
      item.tipo === 'fase'
        ? editalCronogramaLabel[item.fase]
        : (item.label || 'Etapa personalizada')

    itemsComData.push({
      id: item.id,
      label,
      fase: item.tipo === 'fase' ? item.fase : undefined,
      date: d,
    })
  }

  // Compara cada item com o anterior na ordem visual
  for (let i = 1; i < itemsComData.length; i++) {
    const atual = itemsComData[i]
    const anterior = itemsComData[i - 1]
    if (atual.date < anterior.date) {
      warnings.push({
        itemId: atual.id,
        fase: atual.fase,
        message: `${atual.label} deve ser posterior a ${anterior.label}`,
        anteriorFase: anterior.fase,
      })
    }
  }

  return warnings
}

/**
 * Filtra warnings para um item específico (por ID).
 */
export function getItemValidationWarnings(
  itemId: string,
  warnings: CronogramaValidationWarning[],
): CronogramaValidationWarning[] {
  return warnings.filter((w) => w.itemId === itemId)
}

/**
 * Validação server-side: mesma lógica da visual mas opera sobre CronogramaItem[] (sem IDs).
 * Valida pela ordem do array (= ordem visual salva).
 * Retorna array de mensagens de erro.
 */
export function validateCronogramaOrderServer(
  items: CronogramaItem[],
): string[] {
  const errors: string[] = []

  const itemsComData: { label: string; date: Date }[] = []
  for (const item of items) {
    if (!item.dataHora?.trim()) continue
    const d = parseBrazilDateTime(item.dataHora)
    if (isNaN(d.getTime())) continue

    const label =
      item.tipo === 'fase'
        ? editalCronogramaLabel[item.fase]
        : (item.label || 'Etapa personalizada')

    itemsComData.push({ label, date: d })
  }

  for (let i = 1; i < itemsComData.length; i++) {
    const atual = itemsComData[i]
    const anterior = itemsComData[i - 1]
    if (atual.date < anterior.date) {
      errors.push(`${atual.label} deve ser posterior a ${anterior.label}`)
    }
  }

  return errors
}

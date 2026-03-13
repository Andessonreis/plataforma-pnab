import type { EditalStatus } from '@prisma/client'
import type {
  CronogramaItem,
  CronogramaDisplayItem,
  CronogramaLegacyItem,
} from '@/types/cronograma'
import { CRONOGRAMA_FASES_ORDENADAS } from '@/types/cronograma'
import { editalCronogramaLabel } from '@/lib/status-maps'

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
    .map((item) => {
      // Formato novo com tipo 'fase'
      if (item.tipo === 'fase' && typeof item.fase === 'string') {
        return {
          label: editalCronogramaLabel[item.fase as EditalStatus] ?? String(item.fase),
          dataHora: String(item.dataHora),
          destaque: item.destaque === true,
          fase: item.fase as EditalStatus,
        }
      }
      // Formato novo com tipo 'custom' ou formato legado (tem label)
      const legacyFase = typeof item.label === 'string' ? matchLabelToFase(item.label) : null
      return {
        label: typeof item.label === 'string' ? item.label : '—',
        dataHora: String(item.dataHora),
        destaque: item.destaque === true,
        ...(legacyFase ? { fase: legacyFase } : {}),
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
    destaque: false,
    fase: 'PUBLICADO',
  }

  return [publicacaoItem, ...items]
}

// ── getNextDeadline — retorna o próximo item futuro ─────────────────────────

export function getNextDeadline(cronograma: unknown): CronogramaDisplayItem | null {
  const items = parseCronograma(cronograma)
  const now = new Date()

  const future = items
    .filter((item) => item.dataHora && new Date(item.dataHora) > now)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())

  return future[0] ?? null
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
  return currentIndex > faseIndex
}

/**
 * Verifica se o edital está ATUALMENTE nessa fase (em andamento).
 */
export function isFaseCurrent(fase: EditalStatus, currentStatus: EditalStatus): boolean {
  const faseIndex = STATUS_ORDER.indexOf(fase)
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  if (faseIndex === -1 || currentIndex === -1) return false
  return currentIndex === faseIndex
}

// ── migrateLegacyCronograma — converte formato antigo para novo ─────────────

/**
 * Converte cronograma legado (array de { label, dataHora, destaque })
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
        destaque: item.destaque ?? false,
      })
    } else {
      result.push({
        tipo: 'custom',
        label: item.label,
        dataHora: item.dataHora ?? '',
        destaque: item.destaque ?? false,
      })
    }
  }

  return result
}

// ── Helpers para o formulário ───────────────────────────────────────────────

/**
 * Extrai as fases fixas de um cronograma (formato novo),
 * retornando um record de EditalStatus → { dataHora, destaque }.
 */
export function extractFases(
  cronograma: CronogramaItem[],
): Record<string, { dataHora: string; destaque: boolean }> {
  const fases: Record<string, { dataHora: string; destaque: boolean }> = {}

  for (const fase of CRONOGRAMA_FASES_ORDENADAS) {
    fases[fase] = { dataHora: '', destaque: false }
  }

  for (const item of cronograma) {
    if (item.tipo === 'fase' && item.fase in fases) {
      fases[item.fase] = { dataHora: item.dataHora, destaque: item.destaque ?? false }
    }
  }

  return fases
}

/**
 * Extrai os items customizados de um cronograma (formato novo).
 */
export function extractCustomItems(
  cronograma: CronogramaItem[],
): Array<{ label: string; dataHora: string; destaque: boolean }> {
  return cronograma
    .filter((item): item is CronogramaItem & { tipo: 'custom' } => item.tipo === 'custom')
    .map((item) => ({
      label: item.label,
      dataHora: item.dataHora,
      destaque: item.destaque ?? false,
    }))
}

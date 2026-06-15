/**
 * Helpers de janela temporal para items custom do cronograma.
 *
 * Items custom podem ter uma `acao` (ex.: RECURSO_HABILITACAO_JANELA)
 * que indica que durante o período `[dataHora, fimEm]` aquela funcionalidade
 * está liberada. Sem `acao`, o item é apenas decorativo.
 *
 * Usado para gatear submissão de recursos (admin/proponente) e exibição
 * no UI.
 */

import type { AcaoJanela, CronogramaItem } from '@/types/cronograma'
import { migrateLegacyCronograma } from './cronograma'
import { parseBrazilDateTime } from './format'

export interface JanelaInfo {
  ativa: boolean
  inicio: Date
  fim: Date | null
  /** Próximo evento relevante: 'abrir' (futura), 'fechar' (em andamento), 'encerrada' (passada) */
  status: 'antes' | 'ativa' | 'depois'
}

/**
 * Localiza items do cronograma com a ação informada e retorna informação
 * sobre a janela mais relevante (a primeira que ainda não passou).
 * Se houver múltiplos itens com a mesma ação, considera o mais próximo
 * do `now`.
 *
 * Retorna null se não houver nenhum item com a ação.
 */
export function janelaParaAcao(
  cronograma: unknown,
  acao: AcaoJanela,
  now: Date = new Date(),
): JanelaInfo | null {
  const items = migrateLegacyCronograma(cronograma)
  const matches: { inicio: Date; fim: Date | null }[] = []

  for (const item of items) {
    if (item.tipo !== 'custom' || item.acao !== acao) continue
    if (!item.dataHora) continue

    const inicio = parseBrazilDateTime(item.dataHora)
    if (isNaN(inicio.getTime())) continue

    let fim: Date | null = null
    if (item.fimEm) {
      const f = parseBrazilDateTime(item.fimEm)
      if (!isNaN(f.getTime())) fim = f
    }

    matches.push({ inicio, fim })
  }

  if (matches.length === 0) return null

  // Ordena por início, escolhe a janela atualmente ativa OU a próxima futura
  matches.sort((a, b) => a.inicio.getTime() - b.inicio.getTime())

  const ativaAgora = matches.find((m) => isWithin(now, m.inicio, m.fim))
  if (ativaAgora) {
    return {
      ativa: true,
      inicio: ativaAgora.inicio,
      fim: ativaAgora.fim,
      status: 'ativa',
    }
  }

  const futura = matches.find((m) => m.inicio > now)
  if (futura) {
    return {
      ativa: false,
      inicio: futura.inicio,
      fim: futura.fim,
      status: 'antes',
    }
  }

  // Todas passadas — retorna a última (mais recente) pra UI mostrar "encerrada em X"
  const ultima = matches[matches.length - 1]
  return {
    ativa: false,
    inicio: ultima.inicio,
    fim: ultima.fim,
    status: 'depois',
  }
}

/**
 * Atalho booleano: a janela da ação está ativa agora?
 */
export function janelaAtiva(
  cronograma: unknown,
  acao: AcaoJanela,
  now: Date = new Date(),
): boolean {
  const info = janelaParaAcao(cronograma, acao, now)
  return info?.ativa === true
}

/**
 * Mensagem amigável sobre o estado da janela de uma ação.
 * Útil pra UI mostrar "Período de recurso encerra em DD/MM" etc.
 */
export function mensagemJanela(info: JanelaInfo): string {
  if (info.status === 'ativa') {
    if (info.fim) {
      return `Período aberto até ${formatarData(info.fim)}`
    }
    return 'Período aberto'
  }
  if (info.status === 'antes') {
    return `Período abre em ${formatarData(info.inicio)}`
  }
  // depois
  const refFim = info.fim ?? info.inicio
  return `Período encerrou em ${formatarData(refFim)}`
}

// ── Internos ────────────────────────────────────────────────────────────────

function isWithin(now: Date, inicio: Date, fim: Date | null): boolean {
  if (now < inicio) return false
  if (fim && now > fim) return false
  // Se não há fim, considera "ativa" só no exato início (caso de evento pontual)
  // — mas pra ações de janela isso é raramente útil. Itens sem fim são
  // tratados como pontuais: ativos apenas no minuto do início.
  if (!fim) {
    return now.getTime() === inicio.getTime()
  }
  return true
}

function formatarData(d: Date): string {
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Garantia de tipo: para uso em testes e helpers que recebem CronogramaItem[]
 * já parsed em vez de unknown.
 */
export function janelaParaAcaoFromItems(
  items: CronogramaItem[],
  acao: AcaoJanela,
  now: Date = new Date(),
): JanelaInfo | null {
  return janelaParaAcao(items, acao, now)
}

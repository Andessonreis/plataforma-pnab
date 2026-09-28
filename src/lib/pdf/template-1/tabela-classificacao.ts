import { SITUACAO_DA_LINHA, semNota } from '@/lib/pdf/modelo/lista-classificacao'
import type { LinhaClassificacao, ListaClassificacaoData } from '@/lib/pdf/modelo/tipos'
import type { ItensBonusConfig } from '@/types/bonus-config'
import type { ColunaTabela, EstiloCelula, LinhaTabela } from './tabela'
import { COLORS, LARGURA_UTIL } from './tema'

/**
 * Colunas e linhas da tabela de classificação da versão 1, com a bonificação
 * aberta em colunas (B1, B2, B3...). Servem à lista única por nota e às tabelas
 * de cada vaga, que precisam sair com as mesmas colunas.
 */

/** Nome curto de cada item de bonificação nos títulos de coluna e na legenda. */
const ROTULO_CURTO_BONUS: Record<string, string> = {
  genero_lgbtqia: 'Gênero/LGBTQIA+',
  etnico_racial: 'Étnico-racial',
  pcd: 'PcD',
}

function rotuloDoItem(item: ItensBonusConfig['itens'][number]): string {
  return ROTULO_CURTO_BONUS[item.key] ?? item.label
}

/** Soma máxima da bonificação: os `maxItens` itens de maior pontuação. */
export function tetoDoBonus(bonus: ItensBonusConfig): number {
  const pontos = bonus.itens.map((item) => item.pontos).sort((a, b) => b - a)
  const considerados = bonus.maxItens == null ? pontos : pontos.slice(0, bonus.maxItens)
  return considerados.reduce((soma, p) => soma + p, 0)
}

export function descreverCriterios(bonus: ItensBonusConfig, ligacao: ':' | ' ='): string {
  const itens = bonus.itens.map((item, i) => `B${i + 1}${ligacao} ${rotuloDoItem(item)} (+${item.pontos})`)
  return itens.join(' · ')
}

/** Pontos de cada item de bonificação na linha, respeitando o teto de itens. */
function pontosPorItem(linha: LinhaClassificacao, bonus: ItensBonusConfig): number[] {
  const marcados = bonus.itens
    .filter((item) => linha.bonusItens?.includes(item.key))
    .sort((a, b) => b.pontos - a.pontos)
  const validos = new Set((bonus.maxItens == null ? marcados : marcados.slice(0, bonus.maxItens)).map((i) => i.key))
  return bonus.itens.map((item) => (validos.has(item.key) ? item.pontos : 0))
}

/** `ultima` troca o título da coluna de situação (a tabela de suplentes mostra a modalidade ali). */
export function colunasDaTabela(data: ListaClassificacaoData, ultima = 'SITUAÇÃO'): ColunaTabela[] {
  const bonus = data.mostraBonus ? data.bonus ?? null : null
  const colunasBonus: ColunaTabela[] = bonus
    ? bonus.itens.map((_, i) => ({ label: `B${i + 1}`, width: 20, align: 'center' as const }))
    : data.mostraBonus ? [{ label: 'BÔNUS', width: 30, align: 'right' as const }] : []
  const media: ColunaTabela[] = data.mostraBonus ? [{ label: 'MÉDIA', width: 34, align: 'right' }] : []

  const fixas = 26 + 74 + 55 + 90.28 + media.reduce((s, c) => s + c.width, 0)
    + colunasBonus.reduce((s, c) => s + c.width, 0)
  return [
    { label: 'POS.', width: 26, align: 'center' },
    { label: 'INSCRIÇÃO', width: 74 },
    { label: 'PROPONENTE', width: LARGURA_UTIL - fixas },
    ...media,
    ...colunasBonus,
    { label: 'NOTA FINAL', width: 55, align: 'right' },
    { label: ultima, width: 90.28 },
  ]
}

export function linhaDaTabela(linha: LinhaClassificacao, data: ListaClassificacaoData, situacao?: string): LinhaTabela {
  const sem = semNota(linha)
  const classificada = linha.status === 'CONTEMPLADA'
  const bonus = data.mostraBonus ? data.bonus ?? null : null
  const destaque: EstiloCelula | undefined = classificada ? { cor: COLORS.sucesso, negrito: true } : undefined

  const valores = [sem ? '—' : `${linha.posicao}º`, linha.numero, linha.proponente]
  const celulas: (EstiloCelula | undefined)[] = [
    destaque, classificada ? { negrito: true } : undefined, classificada ? { negrito: true, sublinhado: true } : undefined,
  ]

  if (data.mostraBonus) {
    valores.push(sem ? '—' : linha.notaBase.toFixed(2))
    celulas.push(undefined)
    const pontos = bonus ? pontosPorItem(linha, bonus) : [linha.notaBonus]
    for (const p of pontos) {
      valores.push(sem ? '—' : String(p))
      celulas.push(p > 0 ? { cor: COLORS.brandDark, negrito: true } : { cor: COLORS.apagado })
    }
  }

  valores.push(sem ? '—' : linha.notaFinal.toFixed(2), situacao ?? SITUACAO_DA_LINHA[linha.status])
  celulas.push(destaque, destaque)

  return { valores, celulas, destaque: classificada ? COLORS.destaque : undefined }
}

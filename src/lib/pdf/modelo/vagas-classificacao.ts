/**
 * Separação da classificação de uma categoria pelas vagas que o edital reserva.
 *
 * Numa lista única por nota, o 4º colocado aparece suplente enquanto o 5º e o
 * 6º estão classificados, e quem lê não tem como saber que os dois entraram
 * pelas cotas. Aqui cada vaga (ampla concorrência e cada cota) vira um grupo com
 * as contempladas que a ocuparam, e o remanejamento de vaga de cota fica escrito
 * no próprio grupo. Sem PDFKit: as duas versões de layout podem desenhar.
 */
import { VAGA_AMPLA } from '@/lib/results/alocar-cotas'
import type { CategoriaClassificacao, LinhaClassificacao } from './tipos'

export interface GrupoDeVaga {
  titulo: string
  vagas: number
  /** Vagas de outra cota que vieram para este grupo pelo remanejamento. */
  recebidas: number
  linhas: LinhaClassificacao[]
  /** Remanejamento ou vaga que ficou vazia; nulo quando a vaga foi preenchida como previsto. */
  observacao: string | null
}

export interface ClassificacaoPorVaga {
  contempladas: GrupoDeVaga[]
  suplentes: LinhaClassificacao[]
  /** Desclassificadas, sem avaliação e fora da classificação. */
  demais: LinhaClassificacao[]
}

type Cota = CategoriaClassificacao['cotas'][number] & { key: string }

/** "Cotas Pessoas Negras" → "Pessoas Negras": o grupo já diz que é cota. */
export function nomeDaCota(label: string): string {
  return label.replace(/^cotas?\s+(para\s+)?/i, '')
}

function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

/** Como quem ocupa a vaga sem ter optado por aquela cota chegou lá. */
function descreverRemanejamento(cota: Cota, linhas: LinhaClassificacao[], cotas: Cota[]): string | null {
  const vindas = linhas.filter((l) => !l.cotasOptIn?.includes(cota.key))
  if (vindas.length === 0) return null

  const destinos = [...new Set(vindas.map((l) => {
    const outra = cotas.find((c) => c.key !== cota.key && l.cotasOptIn?.includes(c.key))
    return outra ? `à cota ${nomeDaCota(outra.label)}` : 'à ampla concorrência'
  }))]
  return `Não houve proposta apta optante desta cota. Como prevê o edital, a vaga foi destinada ${destinos.join(' e ')}.`
}

function observacaoDaCota(cota: Cota, linhas: LinhaClassificacao[], cotas: Cota[]): string | null {
  const vazias = cota.vagas - linhas.length
  const partes = [
    descreverRemanejamento(cota, linhas, cotas),
    vazias > 0 ? `${plural(vazias, 'vaga não preenchida', 'vagas não preenchidas')} por falta de proposta apta.` : null,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(' ') : null
}

/**
 * Agrupa a categoria por vaga. Devolve nulo quando não há o que separar — categoria sem cota com vaga, ou
 * contemplada sem a vaga registrada (dado montado antes da alocação saber dizer a vaga): nesses casos a lista
 * única por nota é a leitura correta.
 */
export function separarPorVaga(categoria: CategoriaClassificacao): ClassificacaoPorVaga | null {
  const cotas = categoria.cotas.filter((c): c is Cota => c.vagas > 0 && !!c.key)
  if (cotas.length === 0 || categoria.vagasAmplaConcorrencia == null) return null

  const contempladas = categoria.linhas.filter((l) => l.status === 'CONTEMPLADA')
  if (contempladas.some((l) => !l.vaga)) return null

  const ocupantes = (vaga: string) => contempladas.filter((l) => l.vaga === vaga)

  // Quem ocupa vaga remanejada aparece no grupo da modalidade em que se inscreveu (a outra cota ou a ampla); o
  // grupo que cedeu a vaga fica só com a observação.
  const grupoDaLinha = (l: LinhaClassificacao): string => {
    if (l.vaga === VAGA_AMPLA || l.cotasOptIn?.includes(l.vaga!)) return l.vaga!
    return cotas.find((c) => l.cotasOptIn?.includes(c.key))?.key ?? VAGA_AMPLA
  }
  const grupo = (chave: string, titulo: string, vagas: number, observacao: string | null): GrupoDeVaga => {
    const linhas = contempladas.filter((l) => grupoDaLinha(l) === chave)
    return { titulo, vagas, recebidas: linhas.filter((l) => l.vaga !== chave).length, linhas, observacao }
  }

  return {
    contempladas: [
      grupo(VAGA_AMPLA, 'Ampla concorrência', categoria.vagasAmplaConcorrencia, null),
      ...cotas.map((cota) => grupo(
        cota.key, `Cota — ${nomeDaCota(cota.label)}`, cota.vagas, observacaoDaCota(cota, ocupantes(cota.key), cotas),
      )),
    ],
    suplentes: categoria.linhas.filter((l) => l.status === 'SUPLENTE'),
    demais: categoria.linhas.filter((l) => l.status === 'NAO_CONTEMPLADA' || l.status === 'NAO_SE_APLICA'),
  }
}

/** Modalidades em que a suplente concorre — é o que decide em qual vaga ela pode ser chamada. */
export function modalidadesDaLinha(linha: LinhaClassificacao, cotas: CategoriaClassificacao['cotas']): string {
  const optadas = cotas.filter((c) => c.key && linha.cotasOptIn?.includes(c.key)).map((c) => nomeDaCota(c.label))
  return optadas.length === 0 ? 'Ampla concorrência' : `Ampla e cota ${optadas.join(', ')}`
}

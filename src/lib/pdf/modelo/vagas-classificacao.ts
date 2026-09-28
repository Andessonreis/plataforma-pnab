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

/** Explica por que quem ocupa a vaga não é optante daquela cota — sem isso a linha parece erro. */
function descreverRemanejamento(cota: Cota, linhas: LinhaClassificacao[], cotas: Cota[]): string | null {
  const vindas = linhas.filter((l) => !l.cotasOptIn?.includes(cota.key))
  if (vindas.length === 0) return null

  const nome = nomeDaCota(cota.label)
  const frases = vindas.map((l) => {
    const outra = cotas.find((c) => c.key !== cota.key && l.cotasOptIn?.includes(c.key))
    return outra
      ? `${l.proponente} (${l.numero}) é optante da cota ${nomeDaCota(outra.label)} e ocupa esta vaga porque o edital `
        + 'manda a vaga de cota sem inscrito apto primeiro para a outra categoria de cotas, na ordem de classificação.'
      : `${l.proponente} (${l.numero}) ocupa esta vaga pela ampla concorrência, porque o edital devolve à ampla `
        + 'concorrência a vaga de cota que não tem inscrito apto.'
  })
  return `Nenhuma proposta apta se inscreveu na cota ${nome}. ${frases.join(' ')}`
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
  const ampla = ocupantes(VAGA_AMPLA)

  return {
    contempladas: [
      {
        titulo: 'Ampla concorrência',
        vagas: categoria.vagasAmplaConcorrencia,
        linhas: ampla,
        observacao: null,
      },
      ...cotas.map((cota) => ({
        titulo: `Cota — ${nomeDaCota(cota.label)}`,
        vagas: cota.vagas,
        linhas: ocupantes(cota.key),
        observacao: observacaoDaCota(cota, ocupantes(cota.key), cotas),
      })),
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

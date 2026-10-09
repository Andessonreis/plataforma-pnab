import { diaEMes } from '../prazos'

const FUSO = 'America/Sao_Paulo'

export interface GrupoDoDia<T> {
  /** Data civil em Brasília (AAAA-MM-DD), estável para usar como chave. */
  chave: string
  /** "Hoje", "Ontem" ou o dia por extenso, para o título do grupo. */
  rotulo: string
  /** Complemento do rótulo relativo ("9 de outubro"); vazio quando o rótulo já é a data. */
  data: string
  dia: string
  mes: string
  itens: T[]
}

function chaveDoDia(data: Date): string {
  // en-CA formata como AAAA-MM-DD, o que dispensa montar a string à mão.
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(data)
}

function porExtenso(data: Date, comAno: boolean): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(comAno ? { year: 'numeric' } : {}),
    timeZone: FUSO,
  }).format(data)
}

/**
 * Agrupa avisos pelo dia em que chegaram, no fuso de Brasília. A lista já vem
 * ordenada do mais novo ao mais antigo, e a ordem dos grupos acompanha a
 * ordem de entrada: o agrupamento nunca reordena.
 */
export function agruparPorDia<T extends { createdAt: Date }>(itens: T[], agora: Date = new Date()): GrupoDoDia<T>[] {
  const hoje = chaveDoDia(agora)
  const ontem = chaveDoDia(new Date(agora.getTime() - 86_400_000))
  const anoAtual = hoje.slice(0, 4)
  const grupos = new Map<string, GrupoDoDia<T>>()

  for (const item of itens) {
    const chave = chaveDoDia(item.createdAt)
    let grupo = grupos.get(chave)
    if (!grupo) {
      const curta = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: FUSO }).format(item.createdAt)
      const extenso = porExtenso(item.createdAt, chave.slice(0, 4) !== anoAtual)
      const relativo = chave === hoje ? 'Hoje' : chave === ontem ? 'Ontem' : null
      grupo = {
        chave,
        rotulo: relativo ?? extenso.charAt(0).toUpperCase() + extenso.slice(1),
        data: relativo ? curta : '',
        ...diaEMes(item.createdAt, FUSO),
        itens: [],
      }
      grupos.set(chave, grupo)
    }
    grupo.itens.push(item)
  }

  return [...grupos.values()]
}

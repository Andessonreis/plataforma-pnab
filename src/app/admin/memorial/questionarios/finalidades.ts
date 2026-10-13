import { slugify } from '@/lib/utils/slug'

/**
 * Para que serve cada questionário, em palavras da equipe. O valor gravado
 * continua sendo o código (ex.: "memorial-agendamento"), porque é por ele que
 * o agendamento acha as perguntas extras.
 */
export interface Finalidade {
  valor: string
  rotulo: string
  explicacao: string
}

export const FINALIDADES: Finalidade[] = [
  {
    valor: 'memorial-agendamento',
    rotulo: 'Perguntas extras do pedido de visita',
    explicacao: 'Entram no formulário de agendamento do Memorial. Vale o publicado mais recente.',
  },
  {
    valor: 'memorial-pesquisa-visitante',
    rotulo: 'Pesquisa com visitantes',
    explicacao: 'Página própria, com endereço para enviar depois da visita.',
  },
]

export const FINALIDADE_OUTRA = 'outra'

/** Rótulo e explicação de uma finalidade; códigos criados à mão viram texto legível. */
export function descreverFinalidade(valor: string): Finalidade {
  const conhecida = FINALIDADES.find((f) => f.valor === valor)
  if (conhecida) return conhecida
  const legivel = valor.replace(/-/g, ' ').trim()
  return {
    valor,
    rotulo: legivel ? legivel.charAt(0).toUpperCase() + legivel.slice(1) : 'Sem uso definido',
    explicacao: 'Questionário com página própria.',
  }
}

/** Transforma o que a pessoa digitou no campo "outro uso" no código aceito pela API. */
export function codigoFinalidade(texto: string): string {
  return slugify(texto).slice(0, 80)
}

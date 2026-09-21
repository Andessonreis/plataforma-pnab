import type { ResultadoDivulgacao } from '@/types/divulgacao-habilitacao'

export interface Feedback {
  type: 'success' | 'error'
  text: string
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

/** "8 habilitadas e 2 inabilitadas"; só cita o lado que tem inscrição. */
export function descreverContagem(habilitadas: number, inabilitadas: number): string {
  const partes = [
    habilitadas > 0 ? pluralizar(habilitadas, 'habilitada', 'habilitadas') : null,
    inabilitadas > 0 ? pluralizar(inabilitadas, 'inabilitada', 'inabilitadas') : null,
  ].filter((parte): parte is string => parte !== null)

  return partes.length > 0 ? partes.join(' e ') : 'Nenhuma'
}

/**
 * Mensagem ao operador depois de divulgar. Falha de e-mail não desfaz a
 * divulgação, mas precisa de destaque para que alguém providencie o reenvio.
 */
export function descreverDivulgacao(resultado: ResultadoDivulgacao, enviouEmail: boolean): Feedback {
  const base =
    `Resultado divulgado: ${pluralizar(resultado.divulgadas, 'inscrição', 'inscrições')} ` +
    `(${descreverContagem(resultado.habilitadas, resultado.inabilitadas)}).`

  if (!enviouEmail) return { type: 'success', text: `${base} Nenhum e-mail foi enviado.` }

  const { enfileirados, falhas } = resultado.emails
  if (falhas === 0) {
    return {
      type: 'success',
      text: `${base} ${pluralizar(enfileirados, 'e-mail entrou', 'e-mails entraram')} na fila de envio.`,
    }
  }

  return {
    type: 'error',
    text:
      `${base} ${pluralizar(falhas, 'e-mail não entrou', 'e-mails não entraram')} na fila de envio. ` +
      'O resultado já está divulgado; avise a equipe técnica para reenviar.',
  }
}

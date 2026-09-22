/** Situação da divulgação do resultado da habilitação de um edital. */
export interface ResumoDivulgacao {
  aDivulgar: { habilitadas: number; inabilitadas: number; total: number }
  jaDivulgadas: number
  /** Ainda sem decisão da equipe — ficam de fora da divulgação. */
  emConferencia: number
}

/** O que uma divulgação efetivamente fez. */
export interface ResultadoDivulgacao {
  divulgadas: number
  habilitadas: number
  inabilitadas: number
  emails: { enfileirados: number; falhas: number }
}

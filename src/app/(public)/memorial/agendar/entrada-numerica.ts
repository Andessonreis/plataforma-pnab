import type { KeyboardEvent } from 'react'

/**
 * Campos de número inteiro do pedido (pessoas, idades). Usam `type="text"` com teclado
 * numérico em vez de `type="number"`, que aceita "-", "e", vírgula e ponto e muda o
 * valor com a roda do mouse. A validação de verdade continua no schema da API.
 */

const TECLAS_BLOQUEADAS = new Set(['-', '+', 'e', 'E', ',', '.'])

export function bloquearNaoNumerico(e: KeyboardEvent<HTMLInputElement>) {
  if (TECLAS_BLOQUEADAS.has(e.key)) e.preventDefault()
}

/** Fica só com os dígitos (cobre colar texto) e limita o tamanho. */
export function apenasDigitos(valor: string, maxDigitos = 3): string {
  return valor.replace(/\D/g, '').slice(0, maxDigitos)
}

export const PROPS_NUMERICO = {
  type: 'text',
  inputMode: 'numeric',
  pattern: '[0-9]*',
  autoComplete: 'off',
  onKeyDown: bloquearNaoNumerico,
} as const

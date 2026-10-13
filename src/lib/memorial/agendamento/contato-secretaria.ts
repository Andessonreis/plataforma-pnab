import { z } from 'zod'

/**
 * Ponte entre o agendamento e a página "Falar com a Secretaria" (/contato), para quem
 * precisa mudar algo no pedido sem depender de abrir o próprio e-mail. O link leva só
 * um marcador fixo e o protocolo; o assunto é montado aqui, nunca copiado da URL.
 */

const TEMA_VISITA = 'memorial-visita'

/** Mesmo formato gerado por generateProtocolo('MEM'): MEM-2026-A1B2C3. */
const PROTOCOLO_MEMORIAL = /^MEM-\d{4}-[A-Z0-9]{6}$/

export function linkFalarComSecretaria(protocolo?: string): string {
  const params = new URLSearchParams({ assunto: TEMA_VISITA })
  if (protocolo) params.set('protocolo', protocolo)
  return `/contato?${params.toString()}#formulario-contato`
}

const prefillSchema = z.object({
  assunto: z.literal(TEMA_VISITA),
  protocolo: z.string().regex(PROTOCOLO_MEMORIAL).optional().catch(undefined),
})

/**
 * Assunto pré-preenchido do formulário de contato a partir da query string, ou vazio
 * quando ela não veio deste fluxo. Valores fora do formato esperado são descartados.
 */
export function assuntoPreenchido(params: Record<string, string | string[] | undefined>): string {
  const lido = prefillSchema.safeParse({ assunto: params.assunto, protocolo: params.protocolo })
  if (!lido.success) return ''
  return lido.data.protocolo
    ? `Agendamento de visita ao Memorial — protocolo ${lido.data.protocolo}`
    : 'Agendamento de visita ao Memorial'
}

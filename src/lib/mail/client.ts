import { Resend } from 'resend'

let cached: Resend | null = null

function getResend(): Resend {
  if (cached) return cached
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('[mail] RESEND_API_KEY não configurada')
  }
  cached = new Resend(apiKey)
  return cached
}

// Reseta o singleton — útil em testes que precisam re-mockar a key.
export function __resetResendClient() {
  cached = null
}

export interface SendOptions {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}

export async function sendViaResend(options: SendOptions): Promise<{ id: string }> {
  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error('[mail] EMAIL_FROM não configurado')
  }

  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  })

  if (error) {
    const name = error.name ?? 'ResendError'
    const message = error.message ?? 'Falha ao enviar e-mail'
    throw new Error(`[mail] ${name}: ${message}`)
  }
  if (!data?.id) {
    throw new Error('[mail] Resend retornou sem id de envio')
  }
  return { id: data.id }
}

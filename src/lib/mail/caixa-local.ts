import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { SendOptions } from './client'

/**
 * Caixa de saída local, só para desenvolvimento: com `EMAIL_DEV_OUTBOX` apontando para
 * uma pasta, cada e-mail vira um par .html/.json nela em vez de ir para o Resend. Serve
 * para conferir o conteúdo sem chave de API nem risco de mandar mensagem a alguém real.
 * Em produção a variável é ignorada.
 */
export function pastaCaixaLocal(): string | null {
  if (process.env.NODE_ENV === 'production') return null
  return process.env.EMAIL_DEV_OUTBOX?.trim() || null
}

export async function gravarNaCaixaLocal(pasta: string, options: SendOptions): Promise<{ id: string }> {
  const id = `local-${Date.now()}-${randomUUID().slice(0, 8)}`
  await mkdir(pasta, { recursive: true })
  const { html, attachments, ...resto } = options
  await Promise.all([
    writeFile(path.join(pasta, `${id}.html`), html, 'utf8'),
    writeFile(
      path.join(pasta, `${id}.json`),
      JSON.stringify({ ...resto, anexos: attachments?.map((a) => a.filename) ?? [] }, null, 2),
      'utf8',
    ),
  ])
  return { id }
}

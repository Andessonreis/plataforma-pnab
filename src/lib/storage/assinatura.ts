import { createHmac, timingSafeEqual } from 'node:crypto'

function segredo(): string {
  const valor = process.env.AUTH_SECRET
  if (!valor) throw new Error('AUTH_SECRET é obrigatório para assinar URLs de arquivos')
  return valor
}

function calcular(bucket: string, caminho: string, expiraEm: number): string {
  return createHmac('sha256', segredo()).update(`${bucket}\n${caminho}\n${expiraEm}`).digest('hex')
}

export function assinar(bucket: string, caminho: string, expiraEm: number): string {
  return calcular(bucket, caminho, expiraEm)
}

export function assinaturaValida(
  bucket: string,
  caminho: string,
  expiraEm: number,
  assinatura: string,
): boolean {
  if (!Number.isFinite(expiraEm) || expiraEm < Date.now() / 1000) return false
  const esperada = Buffer.from(calcular(bucket, caminho, expiraEm))
  const recebida = Buffer.from(assinatura)
  return esperada.length === recebida.length && timingSafeEqual(esperada, recebida)
}

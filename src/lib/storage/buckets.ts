/**
 * Buckets do armazenamento em disco. Cada bucket é uma pasta dentro de UPLOAD_DIR.
 * - público: servido sem assinatura (conteúdo institucional)
 * - privado: só abre com URL assinada (anexos de proponentes)
 */
export const BUCKETS = {
  editais: { publico: true },
  manuais: { publico: true },
  propostas: { publico: false },
  memorial: { publico: true },
} as const

export type BucketName = keyof typeof BUCKETS

export function isBucket(nome: string): nome is BucketName {
  return Object.prototype.hasOwnProperty.call(BUCKETS, nome)
}

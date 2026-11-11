import type { UserRole } from '@prisma/client'
import { megabytes } from '@/lib/upload/imagem'

/**
 * Regras dos Manuais e Documentos usadas pelo painel (checagem rápida no navegador)
 * e pela API (checagem definitiva, que ainda confere a assinatura de bytes).
 */

/** Quem gerencia os manuais. SUPER_ADMIN passa sozinho em requireRole. */
export const ROLES_MANUAIS: UserRole[] = ['ADMIN', 'COMUNICACAO']

/** Imagens aceitas (logos, réguas de marca). SVG fica de fora: o arquivo pode carregar script. */
export const EXTENSOES_IMAGEM = ['png', 'jpg', 'jpeg', 'webp'] as const

export const EXTENSOES_MANUAL = ['pdf', 'doc', 'docx', 'xls', 'xlsx', ...EXTENSOES_IMAGEM] as const
export type ExtensaoManual = (typeof EXTENSOES_MANUAL)[number]

export const MAX_BYTES_MANUAL = 20 * 1024 * 1024

export const ROTULO_FORMATOS_MANUAL = `PDF, DOC, DOCX, XLS, XLSX, PNG, JPG ou WEBP, até ${megabytes(MAX_BYTES_MANUAL)} MB`

/** Atributo `accept` do campo de arquivo. */
export const ACCEPT_MANUAL = EXTENSOES_MANUAL.map((e) => `.${e}`).join(',')

export const ENDPOINT_MANUAIS = '/api/v1/manuais'

export function extensaoDoArquivo(nome: string): string {
  const ponto = nome.lastIndexOf('.')
  return ponto === -1 ? '' : nome.slice(ponto + 1).toLowerCase()
}

export function isExtensaoManual(ext: string): ext is ExtensaoManual {
  return (EXTENSOES_MANUAL as readonly string[]).includes(ext)
}

/** Aceita nome de arquivo ou URL: o que importa é o trecho depois do último ponto. */
export function isImagemManual(nomeOuUrl: string): boolean {
  return (EXTENSOES_IMAGEM as readonly string[]).includes(extensaoDoArquivo(nomeOuUrl))
}

/** Motivo para recusar o arquivo, ou `undefined` se extensão e tamanho servem. */
export function problemaDoArquivoManual(file: { name: string; size: number }): string | undefined {
  if (!isExtensaoManual(extensaoDoArquivo(file.name))) return `Formato não aceito. Use ${ROTULO_FORMATOS_MANUAL}.`
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > MAX_BYTES_MANUAL) return `O arquivo deve ter no máximo ${megabytes(MAX_BYTES_MANUAL)} MB.`
  return undefined
}

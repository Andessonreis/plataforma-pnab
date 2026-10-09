import { MAX_BYTES_MEMORIAL, UPLOAD_MEMORIAL, megabytesMemorial, type PastaUploadMemorial } from '@/lib/memorial/midia'
import { isImagemMime } from '@/lib/upload/imagem'

/** Motivo para recusar o arquivo antes de enviar, ou `undefined` se ele serve. */
export function problemaDoArquivo(file: File): string | undefined {
  if (!isImagemMime(file.type)) return 'Formato não aceito (use JPG, PNG ou WEBP).'
  if (file.size > MAX_BYTES_MEMORIAL) return `Maior que ${megabytesMemorial} MB.`
  return undefined
}

export type ResultadoEnvio = { url: string } | { erro: string }

/**
 * Sobe uma imagem para o armazenamento do Memorial informando o percentual enviado.
 * XMLHttpRequest em vez de fetch porque só ele expõe o progresso do upload.
 */
export function enviarImagem(file: File, pasta: PastaUploadMemorial, aoProgredir?: (pct: number) => void): Promise<ResultadoEnvio> {
  return new Promise((resolve) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('pasta', pasta)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_MEMORIAL)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) aoProgredir?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      const json = xhr.response ?? {}
      if (xhr.status >= 200 && xhr.status < 300 && json.data?.url) resolve({ url: json.data.url })
      else resolve({ erro: json.message ?? 'Falha no envio.' })
    }
    xhr.onerror = () => resolve({ erro: 'Sem conexão durante o envio.' })
    xhr.send(fd)
  })
}

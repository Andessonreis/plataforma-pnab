'use client'

import { useState } from 'react'

export interface AnexoLocal {
  file: File
  url?: string
  status: 'pendente' | 'enviando' | 'ok' | 'erro'
  error?: string
}

export const MAX_ARQUIVOS = 5
const ALLOWED_MIMES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_FILE_SIZE = 10 * 1024 * 1024

/** Erro de upload de uma evidência específica — mensagem já pronta pra exibir ao usuário. */
export class EvidenciaUploadError extends Error {}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Fila local de evidências (arquivos) do recurso: seleção com validação de
 * tamanho/formato, remoção e upload sob demanda (chamado na submissão do form).
 */
export function useRecursoEvidencias(inscricaoId: string) {
  const [anexos, setAnexos] = useState<AnexoLocal[]>([])
  const [limiteError, setLimiteError] = useState<string | null>(null)

  function addFiles(list: FileList | File[]) {
    const arr = Array.from(list)
    if (arr.length === 0) return
    setLimiteError(null)

    const livres = MAX_ARQUIVOS - anexos.length
    if (livres <= 0) {
      setLimiteError(`Máximo de ${MAX_ARQUIVOS} evidências por recurso.`)
      return
    }

    const toAdd = arr.slice(0, livres).map<AnexoLocal>((file) => {
      if (file.size > MAX_FILE_SIZE) return { file, status: 'erro', error: 'Excede 10MB' }
      if (!ALLOWED_MIMES.includes(file.type)) return { file, status: 'erro', error: 'Formato não permitido' }
      return { file, status: 'pendente' }
    })
    setAnexos((prev) => [...prev, ...toAdd])
  }

  function removeAnexo(index: number) {
    setAnexos((prev) => prev.filter((_, idx) => idx !== index))
  }

  /**
   * Envia as evidências ainda não enviadas e retorna todas as URLs (já
   * enviadas + novas), na ordem original. Lança `EvidenciaUploadError` na
   * primeira falha — a fila local já fica marcada com o erro por item.
   */
  async function uploadPendentes(): Promise<string[]> {
    const urls: string[] = []
    const next = [...anexos]

    for (let i = 0; i < next.length; i++) {
      const anexo = next[i]
      if (anexo.status === 'ok' && anexo.url) {
        urls.push(anexo.url)
        continue
      }
      if (anexo.status === 'erro') continue

      next[i] = { ...anexo, status: 'enviando' }
      setAnexos([...next])

      const form = new FormData()
      form.append('file', anexo.file)
      const res = await fetch(`/api/proponente/inscricoes/${inscricaoId}/recurso/anexos`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()

      if (!res.ok || !data.url) {
        next[i] = { ...anexo, status: 'erro', error: data.message ?? 'Falha no envio' }
        setAnexos([...next])
        throw new EvidenciaUploadError(`Falha ao enviar "${anexo.file.name}": ${data.message ?? 'erro desconhecido'}`)
      }

      next[i] = { ...anexo, status: 'ok', url: data.url }
      setAnexos([...next])
      urls.push(data.url)
    }

    return urls
  }

  return { anexos, limiteError, addFiles, removeAnexo, uploadPendentes }
}

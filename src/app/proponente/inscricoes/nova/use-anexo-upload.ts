'use client'

import { useState } from 'react'
import {
  validateAnexoFile,
  describeValidationError,
} from '@/lib/upload/anexo-config'

interface UseAnexoUploadParams {
  onUpload: (file: File, tipo: string, titulo: string) => Promise<boolean>
}

// Estado e lógica de seleção/validação/envio de múltiplos arquivos de anexo.
// Validação client-side (#78) roda antes do upload — tamanho + tipo — para
// dar feedback imediato sem depender de round-trip ao servidor.
export function useAnexoUpload({ onUpload }: UseAnexoUploadParams) {
  const [tipo, setTipo] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState('')
  const [localSuccess, setLocalSuccess] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list)
    if (arr.length === 0) return
    setLocalSuccess('')

    const aceitos: File[] = []
    const rejeitados: string[] = []
    for (const f of arr) {
      const err = validateAnexoFile(f)
      if (err) {
        rejeitados.push(describeValidationError(err))
      } else {
        aceitos.push(f)
      }
    }

    if (rejeitados.length > 0) {
      setLocalError(rejeitados.join(' '))
    } else {
      setLocalError('')
    }

    if (aceitos.length > 0) {
      setFiles((prev) => [...prev, ...aceitos])
    }
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (files.length === 0 || !tipo) return
    setLocalError('')
    setLocalSuccess('')

    let enviados = 0
    const falhas: string[] = []
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length })
      const f = files[i]
      const titulo = f.name.replace(/\.[^.]+$/, '')
      const ok = await onUpload(f, tipo, titulo)
      if (ok) enviados++
      else falhas.push(f.name)
    }
    setProgress(null)

    if (falhas.length === 0) {
      setLocalSuccess(
        enviados === 1
          ? 'Arquivo enviado com sucesso!'
          : `${enviados} arquivos enviados com sucesso!`,
      )
      setTimeout(() => setLocalSuccess(''), 4000)
      setFiles([])
      setTipo('')
    } else {
      setLocalError(
        `Falha no envio de ${falhas.length} arquivo(s): ${falhas.join(', ')}. Verifique os arquivos e tente novamente.`,
      )
      // mantém os arquivos falhos pra o usuário reenviar
      setFiles((prev) => prev.filter((f) => falhas.includes(f.name)))
    }
  }

  return {
    tipo,
    setTipo,
    files,
    localError,
    localSuccess,
    progress,
    addFiles,
    removeFile,
    handleSubmit,
  }
}

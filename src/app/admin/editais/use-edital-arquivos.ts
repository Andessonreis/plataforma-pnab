import { useState, useEffect, useRef, useImperativeHandle, type Ref } from 'react'
import { EDITAL_DOCUMENT_DEFAULT_TYPES } from '@/lib/constants/attachment-types'
import type { Arquivo, PendingFile, TipoOption } from './edital-arquivos-types'
import { stripExtension, validateArquivoFile } from './edital-arquivos-utils'

export interface EditalArquivosHandle {
  /** Envia os arquivos pendentes para o edital recém-criado. Retorna número de erros. */
  uploadPending: (editalId: string) => Promise<number>
  /** Retorna true se há arquivos na fila aguardando envio */
  hasPending: () => boolean
}

let localIdCounter = 0

/** Estado, carregamento e handlers de upload/remoção do painel de arquivos do edital. */
export function useEditalArquivos(editalId: string | undefined, ref: Ref<EditalArquivosHandle>) {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [pending, setPending] = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(!!editalId)
  const [error, setError] = useState<string | null>(null)

  const [tipoOptions, setTipoOptions] = useState<TipoOption[]>(
    EDITAL_DOCUMENT_DEFAULT_TYPES.map((t) => ({ value: t.value, label: t.label })),
  )
  const [tipo, setTipo] = useState(EDITAL_DOCUMENT_DEFAULT_TYPES[0]?.value ?? '')
  const [titulo, setTitulo] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carrega tipos de documento do edital via API
  useEffect(() => {
    async function loadTipos() {
      try {
        const res = await fetch('/api/admin/configuracoes/tipos-anexo')
        if (res.ok) {
          const json = await res.json()
          const tipos: { tipo: string; label: string }[] = json.data ?? json.tipos ?? []
          if (tipos.length > 0) {
            const opts = tipos.map((t) => ({ value: t.tipo, label: t.label }))
            setTipoOptions(opts)
            setTipo((prev) => {
              // Manter seleção atual se ainda válida, senão usar o primeiro
              if (opts.some((o) => o.value === prev)) return prev
              return opts[0].value
            })
          }
        }
      } catch {
        // Fallback silencioso — usa EDITAL_DOCUMENT_DEFAULT_TYPES
      }
    }
    loadTipos()
  }, [])

  // Carrega arquivos existentes quando há editalId
  useEffect(() => {
    if (!editalId) return
    async function load() {
      try {
        const res = await fetch(`/api/admin/editais/arquivos?editalId=${editalId}`)
        if (res.ok) {
          const json = await res.json()
          setArquivos(json.data)
        }
      } catch {
        // silencioso no carregamento inicial
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [editalId])

  // Expõe métodos para o componente pai
  useImperativeHandle(ref, () => ({
    hasPending: () => pending.length > 0,
    uploadPending: async (targetEditalId: string) => {
      let errors = 0
      for (const item of pending) {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('editalId', targetEditalId)
        formData.append('tipo', item.tipo)
        formData.append('titulo', item.titulo)

        try {
          const res = await fetch('/api/admin/editais/arquivos', {
            method: 'POST',
            body: formData,
          })
          if (!res.ok) errors++
        } catch {
          errors++
        }
      }
      setPending([])
      return errors
    },
  }))

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Selecione um arquivo.')
      return
    }

    const validationError = validateArquivoFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)

    const tituloFinal = titulo.trim() || stripExtension(file.name)

    // Modo criação — enfileira localmente
    if (!editalId) {
      const localId = `pending-${++localIdCounter}`
      setPending((prev) => [...prev, { localId, file, titulo: tituloFinal, tipo }])
      setTitulo('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Modo edição — envia direto
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('editalId', editalId)
      formData.append('tipo', tipo)
      formData.append('titulo', tituloFinal)

      const res = await fetch('/api/admin/editais/arquivos', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao fazer upload.')
        return
      }

      setArquivos((prev) => [data, ...prev])
      setTitulo('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja remover este arquivo?')) return

    try {
      const res = await fetch(`/api/admin/editais/arquivos?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArquivos((prev) => prev.filter((a) => a.id !== id))
      } else {
        const data = await res.json()
        setError(data.message || 'Erro ao remover arquivo.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    }
  }

  function handleRemovePending(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId))
  }

  return {
    arquivos,
    pending,
    uploading,
    loading,
    error,
    tipoOptions,
    tipo,
    setTipo,
    titulo,
    setTitulo,
    fileInputRef,
    handleUpload,
    handleDelete,
    handleRemovePending,
  }
}

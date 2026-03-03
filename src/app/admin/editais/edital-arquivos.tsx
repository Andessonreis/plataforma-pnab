'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Card, Button, Badge, Select, Input, EmptyState } from '@/components/ui'
import { IconDocument, IconPlus, IconPdf } from '@/components/ui'

interface Arquivo {
  id: string
  titulo: string
  tipo: string
  url: string
}

interface PendingFile {
  localId: string
  file: File
  titulo: string
  tipo: string
}

export interface EditalArquivosHandle {
  /** Envia os arquivos pendentes para o edital recém-criado. Retorna número de erros. */
  uploadPending: (editalId: string) => Promise<number>
  /** Retorna true se há arquivos na fila aguardando envio */
  hasPending: () => boolean
}

interface EditalArquivosProps {
  editalId?: string
}

const tipoOptions = [
  { value: 'PDF', label: 'PDF do Edital' },
  { value: 'ANEXO', label: 'Anexo' },
  { value: 'MODELO', label: 'Modelo' },
  { value: 'PLANILHA', label: 'Planilha' },
  { value: 'DECLARACAO', label: 'Declaração' },
]

const tipoBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'error'> = {
  PDF: 'error',
  ANEXO: 'info',
  MODELO: 'neutral',
  PLANILHA: 'success',
  DECLARACAO: 'warning',
}

let localIdCounter = 0

export const EditalArquivos = forwardRef<EditalArquivosHandle, EditalArquivosProps>(
  function EditalArquivos({ editalId }, ref) {
    const [arquivos, setArquivos] = useState<Arquivo[]>([])
    const [pending, setPending] = useState<PendingFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(!!editalId)
    const [error, setError] = useState<string | null>(null)

    const [tipo, setTipo] = useState('PDF')
    const [titulo, setTitulo] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    // Validação local do arquivo selecionado
    function validateFile(file: File): string | null {
      const allowedMime = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]
      if (!allowedMime.includes(file.type)) {
        return 'Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG, XLSX.'
      }
      if (file.size > 10 * 1024 * 1024) {
        return 'O arquivo deve ter no máximo 10 MB.'
      }
      return null
    }

    async function handleUpload() {
      const file = fileInputRef.current?.files?.[0]
      if (!file) {
        setError('Selecione um arquivo.')
        return
      }
      if (!titulo.trim()) {
        setError('Informe o título do documento.')
        return
      }

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)

      // Modo criação — enfileira localmente
      if (!editalId) {
        const localId = `pending-${++localIdCounter}`
        setPending((prev) => [...prev, { localId, file, titulo: titulo.trim(), tipo }])
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
        formData.append('titulo', titulo.trim())

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

    const hasItems = arquivos.length > 0 || pending.length > 0

    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Documentos e Anexos</h2>

        {/* Zona de upload */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Título do documento"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Edital completo"
            />
            <Select
              label="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              options={tipoOptions}
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Arquivo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx"
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              loading={uploading}
              className="whitespace-nowrap"
            >
              <IconPlus className="h-4 w-4 mr-1" />
              {editalId ? 'Enviar' : 'Adicionar'}
            </Button>
          </div>

          {!editalId && pending.length > 0 && (
            <p className="text-xs text-slate-500">
              Os arquivos serão enviados automaticamente ao salvar o edital.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
        </div>

        {/* Lista de arquivos pendentes (modo criação) */}
        {pending.length > 0 && (
          <ul className="divide-y divide-slate-100 mb-2">
            {pending.map((item) => (
              <li key={item.localId} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <IconPdf className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.titulo}</p>
                    <p className="text-xs text-slate-400 truncate">{item.file.name}</p>
                  </div>
                  <Badge variant={tipoBadgeVariant[item.tipo] ?? 'neutral'}>
                    {tipoOptions.find((t) => t.value === item.tipo)?.label ?? item.tipo}
                  </Badge>
                  <Badge variant="warning">Pendente</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePending(item.localId)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] inline-flex items-center justify-center shrink-0"
                  aria-label={`Remover ${item.titulo}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Lista de arquivos salvos (modo edição) */}
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Carregando arquivos...</p>
        ) : !hasItems ? (
          <EmptyState
            icon={<IconDocument className="h-8 w-8" />}
            title="Nenhum documento anexado"
            description="Adicione PDFs, anexos e modelos usando o formulário acima."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {arquivos.map((arq) => (
              <li key={arq.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <IconPdf className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{arq.titulo}</p>
                  </div>
                  <Badge variant={tipoBadgeVariant[arq.tipo] ?? 'neutral'}>
                    {tipoOptions.find((t) => t.value === arq.tipo)?.label ?? arq.tipo}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={arq.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(arq.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                    aria-label={`Remover ${arq.titulo}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    )
  },
)

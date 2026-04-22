'use client'

import { useEffect, useState } from 'react'
import { IconDownload, IconDocument } from '@/components/ui/icons'

interface ArquivoBasico {
  id: string
  titulo: string
  url: string
  tipo: string
}

interface Props {
  editalId?: string
}

/**
 * Upload opcional e rápido do PDF oficial do edital, na Seção 1 (Informações Básicas).
 * Usa o mesmo endpoint e tipo (PDF_EDITAL) do componente EditalArquivos (Seção 7).
 * Se o admin não quiser subir agora, basta ignorar — dá pra fazer depois na Seção 7.
 */
export function PdfOficialField({ editalId }: Props) {
  const [atual, setAtual] = useState<ArquivoBasico | null>(null)
  const [loading, setLoading] = useState<boolean>(!!editalId)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!editalId) return
    let canceled = false
    fetch(`/api/admin/editais/arquivos?editalId=${editalId}`)
      .then((r) => r.json())
      .then((data) => {
        if (canceled) return
        const arr = (data.data ?? data.arquivos ?? []) as ArquivoBasico[]
        const pdf = arr.find((a) => a.tipo === 'PDF_EDITAL')
        setAtual(pdf ?? null)
      })
      .catch(() => {})
      .finally(() => !canceled && setLoading(false))
    return () => { canceled = true }
  }, [editalId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editalId) return

    setErro(null)
    setUploading(true)
    try {
      // Remove o PDF oficial anterior (se houver) pra garantir "só 1 PDF oficial"
      if (atual) {
        await fetch(`/api/admin/editais/arquivos?id=${atual.id}`, { method: 'DELETE' })
      }
      const form = new FormData()
      form.append('file', file)
      form.append('editalId', editalId)
      form.append('tipo', 'PDF_EDITAL')
      form.append('titulo', 'Edital Completo (PDF)')
      const res = await fetch('/api/admin/editais/arquivos', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.message ?? 'Falha no upload.')
        return
      }
      setAtual(data.arquivo ?? data)
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setUploading(false)
    }
  }

  if (!editalId) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">PDF Oficial do Edital (opcional)</p>
        <p className="text-xs mt-1">
          Salve o edital primeiro. Depois você pode subir o PDF assinado aqui ou na Seção 7 (Documentos e Arquivos).
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-800 flex items-center gap-1.5">
            <IconDocument className="h-4 w-4 text-slate-400" />
            PDF Oficial do Edital
            <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Atalho para subir o PDF assinado. Aparece como botão &ldquo;Baixar Edital Completo&rdquo; na página pública.
            Os demais anexos (modelos, declarações) ficam na Seção 7.
          </p>
        </div>
      </div>

      {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {loading ? (
          <p className="text-xs text-slate-400">Carregando…</p>
        ) : atual ? (
          <a
            href={atual.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
          >
            <IconDownload className="h-3.5 w-3.5" />
            {atual.titulo}
          </a>
        ) : (
          <span className="text-xs text-slate-400">Nenhum PDF oficial enviado ainda.</span>
        )}

        <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
          {uploading ? 'Enviando…' : atual ? 'Substituir PDF' : 'Enviar PDF'}
          <input
            type="file"
            accept=".pdf"
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}

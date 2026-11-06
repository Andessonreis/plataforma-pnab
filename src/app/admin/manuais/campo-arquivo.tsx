'use client'

import { useId, useState, type ChangeEvent } from 'react'
import { IconExternalLink, IconFileText } from '@/components/ui'
import { linkDiscreto } from '@/app/admin/memorial/_ui'
import { ACCEPT_MANUAL, ENDPOINT_MANUAIS, ROTULO_FORMATOS_MANUAL, problemaDoArquivoManual } from '@/lib/manuais/regras'

interface Props {
  url: string
  onChange: (url: string) => void
  /** Erro vindo da validação do servidor ao salvar. */
  erro?: string
}

function nomeNoDisco(url: string) {
  return decodeURIComponent(url.split('/').pop() ?? '')
}

/** Envia o documento assim que é escolhido; o manual só muda de arquivo ao salvar o formulário. */
export function CampoArquivo({ url, onChange, erro }: Props) {
  const id = useId()
  const [enviando, setEnviando] = useState(false)
  const [falha, setFalha] = useState<string>()
  const mensagem = falha ?? erro

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problema = problemaDoArquivoManual(file)
    if (problema) return setFalha(problema)

    setFalha(undefined)
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${ENDPOINT_MANUAIS}/arquivo`, { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.data?.url) onChange(json.data.url)
      else setFalha(json.message ?? 'Não foi possível enviar o arquivo. Tente de novo.')
    } catch {
      setFalha('Sem conexão com o servidor. Verifique a internet e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-tinta-900">
        Arquivo <span className="font-normal text-tinta-600">(obrigatório)</span>
      </label>

      {url && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-tinta-900/10 bg-papel-50 px-3 py-2">
          <IconFileText className="h-5 w-5 shrink-0 text-tinta-600" />
          <span className="min-w-0 flex-1 break-all text-sm text-tinta-900">{nomeNoDisco(url)}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${linkDiscreto} inline-flex min-h-[44px] items-center gap-1`}>
            <IconExternalLink className="h-4 w-4" />
            Abrir<span className="sr-only"> arquivo atual (abre em nova aba)</span>
          </a>
        </div>
      )}

      <input
        id={id}
        type="file"
        accept={ACCEPT_MANUAL}
        onChange={escolher}
        disabled={enviando}
        aria-invalid={!!mensagem}
        aria-describedby={`${id}-ajuda`}
        className={
          'block w-full text-sm text-tinta-700 file:mr-3 file:min-h-[44px] file:cursor-pointer file:rounded-lg file:border file:border-tinta-900/20 ' +
          'file:bg-white file:px-4 file:text-sm file:font-semibold file:text-tinta-800 hover:file:bg-papel-100 ' +
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:opacity-50'
        }
      />

      <p id={`${id}-ajuda`} className="mt-1.5 text-sm text-tinta-600" aria-live="polite">
        {enviando ? 'Enviando o arquivo, aguarde.' : `${url ? 'Escolha outro arquivo para trocar. ' : ''}${ROTULO_FORMATOS_MANUAL}.`}
      </p>
      {mensagem && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {mensagem}
        </p>
      )}
    </div>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Aviso } from '@/components/ui'
import { botaoPrimario, campo, rotuloCampo } from '@/app/admin/memorial/_ui'

interface FormRegulamentoProps {
  textoInicial: string
  versaoAtual: number | null
}

export function FormRegulamento({ textoInicial, versaoAtual }: FormRegulamentoProps) {
  const router = useRouter()
  const [texto, setTexto] = useState(textoInicial)
  const [enviando, setEnviando] = useState(false)
  const [recado, setRecado] = useState<{ tom: 'sucesso' | 'erro'; texto: string } | null>(null)
  const alterado = texto.trim() !== textoInicial.trim() || versaoAtual === null

  async function publicar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setRecado(null)
    const res = await fetch('/api/v1/memorial/agendamentos/regulamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    }).catch(() => null)
    setEnviando(false)
    const corpo = await res?.json().catch(() => null)
    if (!res?.ok) {
      return setRecado({ tom: 'erro', texto: corpo?.fieldErrors?.texto ?? corpo?.message ?? 'Não foi possível publicar. Tente de novo.' })
    }
    setRecado({ tom: 'sucesso', texto: `Versão ${corpo.data.versao} publicada. Os próximos pedidos já aceitam este texto.` })
    router.refresh()
  }

  return (
    <form onSubmit={publicar} className="space-y-4 rounded-xl border border-tinta-900/15 bg-white p-4 sm:p-5">
      <div>
        <label htmlFor="texto-regulamento" className={rotuloCampo}>
          Texto do regulamento
        </label>
        <textarea
          id="texto-regulamento"
          aria-describedby="dica-regulamento"
          rows={18}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
          className={`${campo} py-2 leading-relaxed`}
        />
        <p id="dica-regulamento" className="mt-1 text-xs text-tinta-600">
          O site mostra o texto com as mesmas quebras de linha. Uma regra por linha fica mais fácil de ler no celular.
        </p>
      </div>
      {recado && <Aviso tom={recado.tom}>{recado.texto}</Aviso>}
      <button type="submit" disabled={!alterado || enviando} className={`${botaoPrimario} w-full sm:w-auto`}>
        {enviando ? 'Publicando...' : versaoAtual === null ? 'Publicar primeira versão' : `Publicar como versão ${versaoAtual + 1}`}
      </button>
    </form>
  )
}

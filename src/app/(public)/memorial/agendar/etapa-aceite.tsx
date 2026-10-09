'use client'

import { useState, type FormEvent } from 'react'
import { Aviso } from '@/components/ui'
import { formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import type { DadosVisita } from './dados-visita'
import type { RegrasPublicas } from './fluxo-agendamento'
import { BotoesEtapa } from './botoes-etapa'

interface EtapaAceiteProps {
  dados: DadosVisita
  regras: RegrasPublicas
  regulamento: string
  aoVoltar: () => void
  /** Devolve a mensagem de erro, ou null quando o pedido foi registrado. */
  aoEnviar: () => Promise<string | null>
}

/** Última conferência: resumo do pedido, aviso de fotos e o aceite do regulamento. */
export function EtapaAceite({ dados, regras, regulamento, aoVoltar, aoEnviar }: EtapaAceiteProps) {
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!aceite) return setErro('Marque que leu e concorda com o regulamento para enviar o pedido.')
    setErro('')
    setEnviando(true)
    const falha = await aoEnviar()
    setEnviando(false)
    if (falha) setErro(falha)
  }

  const resumo: [string, string][] = [
    ['Data', formatarDiaPorExtenso(dados.data)],
    ['Horário', `${dados.horaInicio} às ${dados.horaFim}`],
    ['Grupo', `${dados.instituicao} — ${dados.quantidade} pessoas`],
    ['Responsável', `${dados.responsavelNome} (${dados.responsavelEmail})`],
  ]

  return (
    <form onSubmit={enviar} noValidate>
      <h2 className="titulo text-2xl text-tinta-900 sm:text-3xl">Confira e envie</h2>

      <dl className="mt-5 divide-y divide-tinta-900/10 border-y-2 border-tinta-900/15">
        {resumo.map(([rotulo, valor]) => (
          <div key={rotulo} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-sm text-tinta-600">{rotulo}</dt>
            <dd className="break-words text-base text-tinta-900">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-tinta-700">
        {regras.textoRegistroFotografico && <p>{regras.textoRegistroFotografico}</p>}
        {regras.mercadoArteUrl && (
          <p>
            Quer conhecer também o Mercado de Arte de Irecê?{' '}
            <a
              href={regras.mercadoArteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-turquesa-800 underline underline-offset-4"
            >
              Agende a visita ao Mercado de Arte<span className="sr-only"> (abre em outra aba)</span>
            </a>
            .
          </p>
        )}
      </div>

      <details className="mt-6 border-2 border-tinta-900/15 px-4 py-3">
        <summary className="min-h-[44px] cursor-pointer py-2.5 text-sm font-semibold text-tinta-900">Reler o regulamento</summary>
        <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tinta-700">{regulamento}</div>
      </details>

      <label className="mt-6 flex min-h-[48px] cursor-pointer items-start gap-3 bg-papel-100/70 p-4 text-[15px] leading-relaxed text-tinta-900">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => {
            setAceite(e.target.checked)
            if (e.target.checked) setErro('')
          }}
          aria-invalid={erro && !aceite ? true : undefined}
          className="mt-1 h-5 w-5 shrink-0 accent-oliva-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700"
        />
        Li o regulamento de visitação e me responsabilizo por orientar o grupo a cumpri-lo.
      </label>

      {erro && (
        <div className="mt-4">
          <Aviso tom="erro">{erro}</Aviso>
        </div>
      )}
      <BotoesEtapa aoVoltar={aoVoltar} rotulo="Enviar pedido de visita" carregando={enviando} />
    </form>
  )
}

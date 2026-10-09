'use client'

import { useState, type ReactNode } from 'react'
import { IconClose, IconPlus } from '@/components/ui'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'
import { BlocoSecao, StatusChip, campo } from '../../_ui'
import type { Miniatura } from '../../_ui/acervo-miniaturas'

interface Props {
  acervo: Miniatura[]
  selecionados: string[]
  onChange: (ids: string[]) => void
}

/** Miniatura quadrada com a situação; fotos não publicadas não aparecem no site. */
function Quadro({ m, children }: { m: Miniatura; children?: ReactNode }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-papel-200 ring-1 ring-tinta-900/10">
      {m.imagem ? (
        <ImagemMemorial src={m.imagem} alt={m.titulo} sizes="(min-width: 1024px) 12vw, 33vw" />
      ) : (
        <span className="flex h-full items-center justify-center p-2 text-center text-xs text-tinta-700">{m.titulo}</span>
      )}
      {m.status !== 'PUBLICADO' && (
        <span className="absolute bottom-1 left-1 rounded-full bg-white">
          <StatusChip tipo="conteudo" status={m.status} />
        </span>
      )}
      {children}
    </div>
  )
}

/**
 * Fotos da exposição em miniaturas, com retirar em cada uma. Para incluir, abre-se
 * o acervo como galeria e toca-se nas fotos desejadas.
 */
export function FotosExposicao({ acervo, selecionados, onChange }: Props) {
  const [abrir, setAbrir] = useState(false)
  const [termo, setTermo] = useState('')
  const porId = new Map(acervo.map((m) => [m.id, m]))
  const ligadas = selecionados.map((id) => porId.get(id)).filter((m): m is Miniatura => Boolean(m))
  const busca = termo.trim().toLowerCase()
  const disponiveis = acervo.filter((m) => !selecionados.includes(m.id) && (!busca || m.titulo.toLowerCase().includes(busca)))

  return (
    <BlocoSecao titulo={`Fotos da exposição (${ligadas.length})`} dica="Só as fotos publicadas aparecem no site. As outras ficam marcadas com a situação.">
      {ligadas.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {ligadas.map((m) => (
            <li key={m.id}>
              <Quadro m={m}>
                <button
                  type="button"
                  onClick={() => onChange(selecionados.filter((s) => s !== m.id))}
                  className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-tinta-800 shadow-sm hover:text-brand-700"
                >
                  <IconClose className="h-5 w-5" />
                  <span className="sr-only">Retirar {m.titulo} da exposição</span>
                </button>
              </Quadro>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-tinta-600">Nenhuma foto ligada ainda.</p>
      )}

      <button
        type="button"
        aria-expanded={abrir}
        onClick={() => setAbrir(!abrir)}
        className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
      >
        <IconPlus className="h-4 w-4" />
        {abrir ? 'Fechar o acervo' : 'Adicionar fotos do acervo'}
      </button>

      {abrir && (
        <div className="mt-2 rounded-lg border border-tinta-900/10 bg-papel-50/60 p-3">
          <label htmlFor="busca-fotos-exposicao" className="sr-only">
            Procurar foto pelo título
          </label>
          <input
            id="busca-fotos-exposicao"
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Procurar pelo título"
            className={campo}
          />
          <ul className="mt-3 grid max-h-[28rem] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
            {disponiveis.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onChange([...selecionados, m.id])}
                  className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                >
                  <Quadro m={m}>
                    <span className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white group-hover:bg-brand-700">
                      <IconPlus className="h-4 w-4" />
                    </span>
                  </Quadro>
                  <span className="mt-1 line-clamp-1 text-xs text-tinta-800">
                    <span className="sr-only">Adicionar </span>
                    {m.titulo}
                  </span>
                </button>
              </li>
            ))}
            {disponiveis.length === 0 && <li className="col-span-full py-3 text-sm text-tinta-600">Nenhuma foto encontrada.</li>}
          </ul>
        </div>
      )}
    </BlocoSecao>
  )
}

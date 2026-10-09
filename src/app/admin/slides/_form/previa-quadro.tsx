'use client'

import { useEffect, useRef, useState } from 'react'
import { FaixaDividida } from '@/components/home/faixa-dividida'
import { PalcoPeca } from '@/components/home/peca/palco-peca'
import { ALTURA_QUADRO } from '@/components/home/quadro'
import type { EditalResumo } from '@/components/home/types'
import { previaDoForm, type FormSlide } from './estado'

/**
 * Largura em que a peça é desenhada antes de ser reduzida para caber aqui. Os
 * estilos da home respondem à largura da janela, não à da caixa; então a
 * prévia usa a largura típica da faixa de tela atual — no computador mostra o
 * quadro do computador, no celular o do celular.
 */
const LARGURAS = [
  { consulta: '(min-width: 1024px)', largura: 1280 },
  { consulta: '(min-width: 768px)', largura: 820 },
  { consulta: 'all', largura: 390 },
]

interface PreviaQuadroProps {
  form: FormSlide
  editais: EditalResumo[]
  fotos: string[]
}

/** Pré-visualização ao vivo do slide no mesmo quadro fixo da home, com os editais reais ao lado. */
export function PreviaQuadro({ form, editais, fotos }: PreviaQuadroProps) {
  const caixa = useRef<HTMLDivElement>(null)
  const quadro = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(1280)
  const [escala, setEscala] = useState(0)
  const [altura, setAltura] = useState(0)

  useEffect(() => {
    const medir = () => {
      const alvo = LARGURAS.find((l) => window.matchMedia(l.consulta).matches)?.largura ?? 390
      const disponivel = caixa.current?.clientWidth ?? alvo
      const fator = Math.min(1, disponivel / alvo)
      setLargura(alvo)
      setEscala(fator)
      setAltura((quadro.current?.offsetHeight ?? 0) * fator)
    }
    medir()
    const observador = new ResizeObserver(medir)
    if (caixa.current) observador.observe(caixa.current)
    return () => observador.disconnect()
  }, [])

  const slide = previaDoForm(form)
  const semImagem = !form.imagemUrl

  return (
    <div ref={caixa} className="overflow-hidden rounded-lg border border-slate-200" style={{ height: altura || undefined }}>
      <div
        ref={quadro}
        inert
        aria-hidden="true"
        className={`relative isolate origin-top-left overflow-hidden bg-tinta-950 ${ALTURA_QUADRO}`}
        style={{ width: largura, transform: `scale(${escala})`, visibility: escala ? 'visible' : 'hidden' }}
      >
        {slide.tipo === 'peca' ? (
          <PalcoPeca slide={slide} />
        ) : slide.tipo === 'arte' && semImagem ? (
          <p className="flex h-full items-center justify-center text-lg text-papel-200">Envie a imagem da arte para ver a prévia.</p>
        ) : (
          <FaixaDividida slide={slide} editais={editais} fotos={fotos} />
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus } from '@/components/ui'
import { megabytesMemorial } from '@/lib/memorial/midia'
import { IMAGEM_MIMES } from '@/lib/upload/imagem'
import type { OpcaoVinculo } from '../../_componentes/seletor-vinculos'
import { RecadoEnvio } from '../../_componentes/recado-envio'
import { useEnvio } from '../../_componentes/use-envio'
import { botaoNeutro, botaoPrimario } from '../../_ui'
import { DadosLoteEnvio, LOTE_INICIAL, type DadosLote } from './dados-lote'
import { enviarImagem, problemaDoArquivo } from '../../_ui/acervo-enviar-imagem'
import { FilaEnvio, type ArquivoNaFila } from './fila-envio'

const MAXIMO = 30

/** "praca_1972-final.jpg" → "praca 1972 final" — ponto de partida para o título. */
function tituloDoArquivo(nome: string) {
  return nome.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Fotografia sem título'
}

/**
 * Área de soltar ou escolher várias fotos. Cada uma sobe com sua barra de progresso
 * e, no fim, todas entram no acervo como rascunho com os dados comuns preenchidos.
 */
export function AreaEnvio({ albuns }: { albuns: OpcaoVinculo[] }) {
  const router = useRouter()
  const entrada = useRef<HTMLInputElement>(null)
  const [fila, setFila] = useState<ArquivoNaFila[]>([])
  const [comuns, setComuns] = useState<DadosLote>(LOTE_INICIAL)
  const [subindo, setSubindo] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const { enviando, recado, enviar } = useEnvio()

  function adicionar(lista: FileList | null) {
    if (!lista) return
    const novos = Array.from(lista).map((file) => ({
      chave: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      titulo: tituloDoArquivo(file.name),
      erro: problemaDoArquivo(file),
    }))
    setFila((atual) => [...atual, ...novos.filter((n) => !atual.some((a) => a.chave === n.chave))].slice(0, MAXIMO))
  }

  const atualizar = (chave: string, mudanca: Partial<ArquivoNaFila>) =>
    setFila((atual) => atual.map((f) => (f.chave === chave ? { ...f, ...mudanca } : f)))

  async function enviarTudo() {
    setSubindo(true)
    const prontos: { arquivoUrl: string; titulo: string; chave: string }[] = []
    for (const item of fila) {
      if (item.erro) continue
      if (item.url) {
        prontos.push({ arquivoUrl: item.url, titulo: item.titulo, chave: item.chave })
        continue
      }
      atualizar(item.chave, { progresso: 0 })
      const r = await enviarImagem(item.file, 'acervo', (pct) => atualizar(item.chave, { progresso: pct }))
      if ('url' in r) {
        atualizar(item.chave, { url: r.url })
        prontos.push({ arquivoUrl: r.url, titulo: item.titulo, chave: item.chave })
      } else atualizar(item.chave, { erro: r.erro, progresso: undefined })
    }
    setSubindo(false)
    if (prontos.length === 0) return

    const criados = await enviar(
      '/api/v1/memorial/acervo/lote',
      'POST',
      { ...comuns, decada: comuns.decada ? Number(comuns.decada) : null, arquivos: prontos.map(({ arquivoUrl, titulo }) => ({ arquivoUrl, titulo })) },
      `${prontos.length} ${prontos.length === 1 ? 'foto entrou' : 'fotos entraram'} no acervo, na aba “Para completar”.`,
    )
    if (criados) {
      setFila((atual) => atual.filter((f) => !prontos.some((p) => p.chave === f.chave)))
      router.refresh()
    }
  }

  function soltar(e: DragEvent) {
    e.preventDefault()
    setArrastando(false)
    adicionar(e.dataTransfer.files)
  }

  const validos = fila.filter((f) => !f.erro).length

  return (
    <section aria-labelledby="titulo-envio" className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
        className={`flex flex-col gap-3 rounded-xl border-2 border-dashed p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
          arrastando ? 'border-brand-600 bg-brand-50' : 'border-tinta-900/20 bg-white'
        }`}
      >
        <div>
          <h2 id="titulo-envio" className="text-base font-bold text-tinta-900">
            Enviar fotos para o acervo
          </h2>
          <p className="mt-0.5 text-sm text-tinta-600">
            Arraste as fotos para cá ou escolha no aparelho. Até {MAXIMO} por vez, JPG, PNG ou WEBP de até {megabytesMemorial} MB.
          </p>
        </div>
        <input
          ref={entrada}
          type="file"
          multiple
          accept={IMAGEM_MIMES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            adicionar(e.target.files)
            e.target.value = ''
          }}
        />
        <button type="button" className={`${botaoPrimario} shrink-0`} onClick={() => entrada.current?.click()}>
          <IconPlus className="h-4 w-4" />
          Escolher fotos
        </button>
      </div>

      {fila.length > 0 && (
        <div className="space-y-4 rounded-xl border border-tinta-900/10 bg-white p-4">
          <FilaEnvio fila={fila} desabilitado={subindo} onChange={setFila} />
          <DadosLoteEnvio albuns={albuns} valores={comuns} onChange={setComuns} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={botaoPrimario} disabled={validos === 0 || subindo || enviando} onClick={enviarTudo}>
              {subindo ? 'Enviando…' : `Enviar ${validos} ${validos === 1 ? 'foto' : 'fotos'}`}
            </button>
            <button type="button" className={botaoNeutro} disabled={subindo} onClick={() => setFila([])}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      <RecadoEnvio recado={recado} />
    </section>
  )
}

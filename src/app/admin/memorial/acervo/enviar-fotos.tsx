'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { MAX_BYTES_MEMORIAL, UPLOAD_MEMORIAL, megabytesMemorial } from '@/lib/memorial/midia'
import { IMAGEM_MIMES, isImagemMime } from '@/lib/upload/imagem'
import type { OpcaoVinculo } from '../_componentes/seletor-vinculos'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { useEnvio } from '../_componentes/use-envio'
import { DadosComunsLote, LOTE_INICIAL, type DadosLote } from './dados-comuns-lote'
import { FilaEnvio, type ArquivoNaFila } from './fila-envio'

/** "praca_1972-final.jpg" → "praca 1972 final" — ponto de partida para o título. */
function tituloDoArquivo(nome: string) {
  return nome.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Fotografia sem título'
}

/**
 * Envio de várias fotos de uma vez. Cada imagem sobe para o armazenamento e, no fim,
 * todas viram rascunhos no acervo com os dados comuns preenchidos (álbum, crédito...).
 */
export function EnviarFotos({ albuns }: { albuns: OpcaoVinculo[] }) {
  const router = useRouter()
  const entrada = useRef<HTMLInputElement>(null)
  const [fila, setFila] = useState<ArquivoNaFila[]>([])
  const [comuns, setComuns] = useState<DadosLote>(LOTE_INICIAL)
  const [subindo, setSubindo] = useState(false)
  const { enviando, recado, enviar } = useEnvio()

  function adicionar(lista: FileList | null) {
    if (!lista) return
    const novos = Array.from(lista).map((file) => ({
      chave: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      titulo: tituloDoArquivo(file.name),
      erro: !isImagemMime(file.type)
        ? 'Formato não aceito (use JPG, PNG ou WEBP).'
        : file.size > MAX_BYTES_MEMORIAL
          ? `Maior que ${megabytesMemorial} MB.`
          : undefined,
    }))
    setFila((atual) => [...atual, ...novos.filter((n) => !atual.some((a) => a.chave === n.chave))].slice(0, 30))
  }

  async function subir(item: ArquivoNaFila): Promise<ArquivoNaFila> {
    if (item.url || item.erro) return item
    const fd = new FormData()
    fd.append('file', item.file)
    fd.append('pasta', 'acervo')
    try {
      const res = await fetch(UPLOAD_MEMORIAL, { method: 'POST', body: fd })
      const json = await res.json()
      return res.ok ? { ...item, url: json.data.url } : { ...item, erro: json.message ?? 'Falha no envio.' }
    } catch {
      return { ...item, erro: 'Sem conexão durante o envio.' }
    }
  }

  async function enviarTudo() {
    setSubindo(true)
    const resultado: ArquivoNaFila[] = []
    for (const item of fila) {
      resultado.push(await subir(item))
      setFila([...resultado, ...fila.slice(resultado.length)])
    }
    setSubindo(false)

    const prontos = resultado.filter((r) => r.url)
    if (prontos.length === 0) return
    const criados = await enviar(
      '/api/v1/memorial/acervo/lote',
      'POST',
      { ...comuns, decada: comuns.decada ? Number(comuns.decada) : null, arquivos: prontos.map((p) => ({ arquivoUrl: p.url, titulo: p.titulo })) },
      `${prontos.length} ${prontos.length === 1 ? 'foto entrou' : 'fotos entraram'} no acervo como rascunho.`,
    )
    if (criados) {
      setFila(resultado.filter((r) => !r.url))
      router.refresh()
    }
  }

  const validos = fila.filter((f) => !f.erro).length

  return (
    <SecaoForm
      titulo="Enviar fotografias"
      ajuda={`Até 30 por vez, JPG, PNG ou WEBP de até ${megabytesMemorial} MB. Cada foto entra como rascunho para você completar depois.`}
    >
      <input
        ref={entrada}
        type="file"
        multiple
        accept={IMAGEM_MIMES.join(',')}
        className="sr-only"
        aria-label="Escolher fotografias"
        onChange={(e) => {
          adicionar(e.target.files)
          e.target.value = ''
        }}
      />
      <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => entrada.current?.click()}>
        Escolher fotografias
      </Button>

      {fila.length > 0 && (
        <>
          <FilaEnvio fila={fila} desabilitado={subindo} onChange={setFila} />
          <DadosComunsLote albuns={albuns} valores={comuns} onChange={setComuns} />
          <Button type="button" className="min-h-[44px]" loading={subindo || enviando} disabled={validos === 0} onClick={enviarTudo}>
            Enviar {validos} {validos === 1 ? 'foto' : 'fotos'}
          </Button>
        </>
      )}
      <RecadoEnvio recado={recado} />
    </SecaoForm>
  )
}

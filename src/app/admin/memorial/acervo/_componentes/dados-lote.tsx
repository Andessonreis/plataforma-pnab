'use client'

import type { OpcaoVinculo } from '../../_componentes/seletor-vinculos'
import { CampoSelecao, CampoTexto } from '../../_ui/acervo-campo'
import { CampoAutorizacao } from './campo-autorizacao'

export interface DadosLote {
  albumId: string
  decada: string
  fotografo: string
  credito: string
  direitosUso: string
  autorizado: boolean
}

export const LOTE_INICIAL: DadosLote = { albumId: '', decada: '', fotografo: '', credito: '', direitosUso: '', autorizado: false }

interface Props {
  albuns: OpcaoVinculo[]
  valores: DadosLote
  onChange: (v: DadosLote) => void
}

/** O que vale para todas as fotos do envio; dá para ajustar foto a foto depois. */
export function DadosLoteEnvio({ albuns, valores, onChange }: Props) {
  const definir = <K extends keyof DadosLote>(k: K, v: DadosLote[K]) => onChange({ ...valores, [k]: v })

  return (
    <fieldset className="rounded-xl border border-tinta-900/10 bg-papel-50/60 p-4">
      <legend className="px-1 text-sm font-bold text-tinta-900">Vale para todas as fotos deste envio</legend>
      <p className="mb-3 text-sm text-tinta-600">Preencher crédito e autorização agora evita voltar foto por foto depois.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CampoSelecao
          rotulo="Álbum"
          value={valores.albumId}
          onChange={(e) => definir('albumId', e.target.value)}
          opcoes={[{ valor: '', rotulo: 'Sem álbum' }, ...albuns.map((a) => ({ valor: a.id, rotulo: a.rotulo }))]}
        />
        <CampoTexto rotulo="Década" type="number" step={10} placeholder="Ex.: 1960" value={valores.decada} onChange={(e) => definir('decada', e.target.value)} />
        <CampoTexto rotulo="Fotógrafo" value={valores.fotografo} onChange={(e) => definir('fotografo', e.target.value)} />
        <CampoTexto
          rotulo="Crédito"
          placeholder="Ex.: Acervo da família Dourado"
          value={valores.credito}
          onChange={(e) => definir('credito', e.target.value)}
        />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <CampoTexto rotulo="Direitos de uso" value={valores.direitosUso} onChange={(e) => definir('direitosUso', e.target.value)} />
        <CampoAutorizacao marcado={valores.autorizado} onChange={(v) => definir('autorizado', v)} />
      </div>
    </fieldset>
  )
}

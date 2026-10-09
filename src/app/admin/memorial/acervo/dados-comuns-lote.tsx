'use client'

import { Input, Select, Textarea } from '@/components/ui'
import type { OpcaoVinculo } from '../_componentes/seletor-vinculos'
import { CampoAutorizacao } from './campo-autorizacao'

export interface DadosLote {
  albumId: string
  decada: string
  fotografo: string
  credito: string
  direitosUso: string
  autorizado: boolean
}

export const LOTE_INICIAL: DadosLote = {
  albumId: '',
  decada: '',
  fotografo: '',
  credito: '',
  direitosUso: '',
  autorizado: false,
}

interface Props {
  albuns: OpcaoVinculo[]
  valores: DadosLote
  onChange: (v: DadosLote) => void
}

/** Dados que valem para todas as fotos do envio (podem ser ajustados foto a foto depois). */
export function DadosComunsLote({ albuns, valores, onChange }: Props) {
  const campo = <K extends keyof DadosLote>(k: K, v: DadosLote[K]) => onChange({ ...valores, [k]: v })

  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-medium text-slate-700">Vale para todas as fotos deste envio</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Álbum"
          value={valores.albumId}
          onChange={(e) => campo('albumId', e.target.value)}
          options={[{ value: '', label: 'Sem álbum' }, ...albuns.map((a) => ({ value: a.id, label: a.rotulo }))]}
        />
        <Input
          label="Década"
          type="number"
          step={10}
          placeholder="Ex.: 1960"
          value={valores.decada}
          onChange={(e) => campo('decada', e.target.value)}
        />
        <Input label="Fotógrafo" value={valores.fotografo} onChange={(e) => campo('fotografo', e.target.value)} />
        <Input label="Crédito" placeholder="Como deve aparecer no site" value={valores.credito} onChange={(e) => campo('credito', e.target.value)} />
      </div>
      <Textarea label="Direitos de uso" rows={2} value={valores.direitosUso} onChange={(e) => campo('direitosUso', e.target.value)} />
      <CampoAutorizacao marcado={valores.autorizado} onChange={(v) => campo('autorizado', v)} />
    </fieldset>
  )
}

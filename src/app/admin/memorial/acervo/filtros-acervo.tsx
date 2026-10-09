import { ROTULO_TIPO_ACERVO, TIPOS_ACERVO } from '@/lib/memorial/rotulos'
import type { ListagemAcervoAdmin } from '@/lib/schemas/memorial-acervo'
import type { OpcaoVinculo } from '../_componentes/seletor-vinculos'

const CLASSE_SELECT =
  'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200'

/** Recortes próprios do acervo (tipo, álbum, década), somados à busca e à etapa. */
export function FiltrosAcervo({ f, albuns }: { f: ListagemAcervoAdmin; albuns: OpcaoVinculo[] }) {
  return (
    <form className="mb-5 grid gap-3 sm:grid-cols-4" aria-label="Filtrar acervo">
      {f.q && <input type="hidden" name="q" value={f.q} />}
      {f.status && <input type="hidden" name="status" value={f.status} />}
      <label className="text-sm text-slate-700">
        Tipo
        <select name="tipo" defaultValue={f.tipo ?? ''} className={CLASSE_SELECT}>
          <option value="">Todos</option>
          {TIPOS_ACERVO.map((t) => (
            <option key={t} value={t}>
              {ROTULO_TIPO_ACERVO[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700">
        Álbum
        <select name="albumId" defaultValue={f.albumId ?? ''} className={CLASSE_SELECT}>
          <option value="">Todos</option>
          {albuns.map((a) => (
            <option key={a.id} value={a.id}>
              {a.rotulo}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-700">
        Década
        <input name="decada" type="number" step={10} defaultValue={f.decada} placeholder="Ex.: 1960" className={CLASSE_SELECT} />
      </label>
      <button
        type="submit"
        className="min-h-[44px] self-end rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Aplicar filtros
      </button>
    </form>
  )
}

import Link from 'next/link'
import { IconChevronDown } from '@/components/ui'
import { ROTULO_TIPO_ACERVO, TIPOS_ACERVO } from '@/lib/memorial/rotulos'
import type { ListagemAcervoAdmin } from '@/lib/schemas/memorial-acervo'
import type { OpcaoVinculo } from '../../_componentes/seletor-vinculos'
import { botaoPrimario, linkDiscreto } from '../../_ui'
import { CampoSelecao, CampoTexto } from '../../_ui/acervo-campo'

interface Props {
  f: ListagemAcervoAdmin
  albuns: OpcaoVinculo[]
  base: string
}

/** Tipo, álbum e década ficam recolhidos: a busca e as abas resolvem o dia a dia. */
export function FiltrosAcervo({ f, albuns, base }: Props) {
  const ativos = [f.tipo, f.albumId, f.decada].filter((v) => v !== undefined && v !== '').length

  return (
    <details className="group sm:relative">
      <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg border border-tinta-900/20 bg-white px-4 text-sm font-semibold text-tinta-800 hover:bg-papel-100">
        Filtros
        {ativos > 0 && <span className="rounded-full bg-accent-200 px-2 text-xs text-accent-900">{ativos} em uso</span>}
        <IconChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <form
        action={base}
        aria-label="Filtrar acervo"
        className="mt-2 grid gap-3 rounded-xl border border-tinta-900/10 bg-white p-4 sm:absolute sm:right-0 sm:z-20 sm:w-80 sm:shadow-lg"
      >
        {f.q && <input type="hidden" name="q" value={f.q} />}
        {f.status && <input type="hidden" name="status" value={f.status} />}
        <CampoSelecao
          rotulo="Tipo"
          name="tipo"
          defaultValue={f.tipo ?? ''}
          opcoes={[{ valor: '', rotulo: 'Todos os tipos' }, ...TIPOS_ACERVO.map((t) => ({ valor: t, rotulo: ROTULO_TIPO_ACERVO[t] }))]}
        />
        <CampoSelecao
          rotulo="Álbum"
          name="albumId"
          defaultValue={f.albumId ?? ''}
          opcoes={[{ valor: '', rotulo: 'Todos os álbuns' }, ...albuns.map((a) => ({ valor: a.id, rotulo: a.rotulo }))]}
        />
        <CampoTexto rotulo="Década" name="decada" type="number" step={10} defaultValue={f.decada} placeholder="Ex.: 1960" />
        <div className="flex items-center justify-between gap-3">
          <Link href={base} className={`${linkDiscreto} py-2`}>
            Limpar tudo
          </Link>
          <button type="submit" className={botaoPrimario}>
            Aplicar
          </button>
        </div>
      </form>
    </details>
  )
}

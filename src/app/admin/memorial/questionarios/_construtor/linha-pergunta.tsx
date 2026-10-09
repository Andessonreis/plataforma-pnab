'use client'

import { IconArrowRight, IconChevronDown, IconClose } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { DetalhesPergunta } from './detalhes-pergunta'
import { tipoDaPergunta } from './tipos-pergunta'

interface Props {
  campo: CampoFormulario
  index: number
  total: number
  aberta: boolean
  erros: string[]
  onAlternar: () => void
  onChange: (patch: Partial<CampoFormulario>) => void
  onMover: (direcao: -1 | 1) => void
  onRemover: () => void
}

const icone =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-tinta-600 hover:bg-papel-100 hover:text-tinta-900 ' +
  'disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-accent-500'

function resumo(campo: CampoFormulario) {
  const partes = [tipoDaPergunta(campo.tipo).rotulo]
  if (campo.tipo !== 'info') partes.push(campo.obrigatorio ? 'obrigatória' : 'opcional')
  if (campo.opcoes?.length) partes.push(`${campo.opcoes.length} opções`)
  return partes.join(', ')
}

/** Uma pergunta numa linha: dá para ler a lista inteira de relance e abrir só a que vai mudar. */
export function LinhaPergunta({ campo, index, total, aberta, erros, onAlternar, onChange, onMover, onRemover }: Props) {
  const { Icone } = tipoDaPergunta(campo.tipo)
  const texto = campo.tipo === 'info' ? campo.conteudo?.slice(0, 80) || 'Texto de aviso' : campo.label
  const idPainel = `pergunta-${index}-detalhes`

  function remover() {
    if (campo.label.trim() && !window.confirm(`Remover a pergunta "${campo.label}"?`)) return
    onRemover()
  }

  return (
    <li className={`rounded-xl border bg-white ${erros.length ? 'border-red-300' : aberta ? 'border-accent-500' : 'border-tinta-900/10'}`}>
      <div className="flex items-center gap-1 p-1.5 pl-3">
        <span aria-hidden="true" className="w-6 shrink-0 text-sm font-bold tabular-nums text-tinta-600">{index + 1}</span>
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={aberta}
          aria-controls={idPainel}
          className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left focus-visible:outline-2 focus-visible:outline-accent-500"
        >
          <Icone className="h-5 w-5 shrink-0 text-brand-700" />
          <span className="min-w-0 flex-1">
            <span className={`line-clamp-2 block text-sm font-semibold ${texto ? 'text-tinta-900' : 'italic text-accent-900'}`}>
              {texto || 'Pergunta sem texto'}
            </span>
            <span className="block truncate text-xs text-tinta-600">{resumo(campo)}</span>
          </span>
          <IconChevronDown className={`h-5 w-5 shrink-0 text-tinta-500 transition-transform ${aberta ? 'rotate-180' : ''}`} />
        </button>
        <div className="hidden sm:flex">
          <button type="button" className={icone} disabled={index === 0} onClick={() => onMover(-1)} aria-label={`Subir a pergunta ${index + 1}`}>
            <IconArrowRight className="h-5 w-5 -rotate-90" />
          </button>
          <button type="button" className={icone} disabled={index === total - 1} onClick={() => onMover(1)} aria-label={`Descer a pergunta ${index + 1}`}>
            <IconArrowRight className="h-5 w-5 rotate-90" />
          </button>
          <button type="button" className={`${icone} hover:bg-red-50 hover:text-red-700`} onClick={remover} aria-label={`Remover a pergunta ${index + 1}`}>
            <IconClose className="h-5 w-5" />
          </button>
        </div>
      </div>
      {erros.map((m) => (
        <p key={m} role="alert" className="px-4 pb-2 text-sm font-medium text-red-700">{m}</p>
      ))}
      {aberta && (
        <div id={idPainel} className="border-t border-tinta-900/10 bg-papel-50/60 p-3 sm:p-4">
          <div className="mb-4 flex gap-2 sm:hidden">
            <button type="button" className={`${icone} border border-tinta-900/15 bg-white`} disabled={index === 0} onClick={() => onMover(-1)} aria-label="Subir">
              <IconArrowRight className="h-5 w-5 -rotate-90" />
            </button>
            <button type="button" className={`${icone} border border-tinta-900/15 bg-white`} disabled={index === total - 1} onClick={() => onMover(1)} aria-label="Descer">
              <IconArrowRight className="h-5 w-5 rotate-90" />
            </button>
            <button type="button" onClick={remover} className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700">
              <IconClose className="h-4 w-4" />
              Remover
            </button>
          </div>
          <DetalhesPergunta campo={campo} index={index} onChange={onChange} />
        </div>
      )}
    </li>
  )
}

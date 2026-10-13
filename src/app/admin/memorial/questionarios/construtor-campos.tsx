'use client'

import { useState } from 'react'
import { IconInfo, IconPlus } from '@/components/ui'
import type { CampoFormulario, CampoTipo } from '@/types/campo-formulario'
import { botaoNeutro } from '@/app/admin/memorial/_ui'
import { EscolherTipo } from './_construtor/escolher-tipo'
import { LinhaPergunta } from './_construtor/linha-pergunta'

interface Props {
  campos: CampoFormulario[]
  erros: Record<string, string>
  onChange: (campos: CampoFormulario[]) => void
  /** Respostas já recebidas: mudar perguntas aqui cria uma versão nova. */
  respostas: number
}

/**
 * Lista de perguntas. Os campos de cada tipo vêm do editor de etapas dos
 * editais; aqui a lista é controlada à parte porque não pertence a uma etapa.
 */
export function ConstrutorCampos({ campos, erros, onChange, respostas }: Props) {
  const [aberta, setAberta] = useState<number | null>(null)
  const [escolhendo, setEscolhendo] = useState(campos.length === 0)

  const alterar = (i: number, patch: Partial<CampoFormulario>) => onChange(campos.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  function adicionar(tipo: CampoTipo) {
    onChange([...campos, { nome: '', label: '', tipo, obrigatorio: false }])
    setAberta(campos.length)
    setEscolhendo(false)
  }

  function mover(i: number, direcao: -1 | 1) {
    const alvo = i + direcao
    if (alvo < 0 || alvo >= campos.length) return
    const proximos = [...campos]
    ;[proximos[i], proximos[alvo]] = [proximos[alvo], proximos[i]]
    onChange(proximos)
    if (aberta === i) setAberta(alvo)
  }

  function remover(i: number) {
    onChange(campos.filter((_, idx) => idx !== i))
    setAberta(null)
  }

  // Erros chegam do Zod como "campos.3.opcoes"; cada um vai para a pergunta certa.
  const errosDa = (i: number) =>
    Object.entries(erros).filter(([k]) => k === `campos.${i}` || k.startsWith(`campos.${i}.`)).map(([, m]) => m)

  return (
    <section aria-labelledby="perguntas-titulo" className="rounded-xl border border-tinta-900/10 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="perguntas-titulo" className="text-base font-bold text-tinta-900">Perguntas</h2>
        <span className="text-sm font-medium tabular-nums text-tinta-600">{campos.length} no total</span>
      </div>
      {respostas > 0 && (
        <p className="mb-4 flex gap-2 rounded-lg bg-turquesa-50 px-3 py-2.5 text-sm text-turquesa-900">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          Pode mudar à vontade. As {respostas} respostas já recebidas continuam guardadas com as perguntas da época em que foram enviadas.
        </p>
      )}
      {erros.campos && <p role="alert" className="mb-3 text-sm font-medium text-red-700">{erros.campos}</p>}

      {campos.length > 0 && (
        <ol className="mb-4 space-y-2">
          {campos.map((campo, i) => (
            <LinhaPergunta
              key={i}
              campo={campo}
              index={i}
              total={campos.length}
              aberta={aberta === i}
              erros={errosDa(i)}
              onAlternar={() => setAberta(aberta === i ? null : i)}
              onChange={(patch) => alterar(i, patch)}
              onMover={(d) => mover(i, d)}
              onRemover={() => remover(i)}
            />
          ))}
        </ol>
      )}

      {escolhendo ? (
        <div className="rounded-xl border-2 border-dashed border-accent-300 bg-accent-50/60 p-3 sm:p-4">
          <p className="mb-3 text-sm font-semibold text-tinta-900">
            {campos.length === 0 ? 'Comece pela primeira pergunta. Que tipo de resposta você espera?' : 'Que tipo de resposta você espera?'}
          </p>
          <EscolherTipo rotulo="Tipo da nova pergunta" onEscolher={adicionar} />
          {campos.length > 0 && (
            <button type="button" className={`${botaoNeutro} mt-3`} onClick={() => setEscolhendo(false)}>
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <button type="button" className={`${botaoNeutro} w-full border-dashed`} onClick={() => setEscolhendo(true)}>
          <IconPlus className="h-4 w-4" />
          Adicionar pergunta
        </button>
      )}
    </section>
  )
}

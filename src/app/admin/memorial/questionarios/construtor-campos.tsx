'use client'

import { Button, Card } from '@/components/ui'
import { CampoEditor } from '@/app/admin/editais/campo-editor'
import type { CampoFormulario } from '@/types/campo-formulario'

interface ConstrutorCamposProps {
  campos: CampoFormulario[]
  erros: Record<string, string>
  onChange: (campos: CampoFormulario[]) => void
}

/**
 * Lista de perguntas montada com o mesmo editor de campo das etapas de edital
 * (`CampoEditor`). O editor de etapas inteiro não serve aqui porque amarra os
 * campos a uma `EtapaCustomizada`; por isso a lista é controlada neste arquivo.
 */
export function ConstrutorCampos({ campos, erros, onChange }: ConstrutorCamposProps) {
  const adicionar = () => onChange([...campos, { nome: '', label: '', tipo: 'texto', obrigatorio: false }])
  const remover = (i: number) => onChange(campos.filter((_, idx) => idx !== i))
  const alterar = (i: number, patch: Partial<CampoFormulario>) =>
    onChange(campos.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  const mover = (i: number, direcao: -1 | 1) => {
    const alvo = i + direcao
    if (alvo < 0 || alvo >= campos.length) return
    const proximos = [...campos]
    ;[proximos[i], proximos[alvo]] = [proximos[alvo], proximos[i]]
    onChange(proximos)
  }

  // Erros chegam do Zod como "campos.3.opcoes"; cada um vai para baixo do campo certo.
  const errosDoCampo = (i: number) =>
    Object.entries(erros).filter(([chave]) => chave.startsWith(`campos.${i}.`) || chave === `campos.${i}`).map(([, m]) => m)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Perguntas</h2>
          <p className="text-xs text-slate-600 sm:text-sm">
            Mudar perguntas cria uma nova versão. Respostas já recebidas continuam com as perguntas da época.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={adicionar}>
          Adicionar pergunta
        </Button>
      </div>

      {erros.campos && <p className="mb-3 text-sm text-red-700" role="alert">{erros.campos}</p>}

      {campos.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          Nenhuma pergunta ainda. Comece por &ldquo;Adicionar pergunta&rdquo;.
        </p>
      ) : (
        <ol className="space-y-3">
          {campos.map((campo, i) => (
            <li key={i}>
              <CampoEditor
                campo={campo}
                index={i}
                isFirst={i === 0}
                isLast={i === campos.length - 1}
                onChange={(patch) => alterar(i, patch)}
                onRemove={() => remover(i)}
                onMoveUp={() => mover(i, -1)}
                onMoveDown={() => mover(i, 1)}
              />
              {errosDoCampo(i).map((m) => (
                <p key={m} className="mt-1 text-sm text-red-700" role="alert">{m}</p>
              ))}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

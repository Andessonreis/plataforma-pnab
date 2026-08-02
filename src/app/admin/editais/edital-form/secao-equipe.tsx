'use client'

import { useEditalForm } from './edital-form-context'
import { EquipeSelector } from '../equipe-selector'

export function SecaoEquipe() {
  const {
    habilitadoresSelecionados, setHabilitadoresSelecionados,
    avaliadoresSelecionados, setAvaliadoresSelecionados,
  } = useEditalForm()

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Defina quais habilitadores e avaliadores trabalham neste edital. Se nenhum for atribuído, todos com o
        respectivo cargo terão acesso.
      </p>

      <div className="space-y-6">
        <EquipeSelector funcao="HABILITADOR" value={habilitadoresSelecionados} onChange={setHabilitadoresSelecionados} />
        <div className="border-t border-slate-200" />
        <EquipeSelector funcao="AVALIADOR" value={avaliadoresSelecionados} onChange={setAvaliadoresSelecionados} />
      </div>
    </div>
  )
}

'use client'

import { Card } from '@client/components/ui'
import { SectionHeader } from '../SectionHeader'
import { SeletorMembros } from './SeletorMembros'
import type { MembroEquipe } from '../constants'

export function SecaoEquipe({
  collapsed,
  onToggle,
  loadingEquipe,
  allHabilitadores,
  habilitadoresSelecionados,
  setHabilitadoresSelecionados,
  selectedHabilitadorId,
  setSelectedHabilitadorId,
  allAvaliadores,
  avaliadoresSelecionados,
  setAvaliadoresSelecionados,
  selectedAvaliadorId,
  setSelectedAvaliadorId,
}: {
  collapsed: boolean
  onToggle: () => void
  loadingEquipe: boolean
  allHabilitadores: MembroEquipe[]
  habilitadoresSelecionados: MembroEquipe[]
  setHabilitadoresSelecionados: (updater: (prev: MembroEquipe[]) => MembroEquipe[]) => void
  selectedHabilitadorId: string
  setSelectedHabilitadorId: (v: string) => void
  allAvaliadores: MembroEquipe[]
  avaliadoresSelecionados: MembroEquipe[]
  setAvaliadoresSelecionados: (updater: (prev: MembroEquipe[]) => MembroEquipe[]) => void
  selectedAvaliadorId: string
  setSelectedAvaliadorId: (v: string) => void
}) {
  return (
    <Card padding="sm" className="sm:p-6">
      <SectionHeader number={9} title="Equipe do Edital" collapsed={collapsed} onToggle={onToggle}>
        <p className="text-sm text-slate-500 mt-2">
          Defina quais habilitadores e avaliadores trabalham neste edital. Se nenhum for atribuído, todos com o respectivo cargo terão acesso.
        </p>
      </SectionHeader>

      {!collapsed && (
        <div className="space-y-6 mt-4">
          <SeletorMembros
            titulo="Habilitadores"
            labelSingular="habilitador"
            labelPluralSufixo="es"
            selectId="select-hab-form"
            selectLabel="Selecionar habilitador"
            selecionados={habilitadoresSelecionados}
            todos={allHabilitadores}
            loading={loadingEquipe}
            selectedId={selectedHabilitadorId}
            setSelectedId={setSelectedHabilitadorId}
            onAdd={membro => setHabilitadoresSelecionados(prev => [...prev, membro])}
            onRemove={id => setHabilitadoresSelecionados(prev => prev.filter(h => h.id !== id))}
            emptyCadastroLabel="Nenhum habilitador cadastrado"
            emptyTodosLabel="Todos os habilitadores já foram adicionados"
          />

          <div className="border-t border-slate-200" />

          <SeletorMembros
            titulo="Avaliadores"
            labelSingular="avaliador"
            labelPluralSufixo="es"
            selectId="select-aval-form"
            selectLabel="Selecionar avaliador"
            selecionados={avaliadoresSelecionados}
            todos={allAvaliadores}
            loading={loadingEquipe}
            selectedId={selectedAvaliadorId}
            setSelectedId={setSelectedAvaliadorId}
            onAdd={membro => setAvaliadoresSelecionados(prev => [...prev, membro])}
            onRemove={id => setAvaliadoresSelecionados(prev => prev.filter(a => a.id !== id))}
            emptyCadastroLabel="Nenhum avaliador cadastrado"
            emptyTodosLabel="Todos os avaliadores já foram adicionados"
          />
        </div>
      )}
    </Card>
  )
}

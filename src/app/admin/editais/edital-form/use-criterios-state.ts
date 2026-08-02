import { useState } from 'react'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'

export function useCriteriosState(initial?: { criteriosAvaliacao?: CriterioAvaliacao[]; formulaAvaliacao?: string }) {
  const [criteriosAvaliacao, setCriteriosAvaliacao] = useState<CriterioAvaliacao[]>(initial?.criteriosAvaliacao ?? [])
  const [formulaAvaliacao, setFormulaAvaliacao] = useState(initial?.formulaAvaliacao ?? '')

  function addCriterio() {
    setCriteriosAvaliacao((prev) => [...prev, { criterio: '', peso: 0, notaMax: 0, descricao: '', bloco: '' }])
  }

  function duplicarUltimoCriterio() {
    setCriteriosAvaliacao((prev) => {
      const last = prev[prev.length - 1]
      return [...prev, { criterio: '', peso: 0, notaMax: 0, descricao: '', bloco: last?.bloco ?? '' }]
    })
  }

  function removeCriterio(index: number) {
    setCriteriosAvaliacao((prev) => prev.filter((_, i) => i !== index))
  }

  function updateCriterio(index: number, field: keyof CriterioAvaliacao, value: unknown) {
    setCriteriosAvaliacao((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  return {
    criteriosAvaliacao, setCriteriosAvaliacao,
    formulaAvaliacao, setFormulaAvaliacao,
    addCriterio,
    duplicarUltimoCriterio,
    removeCriterio,
    updateCriterio,
  }
}

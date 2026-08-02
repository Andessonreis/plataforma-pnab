import { useState } from 'react'
import type { CampoFormulario } from '@/types/campo-formulario'

export function useCamposFormularioState(initial?: CampoFormulario[]) {
  const [camposFormulario, setCamposFormulario] = useState<CampoFormulario[]>(initial ?? [])

  function addCampoFormulario() {
    setCamposFormulario((prev) => [
      ...prev,
      { nome: '', label: '', tipo: 'texto', obrigatorio: false, placeholder: '', opcoes: [], hint: '', tiposProponente: [] },
    ])
  }

  function removeCampoFormulario(index: number) {
    setCamposFormulario((prev) => prev.filter((_, i) => i !== index))
  }

  function updateCampoFormulario(index: number, field: keyof CampoFormulario, value: unknown) {
    setCamposFormulario((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  return { camposFormulario, setCamposFormulario, addCampoFormulario, removeCampoFormulario, updateCampoFormulario }
}

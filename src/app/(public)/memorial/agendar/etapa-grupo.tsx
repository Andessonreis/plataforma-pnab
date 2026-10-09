'use client'

import { useState, type FormEvent } from 'react'
import { ResumoErros } from '@/components/formulario-dinamico/resumo-erros'
import { CAMPOS_GRUPO, validarGrupo, type DadosVisita, type ErrosVisita } from './dados-visita'
import { BotoesEtapa } from './botoes-etapa'
import { CamposGrupo } from './campos-grupo'
import { CamposResponsavel } from './campos-responsavel'

interface EtapaGrupoProps {
  dados: DadosVisita
  maxPessoas: number
  aoMudar: (parcial: Partial<DadosVisita>) => void
  aoVoltar: () => void
  aoContinuar: () => void
}

const CAMPOS_RESUMO = CAMPOS_GRUPO.map((c) => ({ ...c, tipo: 'texto' as const }))

// Borda dos campos escurecida no mesmo padrão do formulário de contato: a cinza do
// componente compartilhado não chega a 3:1 sobre o branco.
const BORDA_CAMPOS =
  "[&_input:not([aria-invalid='true'])]:border-tinta-900/50 [&_select:not([aria-invalid='true'])]:border-tinta-900/50 [&_textarea:not([aria-invalid='true'])]:border-tinta-900/50"

export function EtapaGrupo({ dados, maxPessoas, aoMudar, aoVoltar, aoContinuar }: EtapaGrupoProps) {
  const [erros, setErros] = useState<ErrosVisita>({})
  const [tentativa, setTentativa] = useState(0)

  function mudar(parcial: Partial<DadosVisita>) {
    aoMudar(parcial)
    setErros((atual) => {
      const resto = { ...atual }
      for (const chave of Object.keys(parcial)) delete resto[chave as keyof DadosVisita]
      return resto
    })
  }

  function continuar(e: FormEvent) {
    e.preventDefault()
    const encontrados = validarGrupo(dados, maxPessoas)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return setTentativa((t) => t + 1)
    aoContinuar()
  }

  return (
    <form onSubmit={continuar} noValidate className={BORDA_CAMPOS}>
      <h2 className="titulo text-2xl text-tinta-900 sm:text-3xl">Quem vem na visita</h2>
      <p className="mt-2 text-sm leading-relaxed text-tinta-700">
        Campos com asterisco são obrigatórios. Os dados de contato servem só para a equipe falar com você sobre a visita.
      </p>

      <CamposGrupo dados={dados} erros={erros} maxPessoas={maxPessoas} aoMudar={mudar} />
      <CamposResponsavel dados={dados} erros={erros} aoMudar={mudar} />

      <div className="mt-8">
        <ResumoErros campos={CAMPOS_RESUMO} erros={erros} tentativa={tentativa} />
      </div>
      <BotoesEtapa aoVoltar={aoVoltar} />
    </form>
  )
}

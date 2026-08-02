'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { EditalStatus } from '@prisma/client'
import type { CronogramaItem, CronogramaFormItem } from '@/types/cronograma'
import { cronogramaToFormItems, validateCronogramaOrder } from '@/lib/utils/cronograma'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { MembroEquipe } from '../equipe-selector'
import { useCategoriasState } from './use-categorias-state'
import { useCamposFormularioState } from './use-campos-formulario-state'
import { useCriteriosState } from './use-criterios-state'

export interface EditalFormInitialData {
  id: string
  titulo: string
  resumo: string
  ano: number
  valorTotal: string
  categorias: string[]
  categoriasConfig?: CategoriaConfig[] | null
  acoesAfirmativas: string
  regrasElegibilidade: string
  cronograma: CronogramaItem[]
  camposFormulario: CampoFormulario[]
  etapasCustomizadas?: EtapaCustomizada[]
  status: EditalStatus
  vagasContemplados: number | null
  vagasSuplentes: number | null
  criteriosAvaliacao?: CriterioAvaliacao[]
  formulaAvaliacao?: string
  tiposAnexo?: TipoAnexo[] | null
  notaMinima?: number | null
  tiposProponentePermitidos?: string[]
  initialAvaliadores?: MembroEquipe[]
  initialHabilitadores?: MembroEquipe[]
}

function useEditalFormState(initialData?: EditalFormInitialData) {
  const currentYear = new Date().getFullYear()

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [resumo, setResumo] = useState(initialData?.resumo ?? '')
  const [ano, setAno] = useState(String(initialData?.ano ?? currentYear))
  const [valorTotal, setValorTotal] = useState(initialData?.valorTotal ?? '')
  const [regrasElegibilidade, setRegrasElegibilidade] = useState(initialData?.regrasElegibilidade ?? '')
  const [acoesAfirmativas, setAcoesAfirmativas] = useState(initialData?.acoesAfirmativas ?? '')
  const [status, setStatus] = useState<EditalStatus>(initialData?.status ?? 'RASCUNHO')

  const [cronogramaItems, setCronogramaItems] = useState<CronogramaFormItem[]>(() =>
    initialData?.cronograma && initialData.cronograma.length > 0
      ? cronogramaToFormItems(initialData.cronograma)
      : [],
  )
  const cronogramaWarnings = useMemo(() => validateCronogramaOrder(cronogramaItems), [cronogramaItems])

  const [vagasContemplados, setVagasContemplados] = useState(
    initialData?.vagasContemplados != null ? String(initialData.vagasContemplados) : '',
  )
  const [vagasSuplentes, setVagasSuplentes] = useState(
    initialData?.vagasSuplentes != null ? String(initialData.vagasSuplentes) : '',
  )
  const [etapasCustomizadas, setEtapasCustomizadas] = useState<EtapaCustomizada[]>(
    initialData?.etapasCustomizadas ?? [],
  )
  const [tiposAnexo, setTiposAnexo] = useState<TipoAnexo[]>(initialData?.tiposAnexo ?? [])
  const [notaMinima, setNotaMinima] = useState(
    initialData?.notaMinima != null ? String(initialData.notaMinima) : '',
  )
  const [tiposProponentePermitidos, setTiposProponentePermitidos] = useState<string[]>(
    initialData?.tiposProponentePermitidos ?? [],
  )

  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<MembroEquipe[]>(
    initialData?.initialAvaliadores ?? [],
  )
  const [habilitadoresSelecionados, setHabilitadoresSelecionados] = useState<MembroEquipe[]>(
    initialData?.initialHabilitadores ?? [],
  )

  const categoriasState = useCategoriasState(initialData)
  const camposFormularioState = useCamposFormularioState(initialData?.camposFormulario)
  const criteriosState = useCriteriosState(initialData)

  return {
    titulo, setTitulo,
    resumo, setResumo,
    ano, setAno,
    valorTotal, setValorTotal,
    regrasElegibilidade, setRegrasElegibilidade,
    acoesAfirmativas, setAcoesAfirmativas,
    status, setStatus,
    cronogramaItems, setCronogramaItems, cronogramaWarnings,
    vagasContemplados, setVagasContemplados,
    vagasSuplentes, setVagasSuplentes,
    etapasCustomizadas, setEtapasCustomizadas,
    tiposAnexo, setTiposAnexo,
    notaMinima, setNotaMinima,
    tiposProponentePermitidos, setTiposProponentePermitidos,
    avaliadoresSelecionados, setAvaliadoresSelecionados,
    habilitadoresSelecionados, setHabilitadoresSelecionados,
    ...categoriasState,
    ...camposFormularioState,
    ...criteriosState,
  }
}

export type EditalFormContextValue = ReturnType<typeof useEditalFormState>

const EditalFormContext = createContext<EditalFormContextValue | null>(null)

export function EditalFormProvider({
  initialData,
  children,
}: {
  initialData?: EditalFormInitialData
  children: ReactNode
}) {
  const state = useEditalFormState(initialData)
  return <EditalFormContext.Provider value={state}>{children}</EditalFormContext.Provider>
}

export function useEditalForm(): EditalFormContextValue {
  const ctx = useContext(EditalFormContext)
  if (!ctx) throw new Error('useEditalForm precisa estar dentro de <EditalFormProvider>')
  return ctx
}

'use client'

import type { CampoFormulario } from '@/types/campo-formulario'
import { BlocoInfo } from './bloco-info'
import { CampoTabelaRevisao } from './campo-tabela-revisao'
import { CampoGrupoRevisao } from './campo-grupo-revisao'

type LinhaValor = Record<string, unknown>

// Modo leitura para elementos estruturais (info/tabela/grupo_repetivel) — usado
// na revisão da inscrição (proponente) e no detalhe de dados submetidos (admin/avaliador).
export function CampoEstruturaRevisao({
  campo,
  value,
}: {
  campo: CampoFormulario
  value: unknown
}) {
  if (campo.tipo === 'info') {
    return <BlocoInfo campo={campo} />
  }

  const linhas = Array.isArray(value) ? (value as LinhaValor[]) : []

  if (campo.tipo === 'tabela') {
    return <CampoTabelaRevisao campo={campo} linhas={linhas} />
  }

  if (campo.tipo === 'grupo_repetivel') {
    return <CampoGrupoRevisao campo={campo} linhas={linhas} />
  }

  return null
}

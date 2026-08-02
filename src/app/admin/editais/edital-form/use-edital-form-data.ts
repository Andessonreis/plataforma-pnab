'use client'

import { useFetchList } from '@/hooks/use-fetch-list'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'

export interface CategoriaDisponivel {
  id: string
  nome: string
}

export interface TipoAnexoDisponivel {
  id: string
  tipo: string
  label: string
  obrigatorio: boolean
  tag: string
}

export interface TemplateAvaliacao {
  id: string
  nome: string
  criterios: CriterioAvaliacao[]
  formula: string | null
}

interface TemplateAvaliacaoRaw {
  id: string
  nome: string
  criterios: unknown
  formula: string | null
}

/** Consolida os fetches de listas de apoio do formulário de edital (categorias, tipos de anexo, templates). */
export function useEditalFormData() {
  const categorias = useFetchList<CategoriaDisponivel>('/api/admin/configuracoes/categorias')
  const tiposAnexo = useFetchList<TipoAnexoDisponivel>('/api/admin/configuracoes/tipos-anexo')
  const templates = useFetchList<TemplateAvaliacao>(
    '/api/admin/configuracoes/templates-avaliacao',
    (raw) =>
      (raw as TemplateAvaliacaoRaw[]).map((t) => ({
        id: t.id,
        nome: t.nome,
        criterios: Array.isArray(t.criterios) ? (t.criterios as CriterioAvaliacao[]) : JSON.parse(t.criterios as string),
        formula: t.formula,
      })),
  )

  return {
    categoriasDisponiveis: categorias.data,
    loadingCategorias: categorias.loading,
    tiposAnexoDisponiveis: tiposAnexo.data,
    templatesDisponiveis: templates.data,
  }
}

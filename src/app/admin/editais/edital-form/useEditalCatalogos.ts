'use client'

import { useState, useEffect } from 'react'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'
import type { MembroEquipe } from './constants'

export interface TipoAnexoDisponivel {
  id: string
  tipo: string
  label: string
  obrigatorio: boolean
  tag: string
}

export interface TemplateDisponivel {
  id: string
  nome: string
  criterios: CriterioAvaliacao[]
  formula: string | null
}

export interface CategoriaDisponivel {
  id: string
  nome: string
}

export function useEditalCatalogos() {
  const [allAvaliadores, setAllAvaliadores] = useState<MembroEquipe[]>([])
  const [allHabilitadores, setAllHabilitadores] = useState<MembroEquipe[]>([])
  const [loadingEquipe, setLoadingEquipe] = useState(true)

  const [tiposAnexoDisponiveis, setTiposAnexoDisponiveis] = useState<TipoAnexoDisponivel[]>([])

  const [templatesDisponiveis, setTemplatesDisponiveis] = useState<TemplateDisponivel[]>([])

  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<CategoriaDisponivel[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)

  useEffect(() => {
    async function fetchElegíveis() {
      try {
        const [resAval, resHab] = await Promise.all([
          fetch('/api/v1/avaliadores'),
          fetch('/api/admin/habilitadores'),
        ])
        if (resAval.ok) {
          const json = await resAval.json()
          setAllAvaliadores(json.data.map((a: MembroEquipe) => ({
            id: a.id, nome: a.nome, email: a.email,
          })))
        }
        if (resHab.ok) {
          const json = await resHab.json()
          setAllHabilitadores(json.data.map((h: MembroEquipe) => ({
            id: h.id, nome: h.nome, email: h.email,
          })))
        }
      } catch {
        // silencioso — seção de equipe fica vazia
      } finally {
        setLoadingEquipe(false)
      }
    }
    fetchElegíveis()
  }, [])

  // Carregar tipos de anexo disponíveis
  useEffect(() => {
    async function fetchTiposAnexo() {
      try {
        const res = await fetch('/api/admin/configuracoes/tipos-anexo')
        if (res.ok) {
          const json = await res.json()
          setTiposAnexoDisponiveis(json.data)
        }
      } catch {
        // silencioso
      }
    }
    fetchTiposAnexo()
  }, [])

  // Carregar templates de avaliação
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/admin/configuracoes/templates-avaliacao')
        if (res.ok) {
          const json = await res.json()
          setTemplatesDisponiveis(json.data.map((t: { id: string; nome: string; criterios: unknown; formula: string | null }) => ({
            id: t.id,
            nome: t.nome,
            criterios: Array.isArray(t.criterios) ? t.criterios : JSON.parse(t.criterios as string),
            formula: t.formula,
          })))
        }
      } catch {
        // silencioso
      }
    }
    fetchTemplates()
  }, [])

  // Carregar categorias disponíveis
  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/admin/configuracoes/categorias')
        if (res.ok) {
          const json = await res.json()
          setCategoriasDisponiveis(json.data)
        }
      } catch {
        // silencioso
      } finally {
        setLoadingCategorias(false)
      }
    }
    fetchCategorias()
  }, [])

  return {
    allAvaliadores,
    allHabilitadores,
    loadingEquipe,
    tiposAnexoDisponiveis,
    templatesDisponiveis,
    categoriasDisponiveis,
    loadingCategorias,
  }
}

import { useState } from 'react'
import type { CategoriaConfig } from '@/types/categoria-config'
import { COTAS_SUGERIDAS } from './constants'

export function useCategoriasState(initial?: {
  categorias?: string[]
  categoriasConfig?: CategoriaConfig[] | null
}) {
  const [categorias, setCategorias] = useState<string[]>(initial?.categorias ?? [])
  const [categoriasConfig, setCategoriasConfig] = useState<CategoriaConfig[]>(initial?.categoriasConfig ?? [])

  function toggleCategoria(cat: string) {
    setCategorias((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
    setCategoriasConfig((prev) => prev.filter((c) => c.nome !== cat))
  }

  function getCategoriaConfig(nome: string) {
    return categoriasConfig.find((c) => c.nome === nome)
  }

  function ativarConfigCategoria(nome: string) {
    setCategoriasConfig((prev) =>
      prev.some((c) => c.nome === nome)
        ? prev
        : [
            ...prev,
            { nome, vagasAmplaConcorrencia: 0, cotas: COTAS_SUGERIDAS, valorPorProjeto: null, valorTotalCategoria: 0 },
          ],
    )
  }

  function removerConfigCategoria(nome: string) {
    setCategoriasConfig((prev) => prev.filter((c) => c.nome !== nome))
  }

  function updateCategoriaConfig(nome: string, patch: Partial<CategoriaConfig>) {
    setCategoriasConfig((prev) => prev.map((c) => (c.nome === nome ? { ...c, ...patch } : c)))
  }

  function updateCotaConfig(nome: string, key: string, patch: Partial<CategoriaConfig['cotas'][number]>) {
    setCategoriasConfig((prev) =>
      prev.map((c) =>
        c.nome === nome ? { ...c, cotas: c.cotas.map((cota) => (cota.key === key ? { ...cota, ...patch } : cota)) } : c,
      ),
    )
  }

  function addCotaConfig(nome: string) {
    setCategoriasConfig((prev) =>
      prev.map((c) =>
        c.nome === nome
          ? { ...c, cotas: [...c.cotas, { key: `cota_${c.cotas.length + 1}`, label: '', vagas: 0 }] }
          : c,
      ),
    )
  }

  function removeCotaConfig(nome: string, key: string) {
    setCategoriasConfig((prev) =>
      prev.map((c) => (c.nome === nome ? { ...c, cotas: c.cotas.filter((cota) => cota.key !== key) } : c)),
    )
  }

  return {
    categorias, setCategorias,
    categoriasConfig, setCategoriasConfig,
    toggleCategoria,
    getCategoriaConfig,
    ativarConfigCategoria,
    removerConfigCategoria,
    updateCategoriaConfig,
    updateCotaConfig,
    addCotaConfig,
    removeCotaConfig,
  }
}

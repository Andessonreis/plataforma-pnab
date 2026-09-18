'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import type { ItemBonusConfig } from '@/types/bonus-config'

export interface InscricaoParaBonus {
  inscricaoId: string
  editalId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  evidencias: string[]
  bonusItens: string[]
}

interface Props {
  linha: InscricaoParaBonus
  itens: ItemBonusConfig[]
  maxItens: number | null
}

/** Uma inscrição: evidências declaradas + marcação dos itens validados pela comissão. */
export function LinhaDefinirBonus({ linha, itens, maxItens }: Props) {
  const [marcados, setMarcados] = useState<string[]>(linha.bonusItens)
  const [salvando, setSalvando] = useState(false)

  const pontos = itens
    .filter((i) => marcados.includes(i.key))
    .reduce((soma, i) => soma + i.pontos, 0)

  async function alternar(key: string) {
    const novos = marcados.includes(key)
      ? marcados.filter((k) => k !== key)
      : [...marcados, key]

    if (maxItens != null && novos.length > maxItens) {
      toast({
        variant: 'destructive',
        title: `O edital admite no máximo ${maxItens} ${maxItens === 1 ? 'item' : 'itens'} de bonificação.`,
      })
      return
    }

    const anteriores = marcados
    setMarcados(novos)
    setSalvando(true)
    try {
      const res = await fetch(`/api/admin/inscricoes/${linha.inscricaoId}/bonus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusItens: novos }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMarcados(anteriores)
        toast({ variant: 'destructive', title: data.message ?? 'Não foi possível salvar.' })
      }
    } catch {
      setMarcados(anteriores)
      toast({ variant: 'destructive', title: 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-3 px-3">
        {/* Leva pra inscrição inteira: é onde a comissão confere os anexos de
            autodeclaração antes de marcar o bônus — não dá pra validar item de
            bonificação sem olhar o documento que o proponente enviou. */}
        <Link
          href={`/admin/inscricoes/${linha.inscricaoId}?from=bonus&editalId=${linha.editalId}`}
          className="group block focus-visible:outline-2 rounded"
        >
          <span className="font-mono text-xs text-brand-600 group-hover:text-brand-700">
            {linha.numero}
          </span>
          <span className="block text-sm font-medium text-slate-900 mt-0.5 group-hover:text-brand-700 group-hover:underline">
            {linha.proponenteNome}
          </span>
          <span className="block text-xs text-slate-500">{linha.categoria ?? '—'}</span>
        </Link>
        <span className="block text-[11px] text-slate-400 mt-1">Abrir inscrição e anexos</span>
      </td>
      <td className="py-3 px-3">
        {linha.evidencias.length === 0 ? (
          <span className="text-xs text-amber-700">Nada declarado na inscrição — conferir anexos</span>
        ) : (
          <ul className="text-xs text-slate-600 space-y-0.5">
            {linha.evidencias.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-col gap-1.5">
          {itens.map((item) => (
            <label key={item.key} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus-visible:outline-2"
                checked={marcados.includes(item.key)}
                disabled={salvando}
                onChange={() => alternar(item.key)}
              />
              <span>{item.label} <span className="text-slate-400">(+{item.pontos})</span></span>
            </label>
          ))}
        </div>
      </td>
      <td className="py-3 px-3 text-right tabular-nums font-semibold text-emerald-700">
        {pontos > 0 ? `+${pontos}` : '—'}
      </td>
    </tr>
  )
}

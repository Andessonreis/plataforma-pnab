'use client'

import { useState, type FormEvent } from 'react'
import { Button, Card, Input } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { carrosselSchema, INTERVALO_CARROSSEL, type ConfigCarrossel } from '@/lib/schemas/carrossel'

/**
 * Ritmo da abertura da home: quanto tempo cada slide fica antes de trocar
 * sozinho, ou se troca de todo. Conta a partir do fim da transição, então
 * "5 segundos" são 5 segundos de leitura com o slide já inteiro na tela.
 */
export function PainelCarrossel({ inicial }: { inicial: ConfigCarrossel }) {
  const [segundos, setSegundos] = useState(String(inicial.intervaloSegundos))
  const [automatico, setAutomatico] = useState(inicial.automatico)
  const [erro, setErro] = useState<string>()
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const lido = carrosselSchema.safeParse({ intervaloSegundos: segundos, automatico })
    if (!lido.success) return setErro(lido.error.issues[0]?.message)

    setErro(undefined)
    setSalvando(true)
    try {
      const res = await fetch('/api/admin/slides/carrossel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lido.data),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.fieldErrors?.intervaloSegundos)
        toast({ variant: 'destructive', title: 'Não foi possível salvar', description: data.message })
        return
      }
      toast({ title: 'Tempo de troca salvo', description: 'A página inicial já usa o novo tempo.' })
    } catch {
      toast({ variant: 'destructive', title: 'Erro de conexão', description: 'Verifique sua internet e tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card padding="sm" className="mb-4 sm:mb-6 sm:p-5">
      <form onSubmit={salvar} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <Input
            id="carrossel-intervalo"
            label="Tempo de troca (segundos)"
            type="number"
            inputMode="numeric"
            min={INTERVALO_CARROSSEL.min}
            max={INTERVALO_CARROSSEL.max}
            value={segundos}
            onChange={(e) => setSegundos(e.target.value)}
            disabled={!automatico}
            error={erro}
            hint={`De ${INTERVALO_CARROSSEL.min} a ${INTERVALO_CARROSSEL.max}. Padrão: 5.`}
          />
        </div>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 sm:mb-7">
          <input
            type="checkbox"
            checked={automatico}
            onChange={(e) => setAutomatico(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 accent-brand-600"
          />
          <span className="text-sm font-medium text-slate-700">Trocar os slides sozinho</span>
        </label>
        <Button type="submit" size="sm" loading={salvando} className="sm:mb-7">
          Salvar tempo
        </Button>
      </form>
      <p className="mt-1 text-sm text-slate-600">
        Quem visita pode pausar a troca. Com a troca desligada, os slides mudam só pelos pontos.
      </p>
    </Card>
  )
}

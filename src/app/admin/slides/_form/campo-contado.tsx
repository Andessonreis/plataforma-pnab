'use client'

import { Input, Textarea } from '@/components/ui'

interface CampoContadoProps {
  id: string
  label: string
  valor: string
  onChange: (valor: string) => void
  /** Limite do `LIMITES_SLIDE` — o input não deixa passar dele. */
  max: number
  erro?: string
  dica?: string
  placeholder?: string
  obrigatorio?: boolean
  multilinha?: boolean
}

/**
 * Campo de texto com contador "usados/limite" na dica. O limite vem do quadro
 * fixo da home: quem escreve vê quanto espaço ainda tem, em vez de descobrir
 * depois que o texto foi cortado.
 */
export function CampoContado({ id, label, valor, onChange, max, erro, dica, placeholder, obrigatorio, multilinha }: CampoContadoProps) {
  const contador = `${valor.length}/${max} caracteres`
  const comum = {
    id,
    label,
    value: valor,
    maxLength: max,
    placeholder,
    required: obrigatorio,
    error: erro,
    hint: dica ? `${dica} · ${contador}` : contador,
  }

  return multilinha ? (
    <Textarea {...comum} rows={3} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <Input {...comum} onChange={(e) => onChange(e.target.value)} />
  )
}

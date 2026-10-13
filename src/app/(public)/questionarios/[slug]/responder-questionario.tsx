'use client'

import { useState } from 'react'
import { FormularioDinamico, type ResultadoEnvio } from '@/components/formulario-dinamico'
import type { RespostasFormulario } from '@/lib/forms'
import type { CampoFormulario } from '@/types/campo-formulario'
import { RespostaRegistrada } from './resposta-registrada'

interface ResponderQuestionarioProps {
  slug: string
  campos: CampoFormulario[]
}

interface Comprovante {
  protocolo: string
  mensagemSucesso: string | null
}

/**
 * A borda dos campos é escurecida aqui (`tinta-900/50`), como no formulário de
 * contato: a borda padrão do componente fica abaixo de 3:1 sobre o branco. O
 * erro (`aria-invalid`) continua com a borda vermelha.
 */
const CONTRASTE_BORDAS =
  "[&_input:not([aria-invalid='true'])]:border-tinta-900/50 [&_select:not([aria-invalid='true'])]:border-tinta-900/50 [&_textarea:not([aria-invalid='true'])]:border-tinta-900/50"

export function ResponderQuestionario({ slug, campos }: ResponderQuestionarioProps) {
  const [comprovante, setComprovante] = useState<Comprovante | null>(null)
  const [rodada, setRodada] = useState(0)

  async function enviar(dados: RespostasFormulario): Promise<ResultadoEnvio> {
    const res = await fetch(`/api/v1/questionarios/publico/${encodeURIComponent(slug)}/respostas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dados }),
    })
    const corpo = await res.json().catch(() => ({}))
    if (res.status === 429) return { mensagem: 'Muitos envios seguidos. Aguarde um minuto e tente de novo.' }
    if (res.status === 401) return { mensagem: 'Entre na sua conta para enviar este questionário.' }
    if (!res.ok) {
      return { fieldErrors: corpo.fieldErrors, mensagem: corpo.fieldErrors ? undefined : corpo.message || 'Não foi possível enviar. Tente de novo.' }
    }
    setComprovante(corpo.data)
  }

  return (
    <div aria-live="polite">
      {comprovante ? (
        <RespostaRegistrada
          protocolo={comprovante.protocolo}
          mensagem={comprovante.mensagemSucesso}
          aoResponderDeNovo={() => {
            setComprovante(null)
            setRodada((r) => r + 1)
          }}
        />
      ) : (
        <FormularioDinamico key={rodada} campos={campos} onSubmit={enviar} className={CONTRASTE_BORDAS} />
      )}
    </div>
  )
}

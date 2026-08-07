'use client'

import { useState } from 'react'
import { Aviso, Button } from '@/components/ui'
import { CamposIdentificacao } from './campos-identificacao'
import { CamposMensagem } from './campos-mensagem'
import { ProtocoloEmitido } from './protocolo-emitido'
import { ResumoErros, type ErrosContato } from './resumo-erros'

interface FormularioContatoProps {
  editais: { id: string; titulo: string }[]
}

const CAMPOS_INICIAIS = {
  nomeContato: '',
  emailContato: '',
  editalId: '',
  assunto: '',
  mensagem: '',
}

type CamposFormulario = typeof CAMPOS_INICIAIS

function validar(dados: CamposFormulario): ErrosContato {
  const erros: ErrosContato = {}

  if (!dados.nomeContato.trim()) erros.nomeContato = 'Informe seu nome.'
  if (!dados.emailContato.trim() || !dados.emailContato.includes('@')) {
    erros.emailContato = 'Informe um e-mail válido.'
  }
  if (!dados.assunto.trim()) erros.assunto = 'Informe o assunto da mensagem.'
  if (!dados.mensagem.trim() || dados.mensagem.trim().length < 10) {
    erros.mensagem = 'A mensagem deve ter no mínimo 10 caracteres.'
  }

  return erros
}

/**
 * Orquestra o formulário de contato: validação por campo (todos os erros de
 * uma vez, não um por tentativa), envio e a troca para o comprovante.
 *
 * A borda dos campos é sobrescrita localmente para `tinta-900/50` — o padrão
 * `border-slate-300` do componente compartilhado dá **1,7:1** de contraste
 * sobre fundo branco (abaixo do mínimo de 3:1 do WCAG 1.4.11 para limites de
 * campo), calculado pela fórmula de luminância relativa do WCAG. `/50` foi a
 * primeira opacidade que passou (~3,3:1). O seletor poupa o estado de erro
 * (`aria-invalid`), que continua com a borda vermelha do componente.
 *
 * O `aria-live` no invólucro avisa quem usa leitor de tela quando o
 * formulário vira comprovante — sem ele a troca de conteúdo passa em
 * silêncio.
 */
export function FormularioContato({ editais }: FormularioContatoProps) {
  const [dados, setDados] = useState<CamposFormulario>(CAMPOS_INICIAIS)
  const [erros, setErros] = useState<ErrosContato>({})
  const [erroServidor, setErroServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [protocolo, setProtocolo] = useState('')

  function atualizarCampo(campo: keyof CamposFormulario, valor: string) {
    setDados((prev) => ({ ...prev, [campo]: valor }))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErroServidor('')

    const errosValidacao = validar(dados)
    setErros(errosValidacao)
    if (Object.keys(errosValidacao).length > 0) return

    setEnviando(true)

    try {
      const body: Record<string, string> = {
        nomeContato: dados.nomeContato.trim(),
        emailContato: dados.emailContato.trim(),
        assunto: dados.assunto.trim(),
        mensagem: dados.mensagem.trim(),
      }
      if (dados.editalId) body.editalId = dados.editalId

      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const resposta = await res.json()

      if (!res.ok) {
        setErroServidor(resposta.message || 'Erro ao enviar mensagem. Tente novamente.')
        return
      }

      setProtocolo(resposta.protocolo)
      setDados(CAMPOS_INICIAIS)
      setErros({})
    } catch {
      setErroServidor('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div aria-live="polite">
      {protocolo ? (
        <ProtocoloEmitido protocolo={protocolo} aoEscreverOutra={() => setProtocolo('')} />
      ) : (
        <form
          onSubmit={enviar}
          noValidate
          className="[&_input:not([aria-invalid='true'])]:border-tinta-900/50 [&_select:not([aria-invalid='true'])]:border-tinta-900/50 [&_textarea:not([aria-invalid='true'])]:border-tinta-900/50"
        >
          <CamposIdentificacao
            nomeContato={dados.nomeContato}
            emailContato={dados.emailContato}
            erroNome={erros.nomeContato}
            erroEmail={erros.emailContato}
            aoMudarNome={(v) => atualizarCampo('nomeContato', v)}
            aoMudarEmail={(v) => atualizarCampo('emailContato', v)}
          />

          <CamposMensagem
            editais={editais}
            editalId={dados.editalId}
            assunto={dados.assunto}
            mensagem={dados.mensagem}
            erroAssunto={erros.assunto}
            erroMensagem={erros.mensagem}
            aoMudarEdital={(v) => atualizarCampo('editalId', v)}
            aoMudarAssunto={(v) => atualizarCampo('assunto', v)}
            aoMudarMensagem={(v) => atualizarCampo('mensagem', v)}
          />

          <div className="mt-8 space-y-5">
            <ResumoErros erros={erros} />
            {erroServidor && <Aviso tom="erro">{erroServidor}</Aviso>}

            <Button type="submit" loading={enviando} className="w-full" size="lg">
              Enviar mensagem
            </Button>

            <p className="text-center text-xs text-tinta-500">
              Ao enviar, você receberá um número de protocolo para acompanhamento. Respeitamos
              limites de envio para garantir a qualidade do atendimento.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}

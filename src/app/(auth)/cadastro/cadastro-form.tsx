'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Aviso, Button } from '@/components/ui'
import { useCadastro } from './use-cadastro'
import { TrilhaPassos } from './trilha-passos'
import { PassoIdentificacao } from './passo-identificacao'
import { PassoContato } from './passo-contato'
import { PassoAcesso } from './passo-acesso'

/**
 * Ficha de cadastro do proponente, em três etapas.
 *
 * Aqui só mora a costura: qual grupo de campos aparece, os avisos e as ações
 * do pé. O estado está em `useCadastro`, as regras de cada etapa em
 * `validacao`, e cada grupo de campos no seu componente.
 *
 * Os campos não visitados não ficam montados escondidos: um `hidden` deixaria
 * o autopreenchimento do navegador e o leitor de tela alcançando campo de
 * etapa que a pessoa ainda não abriu.
 */
/** Respeita quem pediu menos movimento no sistema. */
function comportamentoDeRolagem(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function CadastroForm() {
  const cadastro = useCadastro()
  const { passo, noUltimoPasso, avancar, voltar, enviando, erro, avisoUpload } = cadastro
  const inicio = useRef<HTMLDivElement>(null)
  const alerta = useRef<HTMLDivElement>(null)
  const primeiraRenderizacao = useRef(true)

  /* A etapa 2 é mais alta que a tela. Sem isto, quem vem dela para a etapa 3
     — que é curta — chega com a página rolada e vê papel em branco. */
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    inicio.current?.scrollIntoView({ block: 'start', behavior: comportamentoDeRolagem() })
  }, [passo])

  /* O impedimento nasce no pé de uma etapa longa: `role="alert"` avisa quem usa
     leitor de tela, e a rolagem avisa o resto. */
  useEffect(() => {
    if (erro) alerta.current?.scrollIntoView({ block: 'center', behavior: comportamentoDeRolagem() })
  }, [erro])

  return (
    <form onSubmit={avancar} className="space-y-5" noValidate>
      <div ref={inicio} className="scroll-mt-8">
        <TrilhaPassos passo={passo} />
      </div>

      {passo === 0 && <PassoIdentificacao cadastro={cadastro} />}
      {passo === 1 && <PassoContato cadastro={cadastro} />}
      {passo === 2 && <PassoAcesso cadastro={cadastro} />}

      {(erro || avisoUpload) && (
        <div ref={alerta} className="space-y-5">
          {erro && <Aviso tom="erro">{erro}</Aviso>}
          {avisoUpload && <Aviso tom="atencao">{avisoUpload}</Aviso>}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {passo > 0 && (
          <Button type="button" variant="outline" size="lg" onClick={voltar} className="sm:w-auto">
            Voltar
          </Button>
        )}
        <Button type="submit" loading={enviando} size="lg" className="flex-1">
          {noUltimoPasso ? 'Criar conta' : 'Continuar'}
        </Button>
      </div>

      <p className="border-t border-slate-200 pt-5 text-sm text-slate-500">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
        >
          Entrar
        </Link>
      </p>
    </form>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Aviso, Button } from '@/components/ui'
import { useCadastro } from './use-cadastro'
import { TrilhaPassos } from './trilha-passos'
import { PassoIdentificacao } from './passo-identificacao'
import { PassoContato } from './passo-contato'
import { PassoAcesso } from './passo-acesso'

/** Landmark estável de cada etapa — id previsível, gancho reservado para o tour guiado futuro. */
const ETAPAS = [
  { id: 'cadastro-etapa-identificacao', titulo: 'Identificação' },
  { id: 'cadastro-etapa-contato', titulo: 'Contato' },
  { id: 'cadastro-etapa-acesso', titulo: 'Acesso' },
] as const

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

      {/* O `h2` de cada etapa é redundante para quem enxerga — o título já vem
          de `TrilhaPassos` — mas dá o par heading+landmark estável que a tela
          não tinha, e reserva `data-tour` para o tour guiado futuro. */}
      {passo === 0 && (
        <section id={ETAPAS[0].id} aria-labelledby={`${ETAPAS[0].id}-titulo`} className="space-y-5">
          <h2 id={`${ETAPAS[0].id}-titulo`} className="sr-only">
            {ETAPAS[0].titulo}
          </h2>
          <PassoIdentificacao cadastro={cadastro} />
        </section>
      )}
      {passo === 1 && (
        <section id={ETAPAS[1].id} aria-labelledby={`${ETAPAS[1].id}-titulo`} className="space-y-5">
          <h2 id={`${ETAPAS[1].id}-titulo`} className="sr-only">
            {ETAPAS[1].titulo}
          </h2>
          <PassoContato cadastro={cadastro} />
        </section>
      )}
      {passo === 2 && (
        <section id={ETAPAS[2].id} aria-labelledby={`${ETAPAS[2].id}-titulo`} className="space-y-5">
          <h2 id={`${ETAPAS[2].id}-titulo`} className="sr-only">
            {ETAPAS[2].titulo}
          </h2>
          <PassoAcesso cadastro={cadastro} />
        </section>
      )}

      {(erro || avisoUpload) && (
        <div ref={alerta} className="space-y-5">
          {erro && <Aviso tom="erro">{erro}</Aviso>}
          {avisoUpload && <Aviso tom="atencao">{avisoUpload}</Aviso>}
        </div>
      )}

      {/* Fixa no rodapé abaixo de `sm`: a etapa de contato tem 9 campos, e sem
          isto quem está no celular rola a etapa inteira antes de ver o botão
          de avançar. Em telas maiores o cartão é curto e o problema não
          existe, então acima de `sm` a barra volta a ficar no fluxo normal. */}
      <div
        data-tour="cadastro-acoes"
        className={[
          'sticky bottom-0 -mx-6 flex flex-col-reverse gap-3 border-t-2 border-tinta-900/10',
          'bg-white/95 px-6 py-4 backdrop-blur [padding-bottom:max(1rem,env(safe-area-inset-bottom))]',
          'sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none',
          'sm:[padding-bottom:0]',
        ].join(' ')}
      >
        {passo > 0 && (
          <Button type="button" variant="outline" size="lg" onClick={voltar} className="sm:w-auto">
            Voltar
          </Button>
        )}
        <Button type="submit" loading={enviando} size="lg" className="flex-1">
          {noUltimoPasso ? 'Criar conta' : 'Continuar'}
        </Button>
      </div>

      <p className="border-t-2 border-tinta-900/10 pt-5 text-sm text-tinta-700">
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

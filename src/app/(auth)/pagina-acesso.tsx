import Image from 'next/image'
import type { ReactNode } from 'react'
import { PainelVitrine } from './painel-vitrine'

interface PaginaAcessoProps {
  titulo: string
  descricao: string
  children: ReactNode
}

/** Id do H1 do painel, para o `<form>` de cada tela se anunciar por ele via `aria-labelledby`. */
export const ID_TITULO_ACESSO = 'pagina-acesso-titulo'

/**
 * Moldura das telas de acesso: faixa de identidade no topo, formulário à
 * esquerda, vitrine à direita.
 *
 * A faixa de identidade é o que devolve a estas telas a citação visual que o
 * resto do portal público tem — símbolo da SECULT e o rótulo condensado da
 * identidade — sem reintroduzir a navegação inteira do site em cima de um
 * formulário de duas linhas. No celular, onde a vitrine ao lado não existe
 * (ela só aparece a partir de `lg`), a faixa carrega também a frase de
 * propósito que hoje só mora lá — é assim que o público majoritário, que
 * chega pelo celular, recebe a mesma mensagem institucional.
 *
 * `min-h-dvh` no lugar de `min-h-screen`: no Safari do iPhone `100vh` inclui
 * a barra de endereço, e a tela "pula" de altura ao rolar. `dvh` acompanha a
 * altura visível de verdade.
 *
 * O painel do formulário mora dentro de um cartão centrado na metade dele.
 * Antes ele ficava solto e encostado à esquerda de uma coluna larga, o que
 * deixava meia tela de branco parado à direita dele — o vazio não era
 * respiro, era um bug de alinhamento.
 *
 * As duas metades resolvem seu próprio espaço dentro de `<main>`, que herda a
 * altura restante da viewport por ser `flex-1` numa coluna flex: a esquerda
 * centrando o cartão, a direita preenchendo com imagem. Assim nenhuma das
 * duas depende do tamanho do formulário, que muda bastante entre entrar (dois
 * campos) e cadastrar (três etapas).
 */
export function PaginaAcesso({ titulo, descricao, children }: PaginaAcessoProps) {
  return (
    <div className="papel-textura flex min-h-dvh flex-col bg-papel-50">
      <header data-tour="acesso-identidade" className="shrink-0 bg-tinta-950 px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5">
          <Image
            src="/images/secult/simbolo-secult.png"
            alt=""
            width={659}
            height={800}
            className="h-7 w-auto sm:h-8"
            aria-hidden="true"
            priority
          />
          <span className="rotulo text-[0.8125rem] text-papel-50 sm:text-sm">Portal PNAB</span>
        </div>
        {/* Só no celular: em telas largas a mesma frase já mora na vitrine ao lado. */}
        <p className="mx-auto mt-1 max-w-6xl text-[0.8125rem] leading-snug text-papel-100/80 lg:hidden">
          A Política Nacional Aldir Blanc em Irecê.
        </p>
      </header>

      <main className="flex-1 lg:grid lg:grid-cols-2 lg:gap-3 lg:p-3">
        {/* `overflow-y-auto` na coluna, não na página: no cadastro o cartão passa
            da altura da tela, e sem isto a vitrine rolaria junto e sairia por
            cima da própria margem. */}
        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[27rem]">
            <header className="text-center">
              <p className="rotulo text-xs text-accent-800">Área do proponente</p>
              <h1 id={ID_TITULO_ACESSO} className="titulo mt-2 text-2xl text-tinta-950 sm:text-3xl">
                {titulo}
              </h1>
              <p className="mx-auto mt-3 max-w-[34ch] text-[0.9375rem] leading-relaxed text-tinta-700">
                {descricao}
              </p>
            </header>

            <section
              id="painel-acesso"
              aria-labelledby={ID_TITULO_ACESSO}
              className="mt-7 rounded-md border-2 border-tinta-900/10 bg-white p-6 sm:p-8"
            >
              {children}
            </section>
          </div>
        </div>

        <PainelVitrine />
      </main>

      <footer className="shrink-0 border-t-2 border-tinta-900/10 py-5">
        <p className="text-center text-[0.8125rem] leading-relaxed text-tinta-700">
          Secretaria de Cultura e Turismo · Prefeitura Municipal de Irecê/BA
        </p>
      </footer>
    </div>
  )
}

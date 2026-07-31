import Image from 'next/image'
import type { ReactNode } from 'react'
import { PainelVitrine } from './painel-vitrine'

interface PaginaAcessoProps {
  titulo: string
  descricao: string
  children: ReactNode
}

/**
 * Moldura das telas de acesso: formulário à esquerda, vitrine à direita.
 *
 * O formulário mora dentro de um cartão centrado na metade dele. Antes ele
 * ficava solto e encostado à esquerda de uma coluna larga, o que deixava meia
 * tela de branco parado à direita dele — o vazio não era respiro, era um bug
 * de alinhamento.
 *
 * As duas metades têm a mesma altura da janela e cada uma resolve o seu
 * espaço: a esquerda centrando o cartão, a direita preenchendo com imagem.
 * Assim nenhuma das duas depende do tamanho do formulário, que muda bastante
 * entre entrar (dois campos) e cadastrar (três etapas).
 */
export function PaginaAcesso({ titulo, descricao, children }: PaginaAcessoProps) {
  return (
    <div className="min-h-screen bg-papel-50 p-0 lg:grid lg:h-screen lg:grid-cols-2 lg:gap-3 lg:p-3">
      {/* `overflow-y-auto` na coluna, não na página: no cadastro o cartão passa
          da altura da tela, e sem isto a vitrine rolaria junto e sairia por
          cima da própria margem. */}
      <div className="flex min-h-screen flex-col justify-center px-5 py-12 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-[27rem]">
          <header className="text-center">
            {/* Marca, não atalho: o caminho de volta ao portal é um só, e mora
                no pé do formulário com rótulo escrito. Dois caminhos para o
                mesmo lugar só fazem a pessoa escolher. */}
            <span className="inline-flex items-center gap-2.5">
              <Image
                src="/images/secult/simbolo-secult.png"
                alt=""
                width={659}
                height={800}
                className="h-8 w-auto"
                aria-hidden="true"
                priority
              />
              <span className="text-[0.9375rem] font-semibold text-tinta-900">Portal PNAB</span>
            </span>

            <h1 className="mt-6 text-[1.75rem] font-semibold leading-tight tracking-tight text-tinta-950">
              {titulo}
            </h1>
            <p className="mx-auto mt-2 max-w-[34ch] text-[0.9375rem] leading-relaxed text-tinta-700">
              {descricao}
            </p>
          </header>

          <div className="mt-7 rounded-2xl border border-tinta-900/10 bg-white p-6 shadow-[0_1px_2px_rgba(41,23,11,0.04),0_12px_32px_-16px_rgba(41,23,11,0.18)] sm:p-8">
            {children}
          </div>

          <p className="mt-6 text-center text-[0.8125rem] leading-relaxed text-tinta-700">
            Secretaria de Cultura e Turismo · Prefeitura Municipal de Irecê/BA
          </p>
        </div>
      </div>

      <PainelVitrine />
    </div>
  )
}

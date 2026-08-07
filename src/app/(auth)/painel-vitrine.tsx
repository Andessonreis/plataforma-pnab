import type { CSSProperties } from 'react'
import Image from 'next/image'
import { Casario } from '@/components/ui/ornamentos'

const SELOS = ['PNAB', 'WCAG AA', '100% digital']

/**
 * Vitrine das telas de acesso: a metade direita da tela.
 *
 * A foto ocupa a parte de cima e o texto mora num bloco de tinta embaixo, em
 * vez de a imagem preencher o painel inteiro com o texto por cima. O motivo é
 * de resolução, não de gosto: as fotos do acervo são deitadas (2400x1200), e
 * esticar uma delas num painel em pé descarta quase toda a largura — sobrava
 * menos de um terço dos pixels originais para desenhar a coluna, e a foto
 * chegava borrada. Recortada numa faixa larga, ela é usada perto do formato
 * nativo e continua nítida até em tela de alta densidade.
 *
 * É uma peça encaixada — margem nas quatro bordas e canto arredondado — e não
 * um bloco sangrando até o fim da tela.
 *
 * Some abaixo de `lg`: num telefone empurraria o formulário para fora da
 * primeira tela.
 */
export function PainelVitrine() {
  return (
    <aside className="relative hidden flex-col overflow-hidden rounded-2xl bg-tinta-950 lg:flex">
      <div className="relative min-h-0 flex-1">
        {/* `sizes` não é a largura da caixa: o recorte de `object-cover` corta
            a foto deitada nas laterais e descarta cerca de 40% da largura
            servida. Pedindo 50vw sobrava menos de dois terços de pixel por
            ponto de tela e a foto saía macia. Pedindo 100vw a variante chega
            grande o bastante para o recorte ainda cobrir a caixa inteira.
            Abaixo de `lg` o painel não é renderizado, então ali pede o menor
            arquivo possível em vez de baixar uma foto que ninguém vê. */}
        {/* A panorâmica da cidade, e não uma foto de evento: o PNAB financia
            música, teatro, dança, artesanato e audiovisual, então eleger uma
            linguagem só na porta de entrada representa mal o resto. Também é a
            única do acervo sem nenhuma pessoa identificável — as fotos de
            festa trazem crianças em primeiro plano, e usar imagem de menor num
            portal público pede autorização dos responsáveis. */}
        <Image
          src="/images/cidade/panoramica-irece.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 100vw, 1px"
          className="object-cover object-center"
          aria-hidden="true"
          priority
        />
        {/* Esfuma a foto para dentro do bloco de tinta, para que a emenda entre
            os dois não vire uma linha reta atravessando o painel. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-tinta-950 to-transparent"
        />
      </div>

      <div className="shrink-0 p-10 text-white xl:p-12">
        <p className="max-w-[18ch] text-[1.875rem] font-semibold leading-[1.15] tracking-tight xl:text-[2.125rem]">
          A Política Nacional Aldir Blanc em Irecê.
        </p>
        <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-white/70">
          Publicação de editais, inscrição de propostas e acompanhamento dos processos culturais do
          município.
        </p>

        {/* `.selo` é o carimbo de anel duplo da identidade — mesma peça da
            numeração de `PassosInscricao` e dos ícones de `SecaoServicos`.
            `--selo-gap` acompanha o fundo (`tinta-950`) para o vão do anel
            ler como carimbo sobre tinta, e não como borda dupla achatada. */}
        <ul className="mt-7 flex flex-wrap gap-3">
          {SELOS.map((selo) => (
            <li
              key={selo}
              className="selo h-11 px-3.5 text-[0.8125rem] font-medium text-papel-100"
              style={{ '--selo-gap': '#190e07' } as CSSProperties}
            >
              {selo}
            </li>
          ))}
        </ul>

        {/* Assinatura da vitrine — mesmo papel que cumpre em `SecaoConceito`:
            fecha o bloco de texto institucional com o motivo autoral do
            casario sertanejo, no lugar de terminar em gradiente puro. */}
        <Casario className="mt-8 h-12 w-auto text-white/20" />
      </div>
    </aside>
  )
}

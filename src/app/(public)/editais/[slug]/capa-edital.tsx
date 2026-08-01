import Link from 'next/link'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { Carimbo, type TomCarimbo } from '@/components/ui/carimbo'
import { IconArrowRight, IconDownload } from '@/components/ui/icons'
import { IconePrazo, IconeRecursos } from '@/components/ui/ornamentos/icones'

interface CapaEditalProps {
  titulo: string
  ano: number
  categorias: string[]
  situacao: { label: string; tom: TomCarimbo }
  valorTotal: string | null
  vagas: string | null
  prazo: { rotulo: string; data: string } | null
  /** `null` quando não há inscrição a oferecer: edital fechado, ou sessão que
   *  não é de proponente. O destino muda com a sessão, por isso vem pronto. */
  inscricao: { href: string; rotulo: string } | null
  pdfUrl: string | null
}

const FOTOS = [
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
]

/** Uma medida do edital, na linha de balanço da capa. */
function Medida({
  rotulo,
  valor,
  icone,
}: {
  rotulo: string
  valor: string
  icone?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      {icone}
      <div>
        <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-papel-200/80">
          {rotulo}
        </dt>
        <dd className="titulo text-lg leading-tight text-accent-300">{valor}</dd>
      </div>
    </div>
  )
}

/**
 * Capa do edital.
 *
 * O cabeçalho anterior empilhava tudo sobre a faixa verde: situação, pílulas
 * de categoria, valor, vagas, prazo, data de publicação e o botão de baixar,
 * todos no mesmo peso e na mesma linha corrida. Aqui a capa separa o que
 * identifica o documento (situação, título, categorias) do que decide a
 * ação (valor, vagas, prazo), e deixa duas ações claras: inscrever e ler.
 *
 * Inscrever vem em âmbar, ler o PDF vem em contorno: são coisas diferentes, e
 * antes as duas apareciam como o mesmo botão translúcido.
 */
export function CapaEdital({
  titulo,
  ano,
  categorias,
  situacao,
  valorTotal,
  vagas,
  prazo,
  inscricao,
  pdfUrl,
}: CapaEditalProps) {
  return (
    <FolhaDeRosto
      fotos={FOTOS}
      trilha="Editais"
      chamada={`Chamamento público · ${ano}`}
      titulo={titulo}
    >
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Carimbo tom={situacao.tom} sobre="tinta">
          {situacao.label}
        </Carimbo>
        {categorias.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-papel-200/85">
            {categorias.join(' · ')}
          </p>
        )}
      </div>

      {(valorTotal || vagas || prazo) && (
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-t border-papel-100/20 pt-6">
          {valorTotal && (
            <Medida
              rotulo="Recursos do edital"
              valor={valorTotal}
              icone={<IconeRecursos className="mt-0.5 h-6 w-6 shrink-0 text-accent-400" />}
            />
          )}
          {vagas && <Medida rotulo="Vagas" valor={vagas} />}
          {prazo && (
            <Medida
              rotulo={prazo.rotulo}
              valor={prazo.data}
              icone={<IconePrazo className="mt-0.5 h-6 w-6 shrink-0 text-accent-400" />}
            />
          )}
        </dl>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {inscricao && (
          <Link
            href={inscricao.href}
            className="group inline-flex min-h-[48px] items-center gap-2 bg-accent-500 px-6 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-100"
          >
            {inscricao.rotulo}
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 border-2 border-papel-100/50 px-6 text-xs font-bold uppercase tracking-[0.14em] text-papel-50 transition-colors hover:border-papel-100 hover:bg-papel-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            <IconDownload className="h-4 w-4" aria-hidden="true" />
            Ler o edital em PDF
          </a>
        )}
      </div>
    </FolhaDeRosto>
  )
}

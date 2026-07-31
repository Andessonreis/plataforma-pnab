import Link from 'next/link'
import { FundoFotos } from '@/components/ui/fundo-fotos'

interface FolhaDeRostoProps {
  valorTotal: string
  totalProjetos: number
  concluidos: number
  emExecucao: number
}

const FOTOS = [
  '/images/galeria/foto-01.png', // quadrilha infantil
  '/images/galeria/foto-04.png', // fogueira do São João
  '/images/galeria/foto-02.png', // pórtico Minha Feliz Cidade
]

/**
 * Abertura da prestação de contas.
 *
 * Numa página de transparência o número é a manchete: quanto foi investido
 * na cultura da cidade. Ele vem em corpo de display, e a contagem de projetos
 * e de situações desce como linha de balanço, separada por fios.
 *
 * Antes eram quatro cartões de estatística lado a lado, cada um com ícone
 * dentro de um quadrado colorido. Os quadros diziam à pessoa que os quatro
 * números têm o mesmo peso, e não têm: o valor investido é a resposta que a
 * pessoa veio buscar; o resto é detalhamento dele.
 */
export function FolhaDeRosto({
  valorTotal,
  totalProjetos,
  concluidos,
  emExecucao,
}: FolhaDeRostoProps) {
  const temProjetos = totalProjetos > 0

  return (
    <section className="relative overflow-hidden bg-brand-900 text-papel-100">
      <FundoFotos fotos={FOTOS} />

      {/* Véu de tinta do lado do texto: o banho geral da fotografia não dá
          conta de zonas claras (a saia de quadrilha, uma luz de palco), e o
          título é o elemento que não pode depender de qual foto está em cena. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-tinta-950/90 via-tinta-950/70 to-tinta-950/25"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
        <nav aria-label="Trilha de navegação" className="mb-8 text-xs tracking-wide text-papel-200/80">
          <Link href="/" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Início
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span className="text-papel-50">Projetos apoiados</span>
        </nav>

        <p className="mb-1 -rotate-1 font-caveat text-2xl text-accent-300">Transparência</p>
        <h1 className="font-rye text-3xl leading-tight tracking-wide text-papel-50 sm:text-5xl">
          Onde o recurso chegou
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-papel-100/90">
          Projetos culturais contemplados pela Política Nacional Aldir Blanc em Irecê, com o valor
          aprovado de cada um e a contrapartida oferecida à cidade.
        </p>

        {temProjetos && (
          <dl className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-papel-100/20 pt-6">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-accent-300">
                Investido na cultura
              </dt>
              <dd className="font-rye text-4xl leading-none text-accent-300 sm:text-5xl">
                {valorTotal}
              </dd>
            </div>

            <div className="border-l border-papel-100/20 pl-10">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
                Projetos
              </dt>
              <dd className="font-rye text-2xl leading-none text-papel-50">{totalProjetos}</dd>
            </div>

            <div className="border-l border-papel-100/20 pl-10">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
                Concluídos
              </dt>
              <dd className="font-rye text-2xl leading-none text-papel-50">{concluidos}</dd>
            </div>

            <div className="border-l border-papel-100/20 pl-10">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
                Em execução
              </dt>
              <dd className="font-rye text-2xl leading-none text-papel-50">{emExecucao}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-papel-100" aria-hidden="true" />
    </section>
  )
}

import Link from 'next/link'
import type { Contato, Visitacao } from '@/lib/memorial/config'

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

/** [1,2,3,4,5] → "segunda a sexta"; dias soltos viram lista. */
function diasDeVisita(dias: number[]): string {
  const ordenados = [...dias].sort((a, b) => a - b)
  const seguidos = ordenados.every((d, i) => i === 0 || d === ordenados[i - 1] + 1)
  if (seguidos && ordenados.length > 2) return `${DIAS[ordenados[0]]} a ${DIAS[ordenados.at(-1)!]}`
  return ordenados.map((d) => DIAS[d]).join(', ')
}

function faixaHorario(h: { inicio: string; fim: string }[]) {
  return h.length ? `${h[0].inicio} às ${h.at(-1)!.fim}` : null
}

/**
 * Como visitar: regras de agendamento e funcionamento vindos das configurações do
 * Memorial. Turquesa é a cor do acolhimento na identidade da Secretaria.
 */
export function FaixaVisite({ visitacao, contato }: { visitacao: Visitacao; contato: Contato }) {
  const manha = faixaHorario(visitacao.horarios.MANHA)
  const tarde = faixaHorario(visitacao.horarios.TARDE)
  const turnos = [manha && `pela manhã, das ${manha}`, tarde && `à tarde, das ${tarde}`].filter(Boolean).join(', e ')
  const regras = [
    `Visitas em grupo, de ${diasDeVisita(visitacao.diasSemana)}${turnos ? `, ${turnos}` : ''}.`,
    `Grupos de até ${visitacao.maxPessoasPorGrupo} pessoas.`,
    `Peça com pelo menos ${visitacao.antecedenciaHoras} horas de antecedência.`,
  ]

  return (
    <section aria-labelledby="visite-titulo" className="bg-turquesa-800 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <h2 id="visite-titulo" className="titulo text-4xl leading-none sm:text-6xl">
            Visite o Memorial
          </h2>
          {contato.funcionamento && <p className="mt-5 text-lg leading-relaxed text-turquesa-50">{contato.funcionamento}</p>}
          {contato.endereco && <p className="mt-2 text-base text-turquesa-100">{contato.endereco}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/memorial/agendar"
              className="inline-flex min-h-[48px] items-center justify-center bg-white px-6 text-sm font-bold text-turquesa-900 hover:bg-turquesa-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Agende sua visita
            </Link>
            {visitacao.mercadoArteUrl && (
              <a
                href={visitacao.mercadoArteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center border border-white/70 px-6 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Visitar o Mercado de Arte
                <span className="sr-only"> (abre em outra aba)</span>
              </a>
            )}
          </div>
        </div>

        <div>
          <ul className="space-y-3 border-t border-white/25 pt-6 text-base leading-relaxed text-turquesa-50">
            {regras.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {visitacao.textoRegistroFotografico && (
            <p className="mt-6 text-sm leading-relaxed text-turquesa-100">{visitacao.textoRegistroFotografico}</p>
          )}
        </div>
      </div>
    </section>
  )
}

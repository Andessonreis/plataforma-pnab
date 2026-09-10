import Link from 'next/link'
import type { ReactNode } from 'react'
import { FadeIn } from '@/components/ui'

/**
 * Seleção de edital antes de abrir uma fila de trabalho.
 *
 * Nasceu na tela de habilitação e virou compartilhado quando as listas de
 * inscrições e as filas do avaliador precisaram do mesmo recorte: com dezenas
 * de editais no ar, uma lista única mistura processos de editais diferentes e
 * fica ilegível. Cada tela informa suas próprias métricas — o layout do card é
 * o mesmo.
 */

export interface EditalPickerStat {
  /** Ícone do indicador (componente já dimensionado pelo caller). */
  icone: ReactNode
  valor: number
  label: string
  /** Classe de cor do número (ex.: 'text-amber-600'). */
  cor: string
}

export interface EditalPickerCard {
  id: string
  titulo: string
  ano: number
  /** Edital em fase ativa pra esta tela — muda o acento e o selo do card. */
  ativo: boolean
  href: string
  /** Barra de progresso opcional (0-100) com seu rótulo. */
  progresso?: { pct: number; label: string }
  stats: EditalPickerStat[]
}

function Card({ edital }: { edital: EditalPickerCard }) {
  const temPendencia = edital.stats[0]?.valor > 0

  return (
    <li>
      <Link
        href={edital.href}
        className={[
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-200',
          'hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          edital.ativo
            ? 'border-emerald-200 ring-1 ring-emerald-100 hover:border-emerald-300'
            : 'border-slate-200 hover:border-brand-300',
        ].join(' ')}
      >
        {/* Faixa de acento — âmbar quando há fila pendente, indica prioridade */}
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1.5 ${
            edital.ativo && temPendencia
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : edital.ativo
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-r from-slate-300 to-slate-400'
          }`}
        />

        <div className="flex items-start justify-between gap-3 pt-1">
          {edital.ativo ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              Fase aberta
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              Fase encerrada
            </span>
          )}
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-slate-400 transition-all duration-200 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:translate-x-0.5"
          >
            →
          </span>
        </div>

        <h3 className="mt-3 text-base font-semibold text-slate-900 leading-snug line-clamp-2">
          {edital.titulo}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">Edição {edital.ano}</p>

        {edital.progresso && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600">{edital.progresso.label}</span>
              <span className="font-bold text-slate-900 tabular-nums">{edital.progresso.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="presentation">
              <div
                className={`h-full rounded-full transition-all ${edital.ativo ? 'bg-emerald-500' : 'bg-brand-500'}`}
                style={{ width: `${edital.progresso.pct}%` }}
              />
            </div>
          </div>
        )}

        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          {edital.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              {stat.icone}
              <dd className={`text-xl font-bold tabular-nums ${stat.cor}`}>{stat.valor}</dd>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400 text-center leading-tight">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </Link>
    </li>
  )
}

interface Props {
  titulo: string
  descricao: string
  icone: ReactNode
  editais: EditalPickerCard[]
  /** Resumo curto ao lado do grupo ativo (ex.: "12 inscrições aguardando"). */
  resumoAtivos?: string
  vazio?: ReactNode
}

export function EditalPicker({ titulo, descricao, icone, editais, resumoAtivos, vazio }: Props) {
  const ativos = editais.filter((e) => e.ativo)
  const encerrados = editais.filter((e) => !e.ativo)

  return (
    <section>
      <FadeIn>
        <header className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
              {icone}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{titulo}</h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">{descricao}</p>
            </div>
          </div>
        </header>
      </FadeIn>

      {editais.length === 0 && vazio}

      {ativos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Fase aberta</h2>
            {resumoAtivos && <span className="text-xs text-slate-500">{resumoAtivos}</span>}
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" aria-label="Editais em fase aberta">
            {ativos.map((edital) => (
              <Card key={edital.id} edital={edital} />
            ))}
          </ul>
        </div>
      )}

      {encerrados.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Fase encerrada</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" aria-label="Editais com fase encerrada">
            {encerrados.map((edital) => (
              <Card key={edital.id} edital={edital} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

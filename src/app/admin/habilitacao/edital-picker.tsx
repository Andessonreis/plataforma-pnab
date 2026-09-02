import Link from 'next/link'
import type { EditalStatus } from '@prisma/client'
import { FadeIn, IconShield, IconClipboard, IconCheck, IconClose } from '@/components/ui'

export interface EditalHabilitacaoCard {
  id: string
  titulo: string
  ano: number
  status: EditalStatus
  pendentes: number
  habilitadas: number
  inabilitadas: number
}

function Card({ edital }: { edital: EditalHabilitacaoCard }) {
  const total = edital.pendentes + edital.habilitadas + edital.inabilitadas
  const decididas = edital.habilitadas + edital.inabilitadas
  const pct = total > 0 ? Math.round((decididas / total) * 100) : 0
  const ativo = edital.status === 'HABILITACAO'

  return (
    <li>
      <Link
        href={`/admin/habilitacao?editalId=${edital.id}`}
        className={[
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-200',
          'hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          ativo
            ? 'border-emerald-200 ring-1 ring-emerald-100 hover:border-emerald-300'
            : 'border-slate-200 hover:border-brand-300',
        ].join(' ')}
      >
        {/* Faixa de acento — vermelha quando há pendências, indica prioridade */}
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1.5 ${
            ativo && edital.pendentes > 0
              ? 'bg-gradient-to-r from-amber-400 to-amber-600'
              : ativo
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-r from-slate-300 to-slate-400'
          }`}
        />

        {/* Cabeçalho do card */}
        <div className="flex items-start justify-between gap-3 pt-1">
          {ativo ? (
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

        {/* Título */}
        <h3 className="mt-3 text-base font-semibold text-slate-900 leading-snug line-clamp-2">
          {edital.titulo}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">Edição {edital.ano}</p>

        {/* Progresso */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">Documentação conferida</span>
            <span className="font-bold text-slate-900 tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="presentation">
            <div
              className={`h-full rounded-full transition-all ${ativo ? 'bg-emerald-500' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Estatísticas */}
        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <div className="flex flex-col items-center gap-1">
            <IconClipboard className="h-4 w-4 text-amber-500" />
            <dd className="text-xl font-bold tabular-nums text-amber-600">{edital.pendentes}</dd>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Aguardando</dt>
          </div>
          <div className="flex flex-col items-center gap-1">
            <IconCheck className="h-4 w-4 text-emerald-500" />
            <dd className="text-xl font-bold tabular-nums text-emerald-600">{edital.habilitadas}</dd>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Habilitadas</dt>
          </div>
          <div className="flex flex-col items-center gap-1">
            <IconClose className="h-4 w-4 text-rose-500" />
            <dd className="text-xl font-bold tabular-nums text-rose-600">{edital.inabilitadas}</dd>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Inabilitadas</dt>
          </div>
        </dl>
      </Link>
    </li>
  )
}

export function EditalPicker({ editais }: { editais: EditalHabilitacaoCard[] }) {
  const ativos = editais.filter((e) => e.status === 'HABILITACAO')
  const concluidos = editais.filter((e) => e.status !== 'HABILITACAO')

  const totalPendentes = ativos.reduce((acc, e) => acc + e.pendentes, 0)

  return (
    <section>
      <FadeIn>
        <header className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
              <IconShield className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                Habilitação documental
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
                Selecione um edital para conferir a documentação das inscrições dele. Cada edital tem sua
                própria fila — evita misturar a conferência de um edital com a de outro.
              </p>
            </div>
          </div>
        </header>
      </FadeIn>

      {/* Editais com fase de habilitação aberta */}
      {ativos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Fase aberta
            </h2>
            <span className="text-xs text-slate-500">
              {totalPendentes > 0
                ? `${totalPendentes} ${totalPendentes === 1 ? 'inscrição aguardando' : 'inscrições aguardando'}`
                : 'tudo conferido'}
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" aria-label="Editais com fase de habilitação aberta">
            {ativos.map((edital) => (
              <Card key={edital.id} edital={edital} />
            ))}
          </ul>
        </div>
      )}

      {/* Editais com fase de habilitação já encerrada, mas com histórico */}
      {concluidos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Fase encerrada
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5" aria-label="Editais com fase de habilitação encerrada">
            {concluidos.map((edital) => (
              <Card key={edital.id} edital={edital} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

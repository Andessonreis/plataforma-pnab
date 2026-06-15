import Link from 'next/link'
import { Badge, Button } from '@client/components/ui'
import {
  IconClock,
  IconAccessible,
  IconArrowLeft,
  IconArrowRight,
} from '@client/components/ui/icons'
import { getPublicStatusDisplay } from '@client/utils/edital-status-ui'
import { formatCurrency, formatDate, formatDateTime } from '@shared/utils/format'
import { getNextDeadline } from '@shared/utils/cronograma'
import type { Session } from '@server/lib/auth'
import type { editaisRepository } from '@server/modules/editais/repository/editais.repository'

type EditalWithRelations = NonNullable<
  Awaited<ReturnType<typeof editaisRepository.findBySlugWithRelations>>
>
type StatusDisplay = ReturnType<typeof getPublicStatusDisplay>
type NextDeadline = ReturnType<typeof getNextDeadline>

interface EditalSidebarProps {
  edital: EditalWithRelations
  session: Session
  statusDisplay: StatusDisplay
  nextDeadline: NextDeadline
  slug: string
  isOpen: boolean
}

export function EditalSidebar({
  edital,
  session,
  statusDisplay,
  nextDeadline,
  slug,
  isOpen,
}: EditalSidebarProps) {
  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-6 space-y-5 sm:space-y-6">
        {/* CTA de inscrição */}
        {isOpen && (
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold mb-2">
              Inscrições Abertas
            </h3>
            {session?.user?.role === 'PROPONENTE' ? (
              <>
                <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                  Inscreva seu projeto cultural neste edital. Você poderá
                  salvar como rascunho e enviar quando estiver pronto.
                </p>
                <Button
                  href={`/proponente/inscricoes/nova?editalId=${edital.id}`}
                  variant="ghost"
                  size="lg"
                  className="w-full bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 shadow-md font-semibold"
                >
                  Inscrever-se
                </Button>
              </>
            ) : session ? (
              <p className="text-brand-100 text-sm leading-relaxed">
                Apenas proponentes podem se inscrever em editais. Acesse
                sua conta de proponente para se inscrever.
              </p>
            ) : (
              <>
                <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                  Cadastre-se ou acesse sua conta para inscrever seu projeto
                  cultural neste edital.
                </p>
                <Button
                  href={`/login?callbackUrl=/proponente/inscricoes/nova?editalId=${edital.id}`}
                  variant="ghost"
                  size="lg"
                  className="w-full bg-white text-brand-700 hover:bg-brand-50 hover:text-brand-800 shadow-md font-semibold"
                >
                  Inscrever-se
                </Button>
                <p className="mt-3 text-center text-xs text-brand-200">
                  Ainda não tem conta?{' '}
                  <Link href="/cadastro" className="underline hover:text-white">
                    Cadastre-se
                  </Link>
                </p>
              </>
            )}
          </div>
        )}

        {/* Informações rápidas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Informações
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <Badge variant={statusDisplay.badgeVariant} dot>
                  {statusDisplay.label}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ano</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{edital.ano}</dd>
            </div>
            {edital.valorTotal && (
              <div>
                <dt className="text-slate-500">Valor Total</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {formatCurrency(edital.valorTotal)}
                </dd>
              </div>
            )}
            {edital.categorias.length > 0 && (
              <div>
                <dt className="text-slate-500">Categorias</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {edital.categorias.map((cat) => (
                    <Badge key={cat} variant="neutral">{cat}</Badge>
                  ))}
                </dd>
              </div>
            )}
            {edital.arquivos.length > 0 && (
              <div>
                <dt className="text-slate-500">Documentos</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {edital.arquivos.length} {edital.arquivos.length === 1 ? 'arquivo' : 'arquivos'} disponíveis
                </dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Publicado em</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {formatDate(edital.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Próxima data do cronograma */}
        {nextDeadline && (
          <div className="bg-accent-50 rounded-xl border border-accent-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <IconClock className="h-4 w-4 text-accent-600" />
              <h3 className="text-base font-semibold text-accent-900">
                Próxima data
              </h3>
            </div>
            <p className="text-sm text-accent-800 font-medium">
              {nextDeadline.label}
            </p>
            <p className="text-sm text-accent-700 mt-1 tabular-nums">
              {formatDateTime(nextDeadline.dataHora)}
            </p>
          </div>
        )}

        {/* Link para versão acessível */}
        {edital.conteudoAcessivel && (
          <Link
            href={`/editais/${slug}/acessivel`}
            className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <IconAccessible className="h-5 w-5 shrink-0" />
            <span>Ver versão acessível deste edital</span>
          </Link>
        )}

        {/* Link para Resultados (quando publicados) */}
        {['RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO'].includes(edital.status) && (
          <div className="bg-brand-50 rounded-xl border border-brand-200 p-6">
            <h3 className="text-base font-semibold text-brand-900 mb-2">
              Resultados Publicados
            </h3>
            <p className="text-sm text-brand-700 mb-3">
              Confira a lista de classificação deste edital.
            </p>
            <Link
              href={`/editais/${slug}/resultados`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Ver Resultados
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Link de volta */}
        <Link
          href="/editais"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para editais
        </Link>
      </div>
    </aside>
  )
}

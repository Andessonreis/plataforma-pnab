import { Button, IconArrowRight, IconCalendar, IconClock } from '@/components/ui'
import { FundoFotos } from '@/components/ui/fundo-fotos'
import { formatDate } from '@/lib/utils/format'
import { DashboardGreeting } from './dashboard-greeting'
import { HeroPrazosPanel } from './hero-prazos-panel'
import { TourButton } from './tour-button'
import { PASSOS_DASHBOARD } from './dashboard-tour-steps'
import { contagemRegressiva, type UpcomingDeadline } from './upcoming-deadlines-card'

/** Mesmas fotografias da abertura pública — reaproveitadas, não duplicadas. */
const FOTOS_HERO = [
  '/images/galeria/foto-04.png',
  '/images/galeria/foto-03.png',
  '/images/galeria/foto-05.png',
]

interface DraftHighlight {
  id: string
  editalTitulo: string
}

interface DashboardHeroProps {
  firstName: string
  today: string
  nearestDeadline: UpcomingDeadline | null
  deadlines: UpcomingDeadline[]
  draftCount: number
  nearestDraft: DraftHighlight | null
  editaisAbertosCount: number
}

interface CtaAlvo {
  label: string
  href: string
}

// Resolve qual é a única coisa que mais importa agora pro proponente: prazo
// mais próximo > rascunho pendente > editais abertos genéricos. O CTA
// primário do painel segue a mesma prioridade.
function resolverCta({ nearestDeadline, draftCount, nearestDraft }: DashboardHeroProps): CtaAlvo {
  if (nearestDeadline) return { label: 'Ver edital', href: `/editais/${nearestDeadline.slug}` }
  if (draftCount > 0 && nearestDraft) {
    return { label: 'Continuar rascunho', href: `/proponente/inscricoes/${nearestDraft.id}/editar` }
  }
  return { label: 'Ver editais', href: '/editais' }
}

function UrgentHighlight({ nearestDeadline, draftCount, nearestDraft, editaisAbertosCount }: DashboardHeroProps) {
  if (nearestDeadline) {
    return (
      <div className="mt-6 flex items-start gap-3">
        <IconCalendar className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-papel-50">{nearestDeadline.label}</p>
          <p className="text-sm text-papel-300/70 truncate">{nearestDeadline.editalTitulo}</p>
          <p className="mt-1 text-sm font-semibold text-accent-400">
            {contagemRegressiva(nearestDeadline.dataHora)} · {formatDate(nearestDeadline.dataHora)}
          </p>
        </div>
      </div>
    )
  }

  if (draftCount > 0 && nearestDraft) {
    return (
      <div className="mt-6 flex items-start gap-3">
        <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-papel-50">
            {draftCount === 1
              ? 'Você tem um rascunho aguardando envio'
              : `Você tem ${draftCount} rascunhos aguardando envio`}
          </p>
          <p className="text-sm text-papel-300/70 truncate">{nearestDraft.editalTitulo}</p>
        </div>
      </div>
    )
  }

  if (editaisAbertosCount > 0) {
    return (
      <div className="mt-6 flex items-start gap-3">
        <IconCalendar className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
        <p className="text-sm font-medium text-papel-50">
          {editaisAbertosCount === 1
            ? 'Há um edital com inscrições abertas.'
            : `Há ${editaisAbertosCount} editais com inscrições abertas.`}
        </p>
      </div>
    )
  }

  return (
    <p className="mt-6 text-sm text-papel-300/70">
      Nenhuma pendência no momento. Fique de olho nos próximos editais.
    </p>
  )
}

// Painel dominante do dashboard — saudação, a coisa mais urgente pro
// proponente agora e o único CTA primário da tela. Tudo o resto (números,
// inscrições recentes, rascunhos, prazos, notificações) é secundário a isto.
export function DashboardHero(props: DashboardHeroProps) {
  const cta = resolverCta(props)

  return (
    // Faixa cheia (mesmo padrão de FaixaSecao do site público) em vez de card
    // branco com borda — é a abertura do painel, não mais um bloco entre
    // outros. Quebra o padding do <main> pra ficar de ponta a ponta. Sem
    // FadeIn/whileInView: é conteúdo funcional acima da dobra, não reveal de
    // marketing — animação de scroll aqui só arrisca ficar invisível.
    <div className="relative -mx-4 -mt-4 overflow-hidden bg-tinta-950 px-4 pb-8 pt-16 sm:py-10 lg:-mx-6 lg:-mt-6 lg:px-10 lg:py-12">
      <FundoFotos fotos={FOTOS_HERO} />

      {/* Duas colunas — a chamada de um lado, o painel de prazos do outro,
          igual a Abertura (CarrosselArtes | PainelEditais) na home. Nada de
          coluna sozinha sobrando foto vazia atrás. */}
      <div className="relative grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DashboardGreeting firstName={props.firstName} today={props.today} />
            <TourButton passos={PASSOS_DASHBOARD} />
          </div>
          <UrgentHighlight {...props} />

          <div className="mt-8 flex flex-wrap gap-3">
            <span id="tour-cta-principal">
              <Button
                href={cta.href}
                variant="secondary"
                className="rotulo text-xs sm:text-sm"
              >
                {cta.label}
                <IconArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </span>
            <span id="tour-cta-inscricoes">
              <Button
                href="/proponente/inscricoes"
                variant="outline"
                className="rotulo border-papel-100/30 text-papel-50 text-xs hover:bg-papel-100/10 sm:text-sm"
              >
                Minhas inscrições
              </Button>
            </span>
          </div>
        </div>

        <HeroPrazosPanel deadlines={props.deadlines} />
      </div>
    </div>
  )
}

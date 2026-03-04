import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { UserRole, TicketStatus } from '@prisma/client'
import {
  Card,
  Badge,
  Button,
  FadeIn,
  IconArrowLeft,
  IconTicket,
  IconMail,
  IconChatBubble,
  IconCheck,
  IconClock,
  IconUser,
} from '@/components/ui'

export const metadata: Metadata = {
  title: 'Detalhe do Ticket — Portal PNAB Irecê',
}

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO']

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const STATUS_LABELS: Record<TicketStatus, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  FECHADO: 'Fechado',
}

const STATUS_BADGE: Record<TicketStatus, BadgeVariant> = {
  ABERTO: 'warning',
  EM_ATENDIMENTO: 'info',
  FECHADO: 'success',
}

interface HistoricoItem {
  de: string
  texto: string
  criadoEm: string
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: Props) {
  const session = await auth()
  if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) redirect('/')

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      autor: { select: { nome: true, email: true } },
    },
  })

  if (!ticket) notFound()

  const historico = (ticket.historico ?? []) as unknown as HistoricoItem[]

  async function responder(formData: FormData) {
    'use server'
    const texto = (formData.get('texto') as string)?.trim()
    const novoStatus = formData.get('novoStatus') as TicketStatus | null

    if (!texto || texto.length < 5) return

    const sessao = await auth()
    if (!sessao) return

    const entrada: HistoricoItem = {
      de: sessao.user.name ?? 'Atendente',
      texto,
      criadoEm: new Date().toISOString(),
    }

    // Busca o ticket atual para obter o histórico existente
    const ticketAtual = await prisma.ticket.findUnique({ where: { id }, select: { historico: true } })
    const historicoAtual = (ticketAtual?.historico ?? []) as unknown as HistoricoItem[]
    const novoHistorico = [...historicoAtual, entrada]

    await prisma.ticket.update({
      where: { id },
      data: {
        historico: novoHistorico as unknown as Prisma.InputJsonValue[],
        status: novoStatus ?? undefined,
        updatedAt: new Date(),
      },
    })

    redirect(`/admin/tickets/${id}`)
  }

  const podeFechar = ticket.status !== 'FECHADO'

  return (
    <section>
      <FadeIn>
        {/* Voltar */}
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 sm:mb-6"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para Tickets
        </Link>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-400">{ticket.protocolo}</span>
              <Badge variant={STATUS_BADGE[ticket.status]}>
                {STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {ticket.assunto}
            </h1>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Coluna principal: mensagem + histórico + resposta */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Mensagem original */}
          <FadeIn delay={0.05}>
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <IconUser className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{ticket.nomeContato}</p>
                  <p className="text-xs text-slate-500">{ticket.emailContato}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {ticket.mensagem}
              </div>
            </Card>
          </FadeIn>

          {/* Histórico de respostas */}
          {historico.length > 0 && (
            <FadeIn delay={0.1}>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Histórico ({historico.length})
                </h2>
                {historico.map((item, idx) => (
                  <Card key={idx}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <IconChatBubble className="h-4 w-4 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.de}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(item.criadoEm).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-brand-50 rounded-lg p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap border border-brand-100">
                      {item.texto}
                    </div>
                  </Card>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Formulário de resposta */}
          {ticket.status !== 'FECHADO' && (
            <FadeIn delay={0.15}>
              <Card>
                <h2 className="text-base font-semibold text-slate-900 mb-4">Responder</h2>
                <form action={responder} className="space-y-4">
                  <div>
                    <label
                      htmlFor="texto"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Mensagem de resposta
                    </label>
                    <textarea
                      id="texto"
                      name="texto"
                      required
                      minLength={5}
                      rows={5}
                      placeholder="Digite a resposta para o proponente..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y min-h-[120px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="novoStatus"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Atualizar status
                    </label>
                    <select
                      id="novoStatus"
                      name="novoStatus"
                      defaultValue={ticket.status}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="ABERTO">Aberto — aguardando ação</option>
                      <option value="EM_ATENDIMENTO">Em Atendimento — em andamento</option>
                      <option value="FECHADO">Fechado — resolvido</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button type="submit" size="sm">
                      <IconChatBubble className="h-4 w-4 mr-1.5" />
                      Enviar Resposta
                    </Button>
                    {podeFechar && (
                      <Button type="submit" name="novoStatus" value="FECHADO" variant="outline" size="sm">
                        <IconCheck className="h-4 w-4 mr-1.5" />
                        Encerrar Ticket
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </FadeIn>
          )}

          {ticket.status === 'FECHADO' && (
            <FadeIn delay={0.15}>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <IconCheck className="h-4 w-4 shrink-0" />
                Este ticket foi encerrado.
              </div>
            </FadeIn>
          )}
        </div>

        {/* Coluna lateral: metadados */}
        <div className="space-y-4">
          <FadeIn delay={0.1}>
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                Informações
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    Protocolo
                  </dt>
                  <dd className="font-mono text-slate-800 text-xs">{ticket.protocolo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    Status
                  </dt>
                  <dd>
                    <Badge variant={STATUS_BADGE[ticket.status]}>
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    Contato
                  </dt>
                  <dd className="text-slate-800 font-medium">{ticket.nomeContato}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    E-mail
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${ticket.emailContato}`}
                      className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 break-all"
                    >
                      <IconMail className="h-3.5 w-3.5 shrink-0" />
                      {ticket.emailContato}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    Criado em
                  </dt>
                  <dd className="inline-flex items-center gap-1 text-slate-600">
                    <IconClock className="h-3.5 w-3.5 shrink-0" />
                    {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    Atualizado em
                  </dt>
                  <dd className="inline-flex items-center gap-1 text-slate-600">
                    <IconClock className="h-3.5 w-3.5 shrink-0" />
                    {new Date(ticket.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                    Respostas
                  </dt>
                  <dd className="text-slate-800 font-medium">{historico.length}</dd>
                </div>
                {ticket.autor && (
                  <div>
                    <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                      Proponente registrado
                    </dt>
                    <dd className="inline-flex items-center gap-1 text-slate-700">
                      <IconUser className="h-3.5 w-3.5 shrink-0" />
                      {ticket.autor.nome}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </FadeIn>

          {/* Ações rápidas de status */}
          {ticket.status !== 'FECHADO' && (
            <FadeIn delay={0.15}>
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Ações Rápidas
                </h3>
                <div className="space-y-2">
                  {ticket.status === 'ABERTO' && (
                    <form action={responder}>
                      <input type="hidden" name="texto" value="Ticket recebido. Em análise." />
                      <input type="hidden" name="novoStatus" value="EM_ATENDIMENTO" />
                      <button
                        type="submit"
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors min-h-[44px]"
                      >
                        <IconTicket className="h-4 w-4 shrink-0" />
                        Iniciar Atendimento
                      </button>
                    </form>
                  )}
                  <form action={responder}>
                    <input type="hidden" name="texto" value="Ticket encerrado pela equipe de atendimento." />
                    <input type="hidden" name="novoStatus" value="FECHADO" />
                    <button
                      type="submit"
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors min-h-[44px]"
                    >
                      <IconCheck className="h-4 w-4 shrink-0" />
                      Encerrar Ticket
                    </button>
                  </form>
                </div>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  )
}

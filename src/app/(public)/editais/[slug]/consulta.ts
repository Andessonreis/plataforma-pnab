import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getPublicStatusDisplay } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { parseCronogramaPublico, getNextDeadline } from '@/lib/utils/cronograma'
import { retificacoesOrdenadas } from '@/lib/utils/retificacao'
import type { CronogramaDisplayItem } from '@/types/cronograma'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { Retificacao } from '@/types/retificacao'
import type { TomCarimbo } from '@/components/ui/carimbo'
import type { ArquivoEdital } from './anexos-edital'
import { resultadoPublicado, type ResultadoPublicado } from '../resultado-publicado'
import type { ParteDoEdital } from './document-nav'

export interface EditalAberto {
  id: string
  slug: string
  titulo: string
  ano: number
  status: string
  resumo: string | null
  regrasElegibilidade: string | null
  acoesAfirmativas: string | null
  categorias: string[]
  categoriasConfig: CategoriaConfig[]
  cotas: string[]
  cronograma: CronogramaDisplayItem[]
  /** Atos que alteraram o edital, do mais recente ao mais antigo. Vazio na maioria. */
  retificacoes: Retificacao[]
  arquivos: ArquivoEdital[]
  duvidas: { id: string; pergunta: string; resposta: string }[]
  situacao: { label: string; tom: TomCarimbo }
  valorTotal: string | null
  vagas: string | null
  prazo: { rotulo: string; data: string } | null
  pdfUrl: string | null
  versaoAcessivelHref: string | null
  /** `null` quando não há inscrição a oferecer. O destino muda com a sessão. */
  inscricao: { href: string; rotulo: string } | null
  partes: ParteDoEdital[]
  /** `null` enquanto a classificação não é pública. */
  resultado: ResultadoPublicado | null
  ehRascunhoEmPrevia: boolean
}

function tomDaSituacao(status: string): TomCarimbo {
  if (status === 'INSCRICOES_ABERTAS') return 'safra'
  if (status === 'ENCERRADO' || status === 'RESULTADO_FINAL') return 'arquivo'
  return 'curso'
}

/**
 * Monta o edital já pronto para a página: sem Decimal, sem Date e sem regra de
 * negócio sobrando na renderização.
 *
 * Devolve `null` quando o edital não existe ou é rascunho para quem não é
 * administrador — a página traduz isso em 404, e não em uma tela vazia.
 */
export async function consultarEdital(slug: string): Promise<EditalAberto | null> {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  const edital = await prisma.edital.findUnique({
    where: { slug },
    include: {
      arquivos: { orderBy: { createdAt: 'asc' } },
      faqItems: { where: { publicado: true }, orderBy: { ordem: 'asc' } },
    },
  })

  if (!edital || (!isAdmin && edital.status === 'RASCUNHO')) return null

  const tiposUsados = [...new Set(edital.arquivos.map((a) => a.tipo))]
  const rotulos = new Map(
    tiposUsados.length > 0
      ? (
          await prisma.attachmentType.findMany({
            where: { tipo: { in: tiposUsados } },
            select: { tipo: true, label: true },
          })
        ).map((t) => [t.tipo, t.label] as const)
      : [],
  )

  const categoriasConfig = (Array.isArray(edital.categoriasConfig)
    ? edital.categoriasConfig
    : []) as unknown as CategoriaConfig[]

  const agora = new Date()
  const cronograma = parseCronogramaPublico(edital.cronograma, edital.status, edital.publishedAt)
  const proximoPrazo = getNextDeadline(edital.cronograma)
  const aberto = edital.status === 'INSCRICOES_ABERTAS'

  const destino = `/proponente/inscricoes/nova?editalId=${edital.id}`
  const papel = session?.user?.role
  const inscricao = !aberto
    ? null
    : papel === 'PROPONENTE'
      ? { href: destino, rotulo: 'Inscrever meu projeto' }
      : session
        ? null // quem entrou como avaliador ou equipe não se inscreve
        : { href: `/login?callbackUrl=${encodeURIComponent(destino)}`, rotulo: 'Entrar e inscrever' }

  const pdf =
    edital.arquivos.find((a) => a.tipo === 'PDF_EDITAL') ??
    edital.arquivos.find((a) => a.tipo === 'PDF')

  const partes = [
    edital.resumo && { id: 'resumo', label: 'Resumo' },
    cronograma.length > 0 && { id: 'cronograma', label: 'Cronograma' },
    categoriasConfig.length > 0 && { id: 'vagas', label: 'Vagas e valores' },
    edital.regrasElegibilidade && { id: 'elegibilidade', label: 'Quem pode' },
    edital.acoesAfirmativas && { id: 'acoes', label: 'Ações afirmativas' },
    edital.arquivos.length > 0 && { id: 'anexos', label: 'Documentos' },
    edital.faqItems.length > 0 && { id: 'duvidas', label: 'Dúvidas' },
  ].filter(Boolean) as ParteDoEdital[]

  return {
    id: edital.id,
    slug: edital.slug,
    titulo: edital.titulo,
    ano: edital.ano,
    status: edital.status,
    resumo: edital.resumo,
    regrasElegibilidade: edital.regrasElegibilidade,
    acoesAfirmativas: edital.acoesAfirmativas,
    categorias: edital.categorias,
    categoriasConfig,
    cotas: [...new Set(categoriasConfig.flatMap((c) => c.cotas.map((cota) => cota.label)))],
    cronograma,
    retificacoes: retificacoesOrdenadas(edital.retificacoes),
    arquivos: edital.arquivos.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      url: a.url,
      tipo: a.tipo,
      tipoLabel: rotulos.get(a.tipo) ?? a.tipo,
      acessivel: a.acessivel,
    })),
    duvidas: edital.faqItems.map((f) => ({
      id: f.id,
      pergunta: f.pergunta,
      resposta: f.resposta,
    })),
    situacao: {
      label: getPublicStatusDisplay(cronograma, edital.status, agora).label,
      tom: tomDaSituacao(edital.status),
    },
    valorTotal: edital.valorTotal ? formatCurrency(edital.valorTotal) : null,
    vagas: edital.vagasContemplados
      ? `${edital.vagasContemplados}${edital.vagasSuplentes ? ` + ${edital.vagasSuplentes} supl.` : ''}`
      : null,
    prazo: proximoPrazo
      ? { rotulo: proximoPrazo.label, data: formatDate(proximoPrazo.dataHora) }
      : null,
    pdfUrl: pdf?.url ?? null,
    versaoAcessivelHref: edital.conteudoAcessivel ? `/editais/${slug}/acessivel` : null,
    inscricao,
    partes,
    resultado: resultadoPublicado(edital.status, slug),
    ehRascunhoEmPrevia: isAdmin && edital.status === 'RASCUNHO',
  }
}

import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { Abertura } from '@/components/home/abertura'
import { PassosInscricao } from '@/components/home/passos-inscricao'
import { SecaoConceito } from '@/components/home/secao-conceito'
import { SecaoServicos } from '@/components/home/secao-servicos'
import { SecaoDiaADia } from '@/components/home/secao-dia-a-dia'
import { SecaoNoticias } from '@/components/home/secao-noticias'
import { SecaoProjetosApoiados } from '@/components/home/secao-projetos-apoiados'
import { SecaoOndeEncontrar } from '@/components/home/secao-onde-encontrar'
import { FaixaNumeros } from '@/components/ui'
import { Varal } from '@/components/ui/varal'
import type {
  MomentoResumo,
  ProjetoApoiadoResumo,
} from '@/components/home/types'
import { noticiaParaListagem } from '@/app/(public)/noticias/consulta'
import { nomeDoProjeto } from '@/app/(public)/projetos-apoiados/consulta'
import { formatCurrency } from '@/lib/utils/format'
import { SITUACOES } from '@/app/(public)/projetos-apoiados/tipos'
import { FOTOS_ABERTURA } from '@/app/(public)/_home/slide-institucional'
import { buscarSlidesAbertura } from '@/app/(public)/_home/slides'
import { buscarEditaisAbertura } from '@/app/(public)/_home/editais'
import { obterCarrossel } from '@/lib/services/carrossel.service'
import { buscarConviteMemorial } from '@/app/(public)/_home/convite-memorial'
import { SecaoMemorial } from '@/components/home/convite-memorial/secao-memorial'

export const metadata: Metadata = {
  title: 'Início',
  description:
    'Portal oficial da Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Cultura e Turismo de Irecê/BA.',
}

export default async function HomePage() {
  const agora = new Date()

  const [
    editaisAbertos,
    totalFomento,
    projetosCount,
    editais,
    slides,
    carrossel,
    conviteMemorial,
    momentosAdmin,
    noticiasDestaque,
    projetosDestaque,
  ] = await Promise.all([
      prisma.edital.count({
        where: { status: { in: ['PUBLICADO', 'INSCRICOES_ABERTAS'] } },
      }),
      prisma.edital.aggregate({
        where: { status: { not: 'RASCUNHO' } },
        _sum: { valorTotal: true },
      }),
      prisma.projetoApoiado.count({ where: { publicado: true } }),
      buscarEditaisAbertura(),
      buscarSlidesAbertura(agora),
      obterCarrossel(),
      buscarConviteMemorial(agora),
      // Dia a dia da Secretaria: só os ativos, na ordem cadastrada no admin.
      prisma.momentoSecretaria.findMany({
        where: { ativo: true },
        orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
        select: { id: true, categoria: true, imagemUrl: true, instagramUrl: true },
      }),
      // Prévia do noticiário — mesmo critério de publicação de `/noticias`.
      prisma.noticia.findMany({
        where: { publicado: true, publicadoEm: { not: null } },
        orderBy: { publicadoEm: 'desc' },
        take: 3,
        select: {
          id: true,
          titulo: true,
          slug: true,
          corpo: true,
          tags: true,
          imagemUrl: true,
          publicadoEm: true,
        },
      }),
      // Prévia de transparência — mesmo critério de publicação de `/projetos-apoiados`.
      prisma.projetoApoiado.findMany({
        where: { publicado: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          inscricao: {
            select: {
              categoria: true,
              campos: true,
              proponente: { select: { nome: true } },
            },
          },
        },
      }),
    ])

  const momentos: MomentoResumo[] = momentosAdmin.map((momento) => ({
    id: momento.id,
    categoria: momento.categoria,
    imagemUrl: momento.imagemUrl,
    instagramUrl: momento.instagramUrl,
  }))

  const noticias = noticiasDestaque.map((noticia) => noticiaParaListagem(noticia, 140))

  const projetos: ProjetoApoiadoResumo[] = projetosDestaque.map((projeto) => {
    const situacao = SITUACOES[projeto.statusExecucao] ?? {
      label: projeto.statusExecucao,
      tom: 'arquivo' as const,
    }
    return {
      id: projeto.id,
      nome: nomeDoProjeto(projeto.inscricao.campos) ?? projeto.inscricao.proponente.nome,
      categoria: projeto.inscricao.categoria,
      valor: formatCurrency(projeto.valorAprovado),
      situacao,
    }
  })

  const somaFomento = totalFomento._sum.valorTotal ? Number(totalFomento._sum.valorTotal) : 0
  const numeros = [
    { valor: String(editaisAbertos || '—'), rotulo: 'Editais Abertos' },
    {
      valor:
        somaFomento > 0
          ? somaFomento.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : '—',
      rotulo: 'Valor em Fomento',
    },
    { valor: projetosCount > 0 ? String(projetosCount) : '—', rotulo: 'Projetos Apoiados' },
    { valor: '100%', rotulo: 'Online' },
  ]

  return (
    <div className="tema-secult font-questrial">
      <Abertura slides={slides} editais={editais} fotos={FOTOS_ABERTURA} carrossel={carrossel} />
      <FaixaNumeros numeros={numeros} />
      <PassosInscricao />

      <Varal />

      <SecaoConceito />
      <SecaoMemorial convite={conviteMemorial} />
      <SecaoProjetosApoiados projetos={projetos} />
      <SecaoDiaADia momentos={momentos} />
      <SecaoNoticias noticias={noticias} />
      <SecaoOndeEncontrar />
      <SecaoServicos />
    </div>
  )
}

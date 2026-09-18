import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui'
import { parseItensBonus } from '@/types/bonus-config'
import type { CategoriaConfig } from '@/types/categoria-config'
import { evidenciasDaInscricao } from './evidencias'
import { DefinirBonusTable } from './definir-bonus-table'
import type { InscricaoParaBonus } from './linha-bonus'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Definir Bonificação — Portal PNAB Irecê',
}

// Inscrições que já passaram da habilitação — antes disso não há o que bonificar.
const STATUS_ELEGIVEIS = [
  'HABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
] as const

/**
 * Onde a comissão registra quais itens de bonificação valem para cada inscrição.
 * Mesmo portão do painel de nota bônus: SUPER_ADMIN sempre, ADMIN só nos editais
 * liberados. Avaliador não alcança esta tela — o bônus saiu da mão dele de
 * propósito, justamente para não entrar diluído na média das notas.
 */
export default async function DefinirBonusPage({ params }: Props) {
  const session = await auth()
  if (!session) notFound()

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const isAdmin = session.user.role === 'ADMIN'
  if (!isSuperAdmin && !isAdmin) notFound()

  const { id } = await params

  const edital = await prisma.edital.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      ano: true,
      itensBonus: true,
      categoriasConfig: true,
      bonusVisivelParaAdmin: true,
    },
  })
  if (!edital) notFound()
  if (isAdmin && !edital.bonusVisivelParaAdmin) notFound()

  const config = parseItensBonus(edital.itensBonus)

  // O Anexo VI do Festival traz gênero feminino e LGBTQIA+ como um item único
  // de 5 pontos ("gênero feminino ou LGBTQIA+"). Eles aparecem separados aqui
  // por decisão da coordenação, para a comissão registrar qual condição vale —
  // mas marcar os dois soma 10, e quem marca precisa saber disso na hora.
  const temGeneroSeparado =
    config?.itens.some((i) => i.key === 'genero_feminino') &&
    config?.itens.some((i) => i.key === 'lgbtqia')
  const avisoEdital = temGeneroSeparado
    ? 'O Anexo VI publicado descreve gênero feminino e LGBTQIA+ como um único item de 5 pontos ("agentes culturais do gênero feminino ou LGBTQIA+"). Eles estão separados aqui para registrar qual condição se aplica; marcar os dois soma 10 pontos e exige fundamentação em ata da comissão.'
    : undefined
  const categoriasConfig = Array.isArray(edital.categoriasConfig)
    ? (edital.categoriasConfig as unknown as CategoriaConfig[])
    : null

  const inscricoes = await prisma.inscricao.findMany({
    where: { editalId: id, status: { in: [...STATUS_ELEGIVEIS] } },
    select: {
      id: true,
      numero: true,
      categoria: true,
      cotasOptIn: true,
      bonusItens: true,
      campos: true,
      proponente: { select: { nome: true } },
    },
    orderBy: { numero: 'asc' },
  })

  const linhas: InscricaoParaBonus[] = inscricoes.map((i) => ({
    inscricaoId: i.id,
    editalId: id,
    numero: i.numero,
    proponenteNome: i.proponente.nome,
    categoria: i.categoria,
    bonusItens: i.bonusItens,
    evidencias: evidenciasDaInscricao(
      {
        categoria: i.categoria,
        cotasOptIn: i.cotasOptIn,
        campos: (i.campos ?? {}) as Record<string, unknown>,
      },
      categoriasConfig,
    ),
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/editais/${id}/bonus`} className="text-sm text-brand-600 hover:text-brand-700">
          Voltar ao painel de nota bônus
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Definir Bonificação — {edital.titulo} ({edital.ano})
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          A bonificação é fato documental, conferido pela comissão nas autodeclarações entregues — não
          é avaliação de mérito. Os pontos marcados aqui são somados uma única vez sobre a média dos
          pareceristas, na hora de consolidar o resultado. Cada alteração é registrada nos logs.
        </p>
      </div>

      {config ? (
        <Card padding="md">
          <DefinirBonusTable
            linhas={linhas}
            itens={config.itens}
            maxItens={config.maxItens}
            avisoEdital={avisoEdital}
          />
        </Card>
      ) : (
        <Card padding="md">
          <p className="text-sm text-slate-600">
            Este edital ainda não tem itens de bonificação configurados. Cadastre-os em{' '}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">Edital.itensBonus</code> para
            liberar esta tela.
          </p>
        </Card>
      )}
    </div>
  )
}

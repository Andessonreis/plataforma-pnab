import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui'
import { calculateResults } from '@/lib/results/calculate'
import type { CategoriaConfig } from '@/types/categoria-config'
import { montarLinhasBonus, agregarPorCota } from './aggregate'
import { BonusTable } from './bonus-table'
import { BonusChart } from './bonus-chart'
import { ToggleBonusButton } from './toggle-bonus-button'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Nota Bônus — Portal PNAB Irecê',
}

// Painel de nota bônus por cota — visível em tempo real (antes de consolidar
// resultado) só pra SUPER_ADMIN. ADMIN comum só entra se o super admin tiver
// liberado este edital especificamente (Edital.bonusVisivelParaAdmin).
// AVALIADOR não tem NENHUM acesso — nem essa checagem chega a rodar pra ele
// em nenhuma rota que ele usa, esta página nem existe do ponto de vista dele.
export default async function BonusPage({ params }: Props) {
  const session = await auth()
  if (!session) notFound()

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const isAdmin = session.user.role === 'ADMIN'
  if (!isSuperAdmin && !isAdmin) notFound()

  const { id } = await params

  const edital = await prisma.edital.findUnique({
    where: { id },
    select: { id: true, titulo: true, ano: true, categoriasConfig: true, bonusVisivelParaAdmin: true },
  })
  if (!edital) notFound()

  // ADMIN comum só passa se o super admin liberou este edital especificamente.
  if (isAdmin && !edital.bonusVisivelParaAdmin) notFound()

  const categoriasConfig = Array.isArray(edital.categoriasConfig)
    ? (edital.categoriasConfig as unknown as CategoriaConfig[])
    : null

  const resultados = await calculateResults(id, { incluirBonus: true })
  const linhas = montarLinhasBonus(resultados, categoriasConfig)
  const agregadoPorCota = agregarPorCota(linhas)
  const totalBonus = Math.round(linhas.reduce((acc, l) => acc + l.notaBonus, 0) * 100) / 100

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/admin/editais/${id}`} className="text-sm text-brand-600 hover:text-brand-700">
            Voltar ao edital
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Nota Bônus — {edital.titulo} ({edital.ano})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cálculo em tempo real, a partir das cotas autodeclaradas e das avaliações já finalizadas —
            independe de consolidar/publicar resultado.
          </p>
        </div>
        {isSuperAdmin && (
          <ToggleBonusButton editalId={id} visivel={edital.bonusVisivelParaAdmin} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Inscrições com bônus</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{linhas.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pontos totais concedidos</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">+{totalBonus.toFixed(2)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cotas com bônus configurado</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{agregadoPorCota.length}</p>
        </Card>
      </div>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Pontos por cota</h2>
        {agregadoPorCota.length > 0 ? (
          <BonusChart dados={agregadoPorCota} />
        ) : (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nenhuma cota com pontos configurados ainda para este edital.
          </p>
        )}
      </Card>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Inscrições com bônus</h2>
        <BonusTable linhas={linhas} />
      </Card>
    </div>
  )
}

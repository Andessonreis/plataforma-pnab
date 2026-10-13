import { InscricaoRecenteItem } from './inscricao-recente-item'
import { InscricoesAndamento } from './inscricoes-andamento'
import { SecaoPainel } from './secao-painel'
import { VazioPainel } from './vazio-painel'
import type { InscricaoStatus } from '@prisma/client'

interface RecentInscricao {
  id: string
  numero: string
  status: InscricaoStatus
  createdAt: Date
  edital: { titulo: string }
}

interface RecentInscricoesSectionProps {
  inscricoes: RecentInscricao[]
  total: number
  rascunhos: number
  pendentes: number
  contempladas: number
  editaisAbertos: number
}

/** Seção "Minhas inscrições" do painel: retrato do andamento e as cinco mais recentes. */
export function RecentInscricoesSection({
  inscricoes,
  total,
  rascunhos,
  pendentes,
  contempladas,
  editaisAbertos,
}: RecentInscricoesSectionProps) {
  const acao = { href: '/proponente/inscricoes', rotulo: total > 5 ? `Ver as ${total}` : 'Ver todas' }

  return (
    <SecaoPainel id="tour-inscricoes" titulo="Minhas inscrições" acao={total > 0 ? acao : undefined}>
      <p className="mb-3 text-sm text-tinta-700">Inscrições nos editais da Política Nacional Aldir Blanc (PNAB) em Irecê.</p>
      {total === 0 ? (
        <VazioPainel
          titulo="Você ainda não se inscreveu em nenhum edital."
          texto={
            editaisAbertos > 0
              ? `Há ${editaisAbertos === 1 ? 'um edital aberto' : `${editaisAbertos} editais abertos`} agora. Quando você começar uma inscrição, ela fica guardada aqui.`
              : 'Quando sair um edital com inscrições abertas, é por aqui que você acompanha a sua participação.'
          }
          acao={{ href: '/editais', rotulo: editaisAbertos > 0 ? 'Ver editais abertos' : 'Ver editais' }}
        />
      ) : (
        <>
          <InscricoesAndamento total={total} rascunhos={rascunhos} pendentes={pendentes} contempladas={contempladas} />
          <div className="mt-4">
            {inscricoes.map((inscricao) => (
              <InscricaoRecenteItem
                key={inscricao.id}
                id={inscricao.id}
                numero={inscricao.numero}
                status={inscricao.status}
                createdAt={inscricao.createdAt}
                editalTitulo={inscricao.edital.titulo}
              />
            ))}
          </div>
        </>
      )}
    </SecaoPainel>
  )
}

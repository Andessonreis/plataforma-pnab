import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getConfig } from '@/lib/memorial/config'
import { obterRegulamentoVigente } from '@/lib/services/memorial-regulamento.service'
import { buscarPerguntasExtras } from '@/lib/memorial/agendamento/perguntas-extras'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { DADOS_VAZIOS } from './dados-visita'
import { FluxoAgendamento } from './fluxo-agendamento'
import { AgendamentoFechado } from './agendamento-fechado'

export const metadata: Metadata = {
  title: 'Agendar visita ao Memorial — Portal PNAB Irecê',
  description: 'Peça um horário para visitar o Memorial de Irecê com sua escola, grupo ou família.',
}

export const dynamic = 'force-dynamic'

const FOTOS = ['/images/secult/festa-irece.jpg', '/images/cidade/panoramica-irece.jpg', '/images/galeria/foto-03.png']

async function dadosDaConta(userId: string | undefined) {
  if (!userId) return DADOS_VAZIOS
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nome: true, email: true, telefone: true, cidade: true },
  })
  if (!user) return DADOS_VAZIOS
  return {
    ...DADOS_VAZIOS,
    responsavelNome: user.nome,
    responsavelEmail: user.email,
    responsavelTelefone: user.telefone ?? '',
    cidade: user.cidade ?? '',
  }
}

export default async function AgendarVisitaPage() {
  const session = await auth()
  const [visitacao, contato, regulamento, perguntas, iniciais] = await Promise.all([
    getConfig('visitacao'),
    getConfig('contato'),
    obterRegulamentoVigente(),
    buscarPerguntasExtras(),
    dadosDaConta(session?.user?.id),
  ])

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Agendar visita ao Memorial"
        chamada="Memorial de Irecê"
        titulo="Agendar uma visita"
        apoio="Escolas, grupos e famílias podem pedir um horário de visita mediada. O pedido só vale depois da confirmação da equipe."
      >
        {session?.user && (
          <Link
            href="/memorial/agendar/minhas-visitas"
            className="inline-flex min-h-[44px] items-center text-sm text-papel-50 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-50"
          >
            Ver as visitas que já pedi
          </Link>
        )}
      </FolhaDeRosto>

      <section aria-label="Pedido de visita" className="papel-textura bg-papel-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {regulamento ? (
            <FluxoAgendamento
              regras={{
                antecedenciaHoras: visitacao.antecedenciaHoras,
                maxPessoasPorGrupo: visitacao.maxPessoasPorGrupo,
                maxGruposPorDia: visitacao.maxGruposPorDia,
                umTurnoPorDia: visitacao.umTurnoPorDia,
                textoRegistroFotografico: visitacao.textoRegistroFotografico,
                mercadoArteUrl: visitacao.mercadoArteUrl,
              }}
              regulamento={{ versao: regulamento.versao, texto: regulamento.texto }}
              perguntas={perguntas ? { titulo: perguntas.titulo, descricao: perguntas.descricao, campos: perguntas.campos } : null}
              iniciais={iniciais}
              contatoEmail={contato.email}
            />
          ) : (
            <AgendamentoFechado contato={contato} />
          )}
        </div>
      </section>
    </div>
  )
}

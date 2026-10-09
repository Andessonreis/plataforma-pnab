import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { IconBook, IconClipboard } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { imagemDoItem } from '@/lib/memorial/midia'
import { listarPublicos } from '@/lib/services/memorial-acervo.service'
import { lerConfiguracoes } from '@/lib/services/memorial-config.service'
import { obterRegulamentoVigente } from '@/lib/services/memorial-regulamento.service'
import { formatDate } from '@/lib/utils/format'
import { requireRole } from '@/app/admin/require-role'
import { HistoricoVersoes } from '@/app/admin/memorial/_componentes/historico-versoes'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { FormContato } from './form-contato'
import { FormInstitucional } from './form-institucional'
import { FormVisitacao } from './form-visitacao'
import { SecoesConfig } from './secoes-config'

export const metadata: Metadata = { title: 'Textos e regras do Memorial — Portal PNAB Irecê' }

const SECOES = ['apresentacao', 'contato', 'visita'] as const

function Atalho({ href, icone, titulo, texto }: { href: string; icone: ReactNode; titulo: string; texto: string }) {
  return (
    <Link href={href} className="flex min-h-[44px] items-start gap-3 rounded-xl border border-tinta-900/10 bg-white p-4 hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-2 focus-visible:outline-accent-500">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-turquesa-100 text-turquesa-800">{icone}</span>
      <span>
        <span className="block text-sm font-bold text-brand-800">{titulo}</span>
        <span className="mt-0.5 block text-sm text-tinta-600">{texto}</span>
      </span>
    </Link>
  )
}

/** Textos, contatos e regras de visita do Memorial, uma parte por vez, com a prévia do site ao lado. */
export default async function ConfiguracoesMemorialPage({ searchParams }: { searchParams: Promise<{ secao?: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { secao } = await searchParams
  const [config, fotos, regulamento] = await Promise.all([
    lerConfiguracoes(),
    listarPublicos({ page: 1, pageSize: 1, tipo: 'FOTOGRAFIA' }),
    obterRegulamentoVigente(),
  ])
  const foto = fotos.itens[0] ? imagemDoItem(fotos.itens[0]) : null
  const historico = (id: string) => (
    <div className="mt-6 max-w-3xl">
      <HistoricoVersoes entidade="MemorialConfig" entidadeId={id} titulo="Versões anteriores desta parte" />
    </div>
  )

  return (
    <section>
      <CabecalhoPagina
        titulo="Textos e regras"
        descricao="O que o público lê sobre o Memorial e as regras do agendamento de visitas. Toda alteração fica guardada no histórico."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
      />
      <SecoesConfig
        inicial={SECOES.find((s) => s === secao) ?? 'apresentacao'}
        secoes={[
          { chave: 'apresentacao', rotulo: 'Apresentação', conteudo: <><FormInstitucional inicial={config.institucional} foto={foto} />{historico('institucional')}</> },
          { chave: 'contato', rotulo: 'Contato', conteudo: <><FormContato inicial={config.contato} />{historico('contato')}</> },
          {
            chave: 'visita',
            rotulo: 'Regras de visita',
            conteudo: (
              <>
                <div className="mb-6 grid gap-3 md:grid-cols-2">
                  <Atalho
                    href="/admin/memorial/agendamentos/regulamento"
                    icone={<IconBook className="h-5 w-5" />}
                    titulo={regulamento ? `Regulamento em vigor: versão ${regulamento.versao}` : 'Regulamento ainda não publicado'}
                    texto={regulamento ? `Desde ${formatDate(regulamento.vigenteDesde)}. Quem pede visita precisa aceitar este texto.` : 'Sem regulamento publicado, o formulário de visita fica fechado.'}
                  />
                  <Atalho
                    href="/admin/memorial/questionarios"
                    icone={<IconClipboard className="h-5 w-5" />}
                    titulo="Perguntas extras do pedido de visita"
                    texto="Ficam em Questionários. Dá para mudar quando quiser."
                  />
                </div>
                <FormVisitacao inicial={config.visitacao} contato={config.contato} />
                {historico('visitacao')}
              </>
            ),
          },
        ]}
      />
    </section>
  )
}

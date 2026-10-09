import type { Metadata } from 'next'
import { imagemDoItem } from '@/lib/memorial/midia'
import { listarPublicos } from '@/lib/services/memorial-acervo.service'
import { lerConfiguracoes } from '@/lib/services/memorial-config.service'
import { requireRole } from '../../require-role'
import { CabecalhoAdmin } from '../_componentes/cabecalho-admin'
import { HistoricoVersoes } from '../_componentes/historico-versoes'
import { FormContato } from './form-contato'
import { FormInstitucional } from './form-institucional'
import { FormVisitacao } from './form-visitacao'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Configurações do Memorial — Portal PNAB Irecê' }

/** Textos institucionais, contatos e regras de visita do Memorial, com prévia do site. */
export default async function ConfiguracoesMemorialPage() {
  await requireRole(...ROLES_MEMORIAL)
  const [config, fotos] = await Promise.all([
    lerConfiguracoes(),
    listarPublicos({ page: 1, pageSize: 1, tipo: 'FOTOGRAFIA' }),
  ])
  const foto = fotos.itens[0] ? imagemDoItem(fotos.itens[0]) : null

  return (
    <section className="max-w-4xl space-y-6">
      <CabecalhoAdmin
        titulo="Configurações do Memorial"
        descricao="Tudo o que o público lê sobre o Memorial e as regras de agendamento. Cada alteração fica registrada no histórico."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
      />
      <FormInstitucional inicial={config.institucional} foto={foto} />
      <FormContato inicial={config.contato} />
      <FormVisitacao inicial={config.visitacao} contato={config.contato} />
      <div className="grid gap-4 lg:grid-cols-3">
        <HistoricoVersoes entidade="MemorialConfig" entidadeId="institucional" titulo="Histórico da apresentação" />
        <HistoricoVersoes entidade="MemorialConfig" entidadeId="contato" titulo="Histórico do contato" />
        <HistoricoVersoes entidade="MemorialConfig" entidadeId="visitacao" titulo="Histórico da visitação" />
      </div>
    </section>
  )
}

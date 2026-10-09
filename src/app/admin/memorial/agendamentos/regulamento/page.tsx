import type { Metadata } from 'next'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoAdmin } from '@/app/admin/memorial/_componentes/cabecalho-admin'
import { formatDateTime } from '@/lib/utils/format'
import { listarVersoesRegulamento, obterRegulamentoVigente } from '@/lib/services/memorial-regulamento.service'
import { REGULAMENTO_PADRAO } from '@/lib/memorial/agendamento/regulamento-padrao'
import { FormRegulamento } from './form-regulamento'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Regulamento de visitação — Memorial' }

export default async function RegulamentoPage() {
  await requireRole(...ROLES_MEMORIAL)
  const [vigente, versoes] = await Promise.all([obterRegulamentoVigente(), listarVersoesRegulamento()])

  return (
    <section>
      <CabecalhoAdmin
        titulo="Regulamento de visitação"
        descricao="Quem pede visita precisa aceitar este texto. Cada publicação vira uma versão nova, e cada pedido guarda a versão que foi aceita."
        voltar={{ href: '/admin/memorial/agendamentos', rotulo: 'Agendamentos' }}
      />

      {!vigente && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nenhuma versão publicada ainda: o formulário público de agendamento fica fechado até a primeira publicação. O texto
          abaixo é o das regras que já eram usadas no formulário antigo; revise antes de publicar.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">
        <FormRegulamento textoInicial={vigente?.texto ?? REGULAMENTO_PADRAO} versaoAtual={vigente?.versao ?? null} />

        {versoes.length > 0 && (
          <aside className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="versoes-titulo">
            <h2 id="versoes-titulo" className="text-sm font-semibold text-slate-900">
              Versões publicadas
            </h2>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-700">
              {versoes.map((v) => (
                <li key={v.versao}>
                  Versão {v.versao}, {formatDateTime(v.vigenteDesde)}
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </section>
  )
}

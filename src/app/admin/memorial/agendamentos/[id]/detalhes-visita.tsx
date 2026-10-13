import type { ReactNode } from 'react'
import Link from 'next/link'
import type { MemorialAgendamento } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import { formatDateTime } from '@/lib/utils/format'
import { formatCampoValue } from '@/lib/pdf/projeto-completo/formatacao'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import { linkDiscreto } from '@/app/admin/memorial/_ui'

type Visita = MemorialAgendamento & { resposta: { camposSnapshot: unknown; dados: unknown } | null }

function Bloco({ titulo, itens }: { titulo: string; itens: [string, ReactNode][] }) {
  const preenchidos = itens.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (preenchidos.length === 0) return null
  return (
    <section className="px-4 py-4 sm:px-5">
      <h2 className="text-sm font-bold text-tinta-900">{titulo}</h2>
      <dl className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {preenchidos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-xs font-semibold text-tinta-600">{rotulo}</dt>
            <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-tinta-900">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Respostas às perguntas extras, com os rótulos da versão do questionário que a pessoa viu. */
function respostasExtras(resposta: Visita['resposta']): [string, ReactNode][] {
  if (!resposta) return []
  const campos = (Array.isArray(resposta.camposSnapshot) ? resposta.camposSnapshot : []) as CampoFormulario[]
  const dados = (resposta.dados ?? {}) as Record<string, unknown>
  return campos
    .filter((c) => c.tipo !== 'info' && c.nome)
    .map((c) => [c.label || c.nome, formatCampoValue(dados[c.nome], c, c.nome)])
}

/** Linha do tempo do pedido: quando chegou, que regulamento foi aceito e a última decisão. */
function Historico({ visita: v }: { visita: Visita }) {
  const marcos: [string, string][] = [
    [formatDateTime(v.createdAt), 'Pedido recebido pelo site'],
    [formatDateTime(v.aceiteEm), `Responsável aceitou o regulamento (versão ${v.regulamentoVersao})`],
  ]
  if (v.decididoEm) marcos.push([formatDateTime(v.decididoEm), `Última decisão da equipe: ${ROTULO_STATUS[v.status].toLowerCase()}`])
  return (
    <section className="px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-tinta-900">Histórico</h2>
        <Link href="/admin/memorial/agendamentos/regulamento" className={`${linkDiscreto} py-2`}>
          Ver o regulamento
        </Link>
      </div>
      <ol className="mt-2 space-y-3 border-l border-tinta-900/20 pl-4">
        {marcos.map(([quando, oque]) => (
          <li key={oque} className="relative">
            <span aria-hidden="true" className="absolute -left-[1.33rem] top-1.5 h-2.5 w-2.5 rounded-full bg-tinta-500" />
            <p className="text-sm text-tinta-900">{oque}</p>
            <p className="text-xs tabular-nums text-tinta-600">{quando}</p>
          </li>
        ))}
      </ol>
      {v.motivoRecusa && (
        <p className="mt-3 rounded-lg bg-papel-50 px-3 py-2 text-sm text-tinta-900">
          <span className="font-semibold">Motivo enviado ao responsável:</span> {v.motivoRecusa}
        </p>
      )}
    </section>
  )
}

/** Tudo o que o responsável preencheu, numa folha só, dividida por assunto. */
export function DetalhesVisita({ visita: v }: { visita: Visita }) {
  return (
    <div className="divide-y divide-tinta-900/10 rounded-xl border border-tinta-900/15 bg-white">
      <Bloco
        titulo="Grupo"
        itens={[
          ['Instituição', v.instituicao],
          ['Tipo de visitante', v.tipoVisitante],
          ['Endereço', v.endereco],
          ['Cidade', v.cidade],
        ]}
      />
      <Bloco titulo="Pedidos do responsável" itens={[['Necessidades específicas', v.necessidades], ['Observações', v.observacoes]]} />
      <Bloco titulo="Perguntas extras" itens={respostasExtras(v.resposta)} />
      <Historico visita={v} />
    </div>
  )
}

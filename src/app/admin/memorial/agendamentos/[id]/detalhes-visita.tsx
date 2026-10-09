import type { ReactNode } from 'react'
import type { MemorialAgendamento } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import { formatDateTime, formatTelefoneBR } from '@/lib/utils/format'
import { formatCampoValue } from '@/lib/pdf/projeto-completo/formatacao'
import { dateParaDia, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import { ROTULO_TURNO } from '@/lib/memorial/agendamento/status'

type Visita = MemorialAgendamento & { resposta: { camposSnapshot: unknown; dados: unknown } | null }

function Bloco({ titulo, itens }: { titulo: string; itens: [string, ReactNode][] }) {
  const preenchidos = itens.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (preenchidos.length === 0) return null
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {preenchidos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-xs text-slate-500">{rotulo}</dt>
            <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-slate-900">{valor}</dd>
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

export function DetalhesVisita({ visita: v }: { visita: Visita }) {
  const telefone = formatTelefoneBR(v.responsavelTelefone)
  const whatsapp = `https://wa.me/55${v.responsavelTelefone.replace(/\D/g, '')}`

  return (
    <div className="space-y-4">
      <Bloco
        titulo="Visita"
        itens={[
          ['Data', formatarDiaPorExtenso(dateParaDia(v.data))],
          ['Horário', `${v.horaInicio} às ${v.horaFim} (${ROTULO_TURNO[v.turno]})`],
          ['Motivo informado ao visitante', v.motivoRecusa],
        ]}
      />
      <Bloco
        titulo="Grupo"
        itens={[
          ['Tipo de visitante', v.tipoVisitante],
          ['Instituição', v.instituicao],
          ['Pessoas', String(v.quantidade)],
          ['Faixa etária', v.faixaEtaria],
          ['Ano ou turma', v.turma],
          ['Endereço', v.endereco],
          ['Cidade', v.cidade],
        ]}
      />
      <Bloco
        titulo="Responsável"
        itens={[
          ['Nome', v.responsavelNome],
          ['Cargo ou função', v.responsavelCargo],
          ['E-mail', <a key="e" className="text-brand-700 underline underline-offset-2" href={`mailto:${v.responsavelEmail}`}>{v.responsavelEmail}</a>],
          ['Telefone', <a key="t" className="text-brand-700 underline underline-offset-2" href={whatsapp} target="_blank" rel="noopener noreferrer">{telefone} (WhatsApp)</a>],
          ['Prefere ser avisado por', v.preferenciaContato],
        ]}
      />
      <Bloco titulo="Observações do pedido" itens={[['Necessidades específicas', v.necessidades], ['Observações', v.observacoes]]} />
      <Bloco titulo="Perguntas extras" itens={respostasExtras(v.resposta)} />
      <Bloco
        titulo="Registro"
        itens={[
          ['Pedido feito em', formatDateTime(v.createdAt)],
          ['Regulamento aceito', `Versão ${v.regulamentoVersao}, em ${formatDateTime(v.aceiteEm)}`],
          ['Última decisão da equipe', v.decididoEm ? formatDateTime(v.decididoEm) : null],
        ]}
      />
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import { formatDateTime } from '@/lib/utils/format'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { dadosDe, snapshotDe } from '../tipos'

export const metadata: Metadata = { title: 'Resposta do questionário — Portal PNAB Irecê' }

interface Props {
  params: Promise<{ id: string; respostaId: string }>
}

/** Uma resposta inteira, pergunta por pergunta, como ela foi enviada. */
export default async function RespostaPage({ params }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const { id, respostaId } = await params
  const resposta = await prisma.questionarioResposta.findFirst({
    where: { id: respostaId, questionarioId: id },
    include: { questionario: { select: { titulo: true, versao: true } } },
  })
  if (!resposta) notFound()

  const dados = dadosDe(resposta)
  const colunas = colunasDosSnapshots([snapshotDe(resposta)])
  const versaoAntiga = resposta.versao !== resposta.questionario.versao

  return (
    <section className="max-w-3xl">
      <CabecalhoPagina
        titulo={`Resposta ${resposta.protocolo}`}
        descricao={`${resposta.questionario.titulo}. Enviada em ${formatDateTime(resposta.createdAt)}.`}
        voltar={{ href: `/admin/memorial/questionarios/${id}/respostas`, rotulo: 'Todas as respostas' }}
      />
      <div className="mb-4 grid gap-3 rounded-xl border border-tinta-900/10 bg-white p-4 text-sm sm:grid-cols-2">
        <p><span className="block text-tinta-600">Quem enviou</span><span className="font-semibold text-tinta-900">{resposta.nome || 'Não informado'}</span></p>
        <p><span className="block text-tinta-600">E-mail</span><span className="break-all font-semibold text-tinta-900">{resposta.email || 'Não informado'}</span></p>
      </div>
      {versaoAntiga && (
        <p className="mb-4 rounded-lg bg-turquesa-50 px-3 py-2.5 text-sm text-turquesa-900">
          Respondida na versão {resposta.versao} das perguntas (hoje está na {resposta.questionario.versao}). As perguntas abaixo são as que a pessoa viu.
        </p>
      )}
      <dl className="divide-y divide-tinta-900/10 rounded-xl border border-tinta-900/10 bg-white">
        {colunas.map((c, i) => (
          <div key={c.chave} className="grid gap-1 p-4 sm:grid-cols-[2rem_minmax(0,1fr)]">
            <span aria-hidden="true" className="text-sm font-bold tabular-nums text-tinta-500">{i + 1}</span>
            <div>
              <dt className="text-sm font-semibold text-tinta-700">{c.rotulo}</dt>
              <dd className="mt-1 whitespace-pre-line break-words text-base text-tinta-900">
                {valorDaColuna(dados, c.chave) || <span className="italic text-tinta-600">Sem resposta</span>}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

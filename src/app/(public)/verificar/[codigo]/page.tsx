import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { NOME_DO_TIPO, type TipoDocumento } from '@/lib/documentos/titulos'

interface Props {
  params: Promise<{ codigo: string }>
}

export const metadata: Metadata = {
  title: 'Verificação de documento — Portal PNAB Irecê',
  description: 'Confira se um documento foi realmente emitido pelo Portal PNAB de Irecê.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

function formatar(data: Date): string {
  return data.toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Página pública que confirma a emissão de um documento.
 *
 * É o destino do QR impresso em todo PDF do portal. Afirma o que é verdade e
 * verificável: este código foi emitido, nesta data, com este conteúdo.
 */
export default async function VerificarDocumentoPage({ params }: Props) {
  const { codigo } = await params
  const normalizado = decodeURIComponent(codigo).trim().toUpperCase()

  const documento = await prisma.documentoEmitido.findUnique({
    where: { codigo: normalizado },
    select: {
      codigo: true,
      tipo: true,
      titulo: true,
      hashConteudo: true,
      metadados: true,
      emitidoEm: true,
      edital: { select: { titulo: true, ano: true, slug: true } },
    },
  })

  if (!documento) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-900">Documento não encontrado</h1>
          <p className="mt-3 text-sm leading-relaxed text-red-900">
            Nenhum documento foi emitido pelo Portal PNAB Irecê com o código{' '}
            <strong className="font-mono">{normalizado}</strong>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-red-800">
            Confira se o código foi digitado corretamente. Se ele está impresso num documento que
            você recebeu e mesmo assim não aparece aqui, esse documento não foi emitido por este
            portal — procure a Secretaria de Cultura e Turismo antes de considerá-lo válido.
          </p>
          <Link href="/contato" className="mt-5 inline-block text-sm font-medium text-red-900 underline">
            Falar com a Secretaria
          </Link>
        </div>
      </main>
    )
  }

  const rotuloTipo = NOME_DO_TIPO[documento.tipo as TipoDocumento] ?? documento.tipo
  const metadados = (documento.metadados ?? {}) as Record<string, unknown>
  const linhas = Object.entries(metadados).filter(([, v]) => v !== null && v !== undefined)

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Documento autêntico
        </p>
        <h1 className="mt-1 text-xl font-bold text-emerald-950 sm:text-2xl">
          Emitido pelo Portal PNAB Irecê
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          O código <strong className="font-mono">{documento.codigo}</strong> corresponde a um
          documento emitido em {formatar(documento.emitidoEm)}.
        </p>
      </div>

      <dl className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tipo de documento
          </dt>
          <dd className="text-sm text-slate-900">{rotuloTipo}</dd>
        </div>
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Título
          </dt>
          <dd className="text-sm text-slate-900">{documento.titulo}</dd>
        </div>
        {documento.edital && (
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Edital
            </dt>
            <dd className="text-sm text-slate-900">
              <Link href={`/editais/${documento.edital.slug}`} className="text-brand-700 underline">
                {documento.edital.titulo} ({documento.edital.ano})
              </Link>
            </dd>
          </div>
        )}
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Emitido em
          </dt>
          <dd className="text-sm text-slate-900">{formatar(documento.emitidoEm)}</dd>
        </div>
        {linhas.map(([chave, valor]) => (
          <div key={chave} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {chave}
            </dt>
            <dd className="text-sm text-slate-900">{String(valor)}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Identificador do conteúdo
          </dt>
          <dd className="break-all font-mono text-[11px] leading-relaxed text-slate-600">
            {documento.hashConteudo}
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-800">O que esta página confirma</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Que este código foi emitido pelo Portal PNAB Irecê, na data indicada, referente ao
          documento e ao edital acima. Se o documento em suas mãos traz outros números, outras
          datas ou outra lista, ele não é o que foi emitido.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Em caso de dúvida sobre um documento, procure a Secretaria de Cultura e Turismo de Irecê
          informando o código impresso nele.
        </p>
      </div>
    </main>
  )
}

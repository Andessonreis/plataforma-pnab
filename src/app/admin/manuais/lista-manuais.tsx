import Link from 'next/link'
import type { Manual } from '@prisma/client'
import { Badge, Card, IconExternalLink } from '@/components/ui'
import { extensaoDoArquivo } from '@/lib/manuais/regras'

function Situacao({ publicado }: { publicado: boolean }) {
  return <Badge variant={publicado ? 'success' : 'neutral'}>{publicado ? 'Publicado' : 'Oculto'}</Badge>
}

function AbrirArquivo({ manual }: { manual: Manual }) {
  return (
    <a
      href={manual.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500"
    >
      <IconExternalLink className="h-4 w-4" />
      Abrir {extensaoDoArquivo(manual.url).toUpperCase() || 'arquivo'}
      <span className="sr-only">: {manual.titulo} (abre em nova aba)</span>
    </a>
  )
}

const editar = (id: string) => `/admin/manuais/${id}`

/** Cartões no celular, tabela a partir de `sm`. */
export function ListaManuais({ manuais }: { manuais: Manual[] }) {
  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {manuais.map((m) => (
          <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="mb-1 flex items-start justify-between gap-2">
              <Link href={editar(m.id)} className="text-sm font-semibold leading-snug text-slate-900 hover:text-brand-700">
                {m.titulo}
              </Link>
              <Situacao publicado={m.publicado} />
            </div>
            <p className="text-xs text-slate-600">
              {m.categoria}
              {m.versao && ` · v${m.versao}`}
            </p>
            <AbrirArquivo manual={m} />
          </li>
        ))}
      </ul>

      <Card padding="sm" className="hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Manuais e documentos cadastrados</caption>
            <thead>
              <tr className="bg-slate-50">
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">Título</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">Categoria</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">Versão</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">Situação</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">Arquivo</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {manuais.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.titulo}</td>
                  <td className="px-4 py-3 text-slate-600">{m.categoria}</td>
                  <td className="px-4 py-3 text-slate-600">{m.versao ?? '—'}</td>
                  <td className="px-4 py-3"><Situacao publicado={m.publicado} /></td>
                  <td className="px-4 py-1"><AbrirArquivo manual={m} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={editar(m.id)} className="font-medium text-brand-700 hover:text-brand-800">
                      Editar<span className="sr-only"> {m.titulo}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

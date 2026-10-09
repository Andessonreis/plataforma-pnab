import type { Metadata } from 'next'
import Link from 'next/link'
import { buscarNoMemorial } from '@/lib/services/memorial-busca.service'
import { contarConteudo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../require-role'
import { CabecalhoAdmin } from './_componentes/cabecalho-admin'
import { ContagensConteudo } from './_componentes/contagens-conteudo'
import { ResultadoBusca } from './_componentes/resultado-busca'
import { ResumoAgendamentos } from './_componentes/resumo-agendamentos'

export const metadata: Metadata = { title: 'Memorial de Irecê — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<{ q?: string }>
}

const ATALHOS = [
  { href: '/admin/memorial/acervo', rotulo: 'Enviar fotografias' },
  { href: '/admin/memorial/exposicoes/novo', rotulo: 'Nova exposição' },
  { href: '/admin/memorial/pessoas/novo', rotulo: 'Nova pessoa' },
  { href: '/admin/memorial/pessoas/eventos/novo', rotulo: 'Novo evento' },
  { href: '/admin/memorial/configuracoes', rotulo: 'Textos e contatos' },
  { href: '/memorial', rotulo: 'Ver o site do Memorial' },
]

export default async function PainelMemorialPage({ searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const termo = (await searchParams).q?.trim().slice(0, 100) ?? ''
  const [contagens, resultado] = await Promise.all([
    contarConteudo(),
    termo.length >= 2 ? buscarNoMemorial(termo) : Promise.resolve(null),
  ])

  return (
    <section className="space-y-8">
      <CabecalhoAdmin titulo="Memorial de Irecê" descricao="Conteúdo do Memorial: exposições, acervo, pessoas, eventos e textos do site." />

      <ResumoAgendamentos />

      <section aria-labelledby="busca-titulo" className="space-y-4">
        <h2 id="busca-titulo" className="text-base font-semibold text-slate-900">Buscar no Memorial</h2>
        <form role="search" className="flex max-w-xl gap-2">
          <label htmlFor="busca-memorial" className="sr-only">
            Nome, título, etiqueta ou trecho do texto
          </label>
          <input
            id="busca-memorial"
            name="q"
            type="search"
            defaultValue={termo}
            placeholder="Ex.: Zé Bigode"
            minLength={2}
            className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button type="submit" className="min-h-[44px] rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-900">
            Buscar
          </button>
        </form>
        {resultado && <ResultadoBusca termo={termo} resultado={resultado} />}
      </section>

      <section aria-labelledby="conteudo-titulo" className="space-y-4">
        <h2 id="conteudo-titulo" className="text-base font-semibold text-slate-900">Conteúdo</h2>
        <ContagensConteudo contagens={contagens} />
        {contagens.fotosSemAutorizacao > 0 && (
          <p className="text-sm text-amber-800">
            {contagens.fotosSemAutorizacao}{' '}
            {contagens.fotosSemAutorizacao === 1 ? 'fotografia ainda sem autorização de uso registrada.' : 'fotografias ainda sem autorização de uso registrada.'}
          </p>
        )}
      </section>

      <nav aria-label="Atalhos do Memorial">
        <ul className="flex flex-wrap gap-2">
          {ATALHOS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {a.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}

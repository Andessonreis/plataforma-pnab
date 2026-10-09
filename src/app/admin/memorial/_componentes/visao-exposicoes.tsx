import Link from 'next/link'
import { IconBook } from '@/components/ui'
import { BlocoSecao, VazioAcionavel } from '@/app/admin/memorial/_ui'

interface Exposicao {
  id: string
  titulo: string
  subtitulo: string | null
  periodo: string | null
  capaUrl: string | null
}

/** O que o visitante do site vê agora, pela capa: a equipe reconhece a exposição antes de ler. */
export function VisaoExposicoes({ exposicoes }: { exposicoes: Exposicao[] }) {
  return (
    <BlocoSecao titulo="No ar no site" verTudo={{ href: '/admin/memorial/exposicoes', rotulo: 'Todas as exposições' }}>
      {exposicoes.length === 0 ? (
        <VazioAcionavel
          icone={<IconBook className="h-6 w-6" />}
          titulo="Nenhuma exposição no ar"
          texto="O site do Memorial fica sem exposições até uma ser publicada."
          acao={{ href: '/admin/memorial/exposicoes/novo', rotulo: 'Criar exposição' }}
        />
      ) : (
        <ul className="space-y-4">
          {exposicoes.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/memorial/exposicoes/${e.id}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              >
                <div className="aspect-[16/9] overflow-hidden rounded-lg bg-papel-100">
                  {e.capaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.capaUrl} alt="" width={640} height={360} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm font-semibold text-tinta-600">Sem capa</span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold leading-snug text-tinta-900 group-hover:text-brand-700">{e.titulo}</h3>
                {(e.subtitulo || e.periodo) && <p className="text-sm text-tinta-600">{e.subtitulo ?? e.periodo}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlocoSecao>
  )
}

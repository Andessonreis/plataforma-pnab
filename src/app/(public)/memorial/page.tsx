import { BlocoContato } from '@/components/memorial/bloco-contato'
import { CapaMemorial } from '@/components/memorial/capa-memorial'
import { dadosDaHome } from './_componentes/consultas'
import { FaixaVisite } from '@/components/memorial/faixa-visite'
import { GradeFotos } from './_componentes/grade-fotos'
import { LinhaDoTempo } from './_componentes/linha-do-tempo'
import { ListaExposicoes } from './_componentes/lista-exposicoes'
import { RetratosPessoas } from './_componentes/retratos-pessoas'
import { TituloSecao } from './_componentes/titulo-secao'

const LARGURA = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'

/**
 * Página do Memorial de Irecê. Tudo o que aparece vem do banco: textos das
 * configurações e conteúdo publicado pela equipe. Seção sem conteúdo publicado
 * não aparece, em vez de mostrar uma caixa vazia.
 */
export default async function MemorialPage() {
  const d = await dadosDaHome()

  return (
    <>
      <CapaMemorial institucional={d.institucional} foto={d.capa} credito={d.creditoCapa} />

      {d.institucional.texto && (
        <section aria-label="Apresentação" className="bg-papel-100">
          <p className="mx-auto max-w-4xl px-4 py-14 text-xl leading-relaxed text-tinta-800 sm:px-6 sm:py-20 sm:text-2xl lg:px-8">
            {/* Só o primeiro parágrafo; o texto inteiro fica em "Sobre" */}
            {d.institucional.texto.split(/\n\s*\n/)[0]}
          </p>
        </section>
      )}

      {d.exposicoes.length > 0 && (
        <section aria-labelledby="exposicoes-titulo" className="papel-textura bg-papel-50 py-14 sm:py-20">
          <div className={LARGURA}>
            <TituloSecao id="exposicoes-titulo" titulo="Exposições" link={{ href: '/memorial/exposicoes', rotulo: 'Todas as exposições' }} />
            <ListaExposicoes exposicoes={d.exposicoes} />
          </div>
        </section>
      )}

      {d.pessoas.length > 0 && (
        <section aria-labelledby="pessoas-titulo" className="bg-papel-100 py-14 sm:py-20">
          <div className={LARGURA}>
            <TituloSecao
              id="pessoas-titulo"
              titulo="Destaques da memória"
              apoio="Gente que fez a história e a cultura de Irecê."
            />
            <RetratosPessoas pessoas={d.pessoas} />
          </div>
        </section>
      )}

      {d.fotos.length > 0 && (
        <section aria-labelledby="fotos-titulo" className="papel-textura bg-papel-50 py-14 sm:py-20">
          <div className={LARGURA}>
            <TituloSecao
              id="fotos-titulo"
              titulo="Fotografias"
              link={d.totalFotos > d.fotos.length ? { href: '/memorial/fotografias', rotulo: `Ver as ${d.totalFotos} fotografias` } : undefined}
            />
            <GradeFotos fotos={d.fotos} />
          </div>
        </section>
      )}

      {d.eventos.length > 0 && (
        <section aria-labelledby="linha-titulo" className="bg-tinta-950 py-14 text-papel-100 sm:py-20">
          <div className={LARGURA}>
            <TituloSecao
              id="linha-titulo"
              titulo="Linha do tempo"
              claro
              link={d.totalEventos > d.eventos.length ? { href: '/memorial/linha-do-tempo', rotulo: 'Linha do tempo completa' } : undefined}
            />
            <LinhaDoTempo eventos={d.eventos} resumo nivel="h3" />
          </div>
        </section>
      )}

      <FaixaVisite visitacao={d.visitacao} contato={d.contato} />
      <BlocoContato contato={d.contato} />
    </>
  )
}

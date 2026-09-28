import type { TemplateResultado } from '@/lib/edital/template-resultado'
import type { CategoriaPorVaga } from './separar-por-vaga'
import { TabelaClassificacao } from './tabela-classificacao'

interface ClassificacaoPorVagaProps {
  categoria: string
  porVaga: CategoriaPorVaga
  porPontuacao: boolean
  rotulos: TemplateResultado['rotulos']
}

function Subtitulo({ titulo, apoio }: { titulo: string; apoio?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-oliva-700 pb-1.5">
      <h4 className="text-base font-bold text-tinta-900">{titulo}</h4>
      {apoio && <p className="text-sm font-semibold tabular-nums text-oliva-700">{apoio}</p>}
    </div>
  )
}

/**
 * Categoria com cotas vaga a vaga, na mesma ordem da Relação de Classificados
 * impressa: contemplados por ampla concorrência e por cota, depois as suplentes
 * com a modalidade em que concorrem. A posição continua sendo a da
 * classificação geral, para a ordem por nota seguir conferível.
 */
export function ClassificacaoPorVaga({ categoria, porVaga, porPontuacao, rotulos }: ClassificacaoPorVagaProps) {
  const tabela = { porPontuacao, rotulos }
  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-sm leading-relaxed text-tinta-700">
        A posição é a da classificação geral por nota. Quem optou por cota concorre também à ampla concorrência:
        se a nota alcança uma vaga de ampla, entra por ela, e a vaga da cota fica para o próximo optante.
      </p>

      <div className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-700">Contemplados</h3>
        {porVaga.contempladas.map((grupo) => (
          <div key={grupo.titulo} className="space-y-3">
            <Subtitulo titulo={grupo.titulo} apoio={grupo.rotuloVagas} />
            {grupo.linhas.length > 0 && (
              <TabelaClassificacao linhas={grupo.linhas} categoria={`${categoria} — ${grupo.titulo}`} {...tabela} />
            )}
            {grupo.observacao && (
              <p className="border border-tinta-900/15 bg-papel-100 px-4 py-3 text-sm leading-relaxed text-tinta-800">
                <strong>Observação:</strong> {grupo.observacao}
              </p>
            )}
          </div>
        ))}
      </div>

      {porVaga.suplentes.length > 0 && (
        <div className="space-y-3">
          <Subtitulo titulo="Suplentes — em ordem de classificação" />
          <TabelaClassificacao
            linhas={porVaga.suplentes.map((s) => s.linha)}
            modalidades={new Map(porVaga.suplentes.map((s) => [s.linha.numero, s.modalidade]))}
            categoria={`${categoria} — suplentes`}
            {...tabela}
          />
        </div>
      )}

      {porVaga.demais.length > 0 && (
        <div className="space-y-3">
          <Subtitulo titulo="Não classificados" />
          <TabelaClassificacao linhas={porVaga.demais} categoria={`${categoria} — não classificados`} {...tabela} />
        </div>
      )}
    </div>
  )
}

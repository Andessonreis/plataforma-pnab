import { montarClassificacao } from '@/lib/results/classificacao'
import type { CategoriaConfig } from '@/types/categoria-config'
import { ResultadosPreview, type PreviewRow, type VagasConfig } from './resultados-preview'

interface Props {
  editalId: string
  vagas: VagasConfig
  categoriasConfig: CategoriaConfig[] | null
  hasFormula: boolean
  /**
   * Quando true, a prévia ranqueia com a bonificação somada (é o que a
   * publicação faz). Fora isso mostra só a média dos pareceristas — o efeito
   * do bônus não pode vazar antes de a Secretaria liberar o painel.
   */
  incluirBonus?: boolean
}

/**
 * Ranking-prévia: notas calculadas ao vivo, antes de publicar.
 *
 * O cálculo vem de `montarClassificacao`, o mesmo que alimenta o PDF baixado —
 * tela e documento não podem divergir.
 */
export async function PreviewSection({ editalId, vagas, categoriasConfig, hasFormula, incluirBonus = false }: Props) {
  const categorias = await montarClassificacao(editalId, {
    incluirBonus,
    notaMinima: vagas.notaMinima,
    maxSuplentes: vagas.suplentes,
    categoriasConfig,
  })

  const usaCategorias = categoriasConfig != null && categoriasConfig.length > 0

  const rows: PreviewRow[] = categorias.flatMap((c) =>
    c.linhas.map((l) => ({
      inscricaoId: l.inscricaoId,
      numero: l.numero,
      proponenteNome: l.proponenteNome,
      categoria: c.nome === '—' ? null : c.nome,
      notaBase: l.notaBase,
      notaBonus: l.notaBonus,
      notaFinal: l.notaFinal,
      finalizadas: l.finalizadas,
      atribuidos: l.atribuidos,
      empatado: l.empatado,
      statusPrevia: usaCategorias ? l.status : undefined,
      posicaoCategoria: usaCategorias ? l.posicao : undefined,
    })),
  )

  // Sem vagas por categoria o ranking é único no edital inteiro, então a ordem
  // volta a ser global por nota.
  if (!usaCategorias) rows.sort((a, b) => b.notaFinal - a.notaFinal)

  return <ResultadosPreview rows={rows} vagas={vagas} hasFormula={hasFormula} mostraBonus={incluirBonus} />
}

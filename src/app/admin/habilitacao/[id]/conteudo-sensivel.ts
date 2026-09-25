const CONTEUDO_SENSIVEL = ['plano de trabalho', 'planilha orcamentaria']

const normalizarTexto = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function ehSensivel(textos: string[]) {
  return textos.some((t) => CONTEUDO_SENSIVEL.some((s) => normalizarTexto(t).includes(s)))
}

interface ConteudoDaInscricao<E, A, P> {
  etapas: E[]
  anexos: A[]
  pendentes: P[]
}

/**
 * Plano de Trabalho e Planilha Orçamentária são conteúdo de mérito do projeto:
 * a conferência documental não precisa deles. Quem não tem permissão para vê-los
 * recebe as etapas, os anexos e os documentos pendentes sem esses itens.
 */
export function filtrarConteudoSensivel<
  E extends { titulo: string },
  A extends { tipo: string; titulo: string },
  P extends { tipo: string; label: string },
>(conteudo: ConteudoDaInscricao<E, A, P>, podeVer: boolean): ConteudoDaInscricao<E, A, P> {
  if (podeVer) return conteudo

  return {
    etapas: conteudo.etapas.filter((e) => !ehSensivel([e.titulo])),
    anexos: conteudo.anexos.filter((a) => !ehSensivel([a.tipo, a.titulo])),
    pendentes: conteudo.pendentes.filter((p) => !ehSensivel([p.tipo, p.label])),
  }
}

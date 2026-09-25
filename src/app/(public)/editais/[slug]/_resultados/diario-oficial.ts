/**
 * Publicação do Diário Oficial que sustenta a classificação exibida.
 *
 * O resultado preliminar e o final saem em edições diferentes, então o link
 * acompanha a fase: o marco de publicação da fase atual vale, e o do outro
 * resultado nunca serve de substituto para o final.
 */
import type { AcaoPublicacao, CronogramaCustomItem } from '@/types/cronograma'

type MarcoComDiario = Pick<CronogramaCustomItem, 'diarioOficialUrl'> & { acao?: string }

const ACAO_PRELIMINAR: AcaoPublicacao = 'PUBLICACAO_RESULTADO_PRELIMINAR'
const ACAO_FINAL: AcaoPublicacao = 'PUBLICACAO_RESULTADO_FINAL'

function marcosComDiario(cronograma: unknown): MarcoComDiario[] {
  if (!Array.isArray(cronograma)) return []
  return cronograma.filter(
    (marco): marco is MarcoComDiario =>
      typeof marco === 'object' && marco !== null
      && typeof (marco as MarcoComDiario).diarioOficialUrl === 'string'
      && (marco as MarcoComDiario).diarioOficialUrl !== '',
  )
}

/**
 * Link do Diário Oficial da fase, ou `null` quando ainda não foi cadastrado.
 *
 * No resultado final só vale o marco de publicação do resultado final: sem ele
 * a página não mostra Diário Oficial algum, em vez de exibir o do preliminar
 * como se fosse o da lista atual. No preliminar, editais sem ação no marco
 * continuam usando o primeiro link cadastrado que não seja o do resultado final.
 */
export function escolherDiarioOficial(cronograma: unknown, preliminar: boolean): string | null {
  const marcos = marcosComDiario(cronograma)
  const daFase = marcos.find((marco) => marco.acao === (preliminar ? ACAO_PRELIMINAR : ACAO_FINAL))
  if (daFase) return daFase.diarioOficialUrl ?? null
  if (!preliminar) return null
  return marcos.find((marco) => marco.acao !== ACAO_FINAL)?.diarioOficialUrl ?? null
}

/**
 * Texto do botão: inclui o número da edição quando o endereço o traz
 * (o gateway da prefeitura publica como `...Ed 2935.pdf`).
 */
export function rotuloDiarioOficial(url: string): string {
  // O link é digitado à mão no cadastro: um `%` solto não pode derrubar a página.
  let texto = url
  try {
    texto = decodeURIComponent(url)
  } catch {
    // mantém o endereço cru
  }
  const edicao = texto.match(/\bEd\.?\s*(\d{3,5})\b/i)?.[1]
  if (!edicao) return 'Diário Oficial'
  return `Diário Oficial (Edição nº ${Number(edicao).toLocaleString('pt-BR')})`
}

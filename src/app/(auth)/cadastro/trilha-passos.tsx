import type { CSSProperties } from 'react'
import { PASSOS, TOTAL_PASSOS } from './tipos'

interface TrilhaPassosProps {
  /** Etapa corrente, base zero. */
  passo: number
}

/**
 * Cor institucional de cada etapa — mesma lógica de "cor por significado" da
 * home (`PassosInscricao`): brand para abertura, turquesa para acolhimento
 * (é a etapa que define como a Secretaria fala com a pessoa), oliva para
 * fechamento. `vaoSelo` acompanha o branco do painel para o anel duplo do
 * `.selo` ler como carimbo, e não como borda dupla achatada.
 */
const CORES_ETAPA = [
  { texto: 'text-brand-700', preenchido: 'bg-brand-700', anel: 'ring-brand-300', vaoSelo: '#ffffff' },
  { texto: 'text-turquesa-700', preenchido: 'bg-turquesa-700', anel: 'ring-turquesa-300', vaoSelo: '#ffffff' },
  { texto: 'text-oliva-700', preenchido: 'bg-oliva-700', anel: 'ring-oliva-300', vaoSelo: '#ffffff' },
] as const

/**
 * Onde a pessoa está no cadastro.
 *
 * Badges numerados no motivo `.selo` — o mesmo carimbo de anel duplo da
 * numeração de `PassosInscricao` na home — em vez da barra segmentada
 * genérica que não citava nenhum padrão já existente no produto.
 *
 * A lista carrega os nomes das etapas para leitor de tela — quem enxerga lê o
 * título da etapa logo abaixo, e repetir os três em texto visível encheria o
 * topo do formulário.
 */
export function TrilhaPassos({ passo }: TrilhaPassosProps) {
  const { titulo, resumo } = PASSOS[passo]

  return (
    <div className="mb-7">
      <p className="text-sm font-medium text-tinta-700">
        Passo {passo + 1} de {TOTAL_PASSOS}
      </p>

      <ol className="mt-3 flex items-center gap-3" aria-label="Etapas do cadastro">
        {PASSOS.map((etapa, indice) => {
          const cor = CORES_ETAPA[indice]
          const concluida = indice < passo
          const atual = indice === passo

          return (
            <li key={etapa.titulo} aria-current={atual ? 'step' : undefined} className="flex items-center gap-3">
              <span className={atual ? `rounded-full ring-2 ring-offset-2 ${cor.anel}` : undefined}>
                <span
                  className={[
                    'selo titulo h-9 w-9 text-sm',
                    concluida ? `${cor.preenchido} text-white` : cor.texto,
                  ].join(' ')}
                  style={{ '--selo-gap': cor.vaoSelo } as CSSProperties}
                >
                  <span aria-hidden="true">{concluida ? '✓' : indice + 1}</span>
                  <span className="sr-only">
                    {etapa.titulo}
                    {concluida && ' (concluída)'}
                    {atual && ' (etapa atual)'}
                  </span>
                </span>
              </span>
              {indice < PASSOS.length - 1 && (
                <span aria-hidden="true" className="h-px w-6 bg-tinta-900/15" />
              )}
            </li>
          )
        })}
      </ol>

      <h2 className="titulo mt-5 text-lg text-tinta-950">{titulo}</h2>
      <p className="mt-0.5 text-sm text-tinta-700">{resumo}</p>
    </div>
  )
}

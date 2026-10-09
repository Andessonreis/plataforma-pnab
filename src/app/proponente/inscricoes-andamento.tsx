interface InscricoesAndamentoProps {
  total: number
  rascunhos: number
  pendentes: number
  contempladas: number
}

interface Trecho {
  chave: string
  quantidade: number
  rotulo: string
  /** Cor do trecho: as mesmas famílias do carimbo de situação (tinta, âmbar, oliva, ameixa). */
  cor: string
}

/** Frase que resume o momento do proponente, na ordem do que mais importa. */
function historia({ rascunhos, pendentes, contempladas }: InscricoesAndamentoProps): string {
  if (contempladas === 1) return 'Uma das suas inscrições foi contemplada.'
  if (contempladas > 1) return `${contempladas} das suas inscrições foram contempladas.`
  if (pendentes > 0) {
    const sujeito = pendentes === 1 ? 'Sua inscrição enviada está' : 'Suas inscrições enviadas estão'
    return `${sujeito} em análise. O resultado aparece aqui quando for divulgado.`
  }
  if (rascunhos > 0) return 'Você começou inscrições que ainda não foram enviadas.'
  return 'Acompanhe aqui a situação de cada inscrição.'
}

/**
 * Retrato do andamento das inscrições: uma barra dividida em trechos
 * proporcionais, com a contagem escrita ao lado de cada cor, e uma frase que
 * diz o que isso significa. No lugar de quatro números soltos.
 */
export function InscricoesAndamento(props: InscricoesAndamentoProps) {
  const { total, rascunhos, pendentes, contempladas } = props
  const outras = Math.max(0, total - rascunhos - pendentes - contempladas)

  const trechos: Trecho[] = [
    { chave: 'rascunho', quantidade: rascunhos, rotulo: 'em rascunho', cor: 'bg-tinta-400' },
    { chave: 'analise', quantidade: pendentes, rotulo: 'em análise', cor: 'bg-accent-500' },
    {
      chave: 'contemplada',
      quantidade: contempladas,
      rotulo: contempladas === 1 ? 'contemplada' : 'contempladas',
      cor: 'bg-oliva-600',
    },
    { chave: 'outras', quantidade: outras, rotulo: 'com outra situação', cor: 'bg-ameixa-400' },
  ].filter((t) => t.quantidade > 0)

  return (
    <div className="mb-2">
      <p className="text-lg text-tinta-900">{historia(props)}</p>

      <div aria-hidden="true" className="mt-4 flex h-4 border-2 border-tinta-900 bg-white">
        {trechos.map((t) => (
          <span
            key={t.chave}
            style={{ flexGrow: t.quantidade }}
            className={`${t.cor} border-r-2 border-tinta-900 last:border-r-0`}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-tinta-800">
        {trechos.map((t) => (
          <li key={t.chave} className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-3 w-3 border border-tinta-900 ${t.cor}`} />
            <span>
              <strong className="text-base text-tinta-900">{t.quantidade}</strong> {t.rotulo}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

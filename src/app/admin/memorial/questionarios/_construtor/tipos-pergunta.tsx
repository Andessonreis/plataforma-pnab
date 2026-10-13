import type { ReactNode } from 'react'
import { IconCalendar, IconCurrency, IconEdit, IconInfo } from '@/components/ui'
import type { CampoTipo } from '@/types/campo-formulario'

/** Traço único (heroicons outline), o mesmo dos demais ícones do painel. */
function Contorno({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      {children}
    </svg>
  )
}

const caminho = (d: string) =>
  function Icone({ className }: { className?: string }) {
    return <Contorno className={className}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></Contorno>
  }

const IconParagrafo = caminho('M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12')
const IconNumero = caminho('M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5')
const IconLista = caminho('M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.01M3.75 12h.01M3.75 17.25h.01')
const IconQuadros = caminho('M3.75 5.25h16.5v13.5H3.75zM3.75 12h16.5M12 5.25v13.5')
const IconRepetir = caminho('M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99')

function IconUmaOpcao({ className }: { className?: string }) {
  return (
    <Contorno className={className}>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="3.25" fill="currentColor" stroke="none" />
    </Contorno>
  )
}

export interface TipoPergunta {
  tipo: CampoTipo
  rotulo: string
  explicacao: string
  Icone: (p: { className?: string }) => ReactNode
  /** Tipos menos usados ficam atrás de "Mais tipos". */
  avancado?: boolean
}

export const TIPOS_PERGUNTA: TipoPergunta[] = [
  { tipo: 'texto', rotulo: 'Resposta curta', explicacao: 'Nome, cidade, uma palavra', Icone: IconEdit },
  { tipo: 'textarea', rotulo: 'Resposta longa', explicacao: 'Comentário, sugestão, relato', Icone: IconParagrafo },
  { tipo: 'select', rotulo: 'Escolher uma opção', explicacao: 'Sim ou não, uma nota', Icone: IconUmaOpcao },
  { tipo: 'multiselect', rotulo: 'Marcar várias', explicacao: 'Interesses, dias possíveis', Icone: IconLista },
  { tipo: 'numero', rotulo: 'Número', explicacao: 'Quantidade, idade', Icone: IconNumero },
  { tipo: 'data', rotulo: 'Data', explicacao: 'Dia da visita, nascimento', Icone: IconCalendar },
  { tipo: 'info', rotulo: 'Texto de aviso', explicacao: 'Explicação sem resposta', Icone: IconInfo },
  { tipo: 'moeda', rotulo: 'Valor em reais', explicacao: 'Quanto gastou, orçamento', Icone: IconCurrency, avancado: true },
  { tipo: 'tabela', rotulo: 'Tabela', explicacao: 'Várias linhas com as mesmas colunas', Icone: IconQuadros, avancado: true },
  { tipo: 'grupo_repetivel', rotulo: 'Bloco que se repete', explicacao: 'Um conjunto por pessoa do grupo', Icone: IconRepetir, avancado: true },
]

/** Tipos antigos em inglês (text, number...) contam como os equivalentes em português. */
const SINONIMOS: Partial<Record<CampoTipo, CampoTipo>> = { text: 'texto', number: 'numero', date: 'data', currency: 'moeda' }

export function tipoDaPergunta(tipo: CampoTipo): TipoPergunta {
  const alvo = SINONIMOS[tipo] ?? tipo
  return TIPOS_PERGUNTA.find((t) => t.tipo === alvo) ?? TIPOS_PERGUNTA[0]
}

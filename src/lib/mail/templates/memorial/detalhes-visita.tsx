import { Section, Text } from '@react-email/components'
import { colors, styles } from '../_shared/theme'

/** Dados da visita que aparecem em todos os e-mails do agendamento. */
export interface DadosVisitaEmail {
  protocolo: string
  /** Já por extenso: "sexta-feira, 9 de outubro de 2026". */
  data: string
  /** "09:00 às 09:45" */
  horario: string
  instituicao: string
  quantidade: number
}

const rotulo = { ...styles.paragraph, margin: '0', fontSize: '12px', color: colors.textMuted }
const valor = { ...styles.paragraph, margin: '0 0 10px', fontWeight: 600 }

export function DetalhesVisita({ protocolo, data, horario, instituicao, quantidade }: DadosVisitaEmail) {
  const linhas: [string, string][] = [
    ['Protocolo', protocolo],
    ['Data', data],
    ['Horário', horario],
    ['Grupo', `${instituicao} — ${quantidade} ${quantidade === 1 ? 'pessoa' : 'pessoas'}`],
  ]
  return (
    <Section
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px 18px 6px',
        margin: '16px 0',
      }}
    >
      {linhas.map(([r, v]) => (
        <div key={r}>
          <Text style={rotulo}>{r}</Text>
          <Text style={valor}>{v}</Text>
        </div>
      ))}
    </Section>
  )
}

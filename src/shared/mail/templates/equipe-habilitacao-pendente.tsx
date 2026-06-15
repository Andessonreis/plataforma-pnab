import { Heading, Section, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

// Lembrete interno enviado à equipe da Secretaria (ADMIN/HABILITADOR)
// quando há inscrições aguardando análise de habilitação. NÃO confundir
// com o template `habilitacao`, que comunica o RESULTADO da habilitação
// ao proponente.
export interface EquipeHabilitacaoPendenteData {
  nomeAdmin: string
  editalTitulo: string
  editalAno: number
  inscricoesPendentes: number
  url: string
}

export const equipeHabilitacaoPendenteSubject = (d: EquipeHabilitacaoPendenteData) =>
  `Lembrete: ${d.inscricoesPendentes} ${d.inscricoesPendentes === 1 ? 'inscrição aguarda' : 'inscrições aguardam'} habilitação — ${d.editalTitulo}`

const rowLabel = {
  color: colors.textMuted,
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  margin: '0 0 2px',
}

const rowValue = {
  color: colors.text,
  fontSize: '15px',
  lineHeight: 1.5,
  margin: '0 0 12px',
}

export function EquipeHabilitacaoPendente({
  nomeAdmin,
  editalTitulo,
  editalAno,
  inscricoesPendentes,
  url,
}: EquipeHabilitacaoPendenteData) {
  const plural = inscricoesPendentes === 1 ? 'inscrição' : 'inscrições'
  const verbo = inscricoesPendentes === 1 ? 'aguarda' : 'aguardam'

  return (
    <Layout preview={`${inscricoesPendentes} ${plural} ${verbo} habilitação`}>
      <Heading style={styles.h1}>Habilitação aberta — ação pendente</Heading>

      <Text style={styles.paragraph}>
        Olá, <strong>{nomeAdmin}</strong>!
      </Text>

      <Text style={styles.paragraph}>
        A fase de habilitação do edital{' '}
        <strong>{editalTitulo}</strong> ({editalAno}) está em andamento, e{' '}
        <strong>
          {inscricoesPendentes} {plural}
        </strong>{' '}
        {verbo} sua análise.
      </Text>

      <Section
        style={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '16px 18px',
          margin: '16px 0',
        }}
      >
        <Text style={rowLabel}>Edital</Text>
        <Text style={rowValue}>{editalTitulo}</Text>

        <Text style={rowLabel}>Ano</Text>
        <Text style={rowValue}>{editalAno}</Text>

        <Text style={rowLabel}>Inscrições pendentes</Text>
        <Text style={{ ...rowValue, margin: 0 }}>
          {inscricoesPendentes} {plural} enviadas
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        A habilitação verifica documentação e enquadramento das propostas.
        Concluí-la dentro do prazo do cronograma é necessário para liberar a
        fase de avaliação.
      </Text>

      <CtaButton href={url} label="Acessar habilitação" />
    </Layout>
  )
}

import { Heading, Section, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

// Disparado automaticamente pelo scheduler quando um edital sai da fase
// INSCRICOES_ABERTAS. Não confundir com `relatorio_inscricoes` (relatório
// sob demanda, gerado pela tela de exportação) — este é o fechamento
// automático do período, sempre com as duas listas completas em anexo.
export interface EditalInscricaoEncerradaData {
  nomeAdmin: string
  editalTitulo: string
  editalAno: number
  totalEnviadas: number
  totalRascunhos: number
  dataGeracao: string
  url: string
}

export const editalInscricaoEncerradaSubject = (d: EditalInscricaoEncerradaData) =>
  `Inscrições encerradas — ${d.editalTitulo} — ${d.totalEnviadas} inscrição(ões) para habilitar`

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

export function EditalInscricaoEncerrada({
  nomeAdmin,
  editalTitulo,
  editalAno,
  totalEnviadas,
  totalRascunhos,
  dataGeracao,
  url,
}: EditalInscricaoEncerradaData) {
  return (
    <Layout preview={`Período de inscrição encerrado — ${editalTitulo}`}>
      <Heading style={styles.h1}>Período de inscrição encerrado</Heading>

      <Text style={styles.paragraph}>
        Olá, <strong>{nomeAdmin}</strong>!
      </Text>

      <Text style={styles.paragraph}>
        O período de inscrição do edital <strong>{editalTitulo}</strong> ({editalAno})
        se encerrou. Seguem em anexo as duas listas completas geradas na data de fechamento,{' '}
        <strong>{dataGeracao}</strong>.
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
        <Text style={rowLabel}>Lista de inscrições enviadas</Text>
        <Text style={rowValue}>
          {totalEnviadas} {totalEnviadas === 1 ? 'inscrição' : 'inscrições'} — seguem pra fase de habilitação
        </Text>

        <Text style={rowLabel}>Lista de rascunhos (não enviados)</Text>
        <Text style={{ ...rowValue, margin: 0 }}>
          {totalRascunhos} {totalRascunhos === 1 ? 'rascunho' : 'rascunhos'} — documento interno com telefone de contato
        </Text>
      </Section>

      <Text style={styles.paragraph}>
        A lista de rascunhos é de uso interno da Secretaria — contém dados pessoais protegidos
        pela LGPD e não deve ser publicada nem encaminhada para fora da equipe.
      </Text>

      <CtaButton href={url} label="Abrir habilitação" />
    </Layout>
  )
}

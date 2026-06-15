import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface NotificacaoGenericaData {
  titulo: string
  corpo: string
  nome?: string
  link?: string
  ctaLabel?: string
}

export const notificacaoGenericaSubject = (d: NotificacaoGenericaData) =>
  d.titulo

export function NotificacaoGenerica({
  titulo,
  corpo,
  nome,
  link,
  ctaLabel,
}: NotificacaoGenericaData) {
  return (
    <Layout preview={titulo}>
      <Heading style={styles.h1}>{titulo}</Heading>
      {nome && (
        <Text style={styles.paragraph}>
          Olá, <strong>{nome}</strong>!
        </Text>
      )}
      {/*
        `corpo` vem de campanhas criadas no admin (autor confiável).
        Renderizado com dangerouslySetInnerHTML para preservar formatação HTML simples.
        Importante: sanitizar no formulário admin antes de salvar.
      */}
      <div
        style={{
          color: styles.paragraph.color,
          fontSize: '15px',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
        dangerouslySetInnerHTML={{ __html: corpo }}
      />
      {link && ctaLabel && <CtaButton href={link} label={ctaLabel} />}
      {link && !ctaLabel && (
        <Text style={{ ...styles.paragraph, marginTop: '12px' }}>
          Acesse: <a href={link}>{link}</a>
        </Text>
      )}
    </Layout>
  )
}

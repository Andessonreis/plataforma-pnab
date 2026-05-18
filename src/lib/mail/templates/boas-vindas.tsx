import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

export interface BoasVindasData {
  nome: string
  /** URL absoluta da área do proponente. */
  url: string
}

export const boasVindasSubject = (d: BoasVindasData) =>
  `Bem-vindo(a) ao Portal PNAB Irecê, ${d.nome.split(' ')[0]}!`

export function BoasVindas({ nome, url }: BoasVindasData) {
  const primeiroNome = nome.split(' ')[0]

  return (
    <Layout preview="Sua conta no Portal PNAB Irecê foi criada com sucesso">
      <Heading style={styles.h1}>Bem-vindo(a), {primeiroNome}!</Heading>
      <Text style={styles.paragraph}>
        Sua conta no <strong>Portal PNAB Irecê</strong> foi criada com sucesso. Agora
        você pode acompanhar editais, fazer inscrições e abrir recursos pela sua área
        do proponente.
      </Text>
      <Text style={styles.paragraph}>
        Próximos passos:
      </Text>
      <Text style={{ ...styles.paragraph, marginLeft: '12px' }}>
        • Acesse <strong>Editais</strong> para conferir as oportunidades abertas.<br />
        • Em <strong>Minhas inscrições</strong> você acompanha o status de cada proposta.<br />
        • Mantenha seu cadastro atualizado para receber comunicados importantes.
      </Text>
      <CtaButton href={url} label="Acessar minha área" />
      <Text style={{ ...styles.paragraph, fontSize: '13px', color: colors.textMuted }}>
        Se você não criou esta conta, ignore este e-mail ou entre em contato com a
        Secretaria de Arte e Cultura para verificarmos.
      </Text>
    </Layout>
  )
}

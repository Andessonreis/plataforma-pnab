import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface RelatorioInscricoesData {
  /** Nome de quem recebe — a equipe da Secretaria. */
  nome: string
  /** Rótulo do status filtrado (ex: "Rascunho", "Enviada"). */
  statusLabel: string
  /** Data de geração já formatada em pt-BR. */
  dataGeracao: string
  /** Uma linha por edital: "Festival de Arte e Cultura — 54 inscrição(ões)". */
  resumo: string[]
  /** Total de inscrições somando todos os anexos. */
  total: number
  /** Recorte de área aplicado, quando houver. */
  areaLabel?: string
  url?: string
}

export const relatorioInscricoesSubject = (d: RelatorioInscricoesData) =>
  `Relatório de inscrições (${d.statusLabel}) — Portal PNAB Irecê — ${d.dataGeracao}`

export function RelatorioInscricoes({
  nome,
  statusLabel,
  dataGeracao,
  resumo,
  total,
  areaLabel,
  url,
}: RelatorioInscricoesData) {
  const linhas = Array.isArray(resumo) ? resumo : []

  return (
    <Layout preview={`Relatório de inscrições — ${statusLabel} — ${dataGeracao}`}>
      <Heading style={styles.h1}>Relatório de inscrições</Heading>

      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>!
      </Text>

      <Text style={styles.paragraph}>
        Segue em anexo a relação de inscrições com status <strong>{statusLabel}</strong> no
        Portal PNAB Irecê, com telefone de contato de cada proponente. Posição em{' '}
        <strong>{dataGeracao}</strong>, um arquivo por edital.
        {areaLabel ? ` Recorte aplicado: ${areaLabel}.` : ''}
      </Text>

      {linhas.length > 0 && (
        <ul style={{ ...styles.paragraph, paddingLeft: '20px', margin: '16px 0' }}>
          {linhas.map((linha) => (
            <li key={linha} style={{ marginBottom: '4px' }}>
              {linha}
            </li>
          ))}
        </ul>
      )}

      <Text style={styles.paragraph}>
        Total: <strong>{total} inscrição(ões)</strong>.
      </Text>

      {url && <CtaButton href={url} label="Abrir no painel" />}

      <Text style={{ ...styles.paragraph, fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
        Os arquivos contêm dados pessoais protegidos pela LGPD (nome, telefone e CPF/CNPJ
        parcial) e são de uso interno da Secretaria — não devem ser publicados nem
        encaminhados para fora da equipe.
      </Text>
    </Layout>
  )
}

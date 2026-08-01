import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'
import { colors, styles } from './theme'

interface LayoutProps {
  preview: string
  children: ReactNode
}

// Logo precisa ser servido via URL absoluta (clients de e-mail não resolvem
// caminhos relativos). Em prod sai do `NEXT_PUBLIC_SITE_URL`; fallback é o
// domínio oficial pra cobrir contextos onde a env não está carregada (worker,
// testes, etc.).
const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/$/, '')
}

// Resolvido em runtime (não em tempo de import) — testes setam
// NEXT_PUBLIC_SITE_URL depois do módulo já ter sido carregado, e o
// script de piloto pode setar PNAB_EMAIL_ASSET_BASE='cid:inline' pra
// usar inline attachments em vez de URLs públicas.
function getAssetBase(): string {
  return process.env.PNAB_EMAIL_ASSET_BASE || `${getBaseUrl()}/images`
}

function getMarcaUrl(): string {
  // Marca "100 anos régua cultura" — banner institucional oficial com
  // fundo preto embutido nos pixels. Imune à inversão de cores dos
  // clients de email porque o fundo é parte da imagem.
  const base = getAssetBase()
  return base.startsWith('cid:') ? 'cid:marca-100-anos' : `${base}/marca/marca-100-anos.jpeg`
}

function getBrasaoUrl(): string {
  // Brasão oficial de Irecê — selo minimalista (32px) na faixa verde.
  const base = getAssetBase()
  return base.startsWith('cid:') ? 'cid:brasao-irece' : `${base}/marca/brasao-irece.png`
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        {/*
          Bloqueio de dark mode em camadas:
          1. meta color-scheme: respeitado por Apple Mail e Outlook.
          2. [data-ogsc] / [data-ogsb]: seletores que o Gmail Android injeta
             no body quando ativa dark mode — única forma de targetá-lo.
          3. Cor creme (não branca) no selo: escapa do trigger de inversão
             automática que mira só cores de luminância > 90%.
          Por que três camadas? Cada client suporta uma forma diferente.
        */}
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>{`
          :root { color-scheme: light only; supported-color-schemes: light only; }
          /* Gmail Android injeta data-ogsc/data-ogsb no body em dark mode. */
          [data-ogsc] .pnab-logo-bg,
          [data-ogsb] .pnab-logo-bg { background-color: #ffffff !important; }
          [data-ogsc] .pnab-content,
          [data-ogsb] .pnab-content { background-color: #ffffff !important; color: #1f2937 !important; }
          /* iOS Mail e clients que respeitam media queries. */
          @media (prefers-color-scheme: dark) {
            .pnab-logo-bg { background-color: #ffffff !important; }
            .pnab-content { background-color: #ffffff !important; color: #1f2937 !important; }
            .pnab-text { color: #1f2937 !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/*
            Selo institucional: logo colorida oficial sobre fundo branco.
            bgcolor (HTML legacy) é respeitado por Gmail Android mesmo em
            dark mode, quando o style background-color é ignorado.
          */}
          {/*
            Banner institucional "100 anos régua cultura" full-bleed. JPEG
            traz fundo preto embutido nos pixels — imune à inversão.
          */}
          <Section style={styles.logoSection} bgcolor="#000000">
            <Img
              src={getMarcaUrl()}
              alt="Prefeitura de Irecê — 100 anos — Secretaria de Cultura e Turismo"
              width="600"
              height="75"
              style={{ display: 'block', margin: 0, width: '100%', maxWidth: '600px', height: 'auto' }}
            />
          </Section>

          {/* Faixa institucional verde escuro com brasão minimalista. */}
          <Section style={styles.headerBar} bgcolor={colors.primaryDark}>
            <Img
              src={getBrasaoUrl()}
              alt="Brasão de Irecê"
              width="28"
              height="32"
              style={styles.headerBarBrasao}
            />
            <Text style={styles.headerBarText}>
              Prefeitura Municipal de Irecê · Secretaria de Arte e Cultura
            </Text>
          </Section>

          <Section style={styles.content} bgcolor="#ffffff" className="pnab-content">
            {children}
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              Secretaria de Arte e Cultura — Prefeitura Municipal de Irecê/BA
            </Text>
            <Text style={{ ...styles.footer, color: colors.textSubtle, marginTop: '6px', paddingBottom: '20px' }}>
              Este é um e-mail automático. Para suporte, acesse o portal e abra um chamado.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
